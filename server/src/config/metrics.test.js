const { register, getMetrics, normalizeRoute, isInternalRequest } = require('./metrics');

describe('Prometheus Metrics Module', () => {
  it('registers default runtime metrics and custom HTTP metrics', async () => {
    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain('http_request_duration_seconds');
    expect(metricsOutput).toContain('http_requests_total');
    expect(metricsOutput).toContain('process_cpu_user_seconds_total');
  });

  it('normalizes UUIDs and numeric IDs to prevent high cardinality', () => {
    const pathWithUuid = '/api/v1/transactions/458f0d8b-ff66-4ca5-90c5-0e4a4fc698bd';
    const pathWithNumId = '/api/v1/accounts/12345';
    const pathWithQuery = '/api/v1/categories?sort=desc&limit=10';

    expect(normalizeRoute(pathWithUuid)).toBe('/api/v1/transactions/:id');
    expect(normalizeRoute(pathWithNumId)).toBe('/api/v1/accounts/:id');
    expect(normalizeRoute(pathWithQuery)).toBe('/api/v1/categories');
  });

  it('allows internal loopback requests and denies unauthorized external requests', () => {
    const loopbackIpv4 = { ip: '127.0.0.1' };
    const loopbackIpv6 = { ip: '::1' };
    const externalIp = { ip: '203.0.113.195', headers: {} };

    // Test helper logic directly
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    expect(isInternalRequest(loopbackIpv4)).toBe(true);
    expect(isInternalRequest(loopbackIpv6)).toBe(true);
    expect(isInternalRequest(externalIp)).toBe(false);

    process.env.NODE_ENV = originalEnv;
  });

  it('getMetrics sends metrics with proper Content-Type header on internal request', async () => {
    const req = { ip: '127.0.0.1' };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getMetrics(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', register.contentType);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('http_requests_total'));
  });

  it('getMetrics responds with 403 on external untrusted request', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const req = { ip: '198.51.100.25', headers: {} };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getMetrics(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Access Denied: Internal Metrics Only');

    process.env.NODE_ENV = originalEnv;
  });
});
