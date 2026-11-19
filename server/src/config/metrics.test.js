const { register, getMetrics } = require('./metrics');

describe('Prometheus Metrics Module', () => {
  it('registers default runtime metrics and custom HTTP metrics', async () => {
    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain('http_request_duration_seconds');
    expect(metricsOutput).toContain('http_requests_total');
    expect(metricsOutput).toContain('process_cpu_user_seconds_total');
  });

  it('getMetrics sends metrics with proper Content-Type header', async () => {
    const req = {};
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getMetrics(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', register.contentType);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('http_requests_total'));
  });
});
