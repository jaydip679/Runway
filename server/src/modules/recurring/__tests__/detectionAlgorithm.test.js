const { detect, normalize, computeSignature } = require('../detectionAlgorithm');

describe('Detection Algorithm', () => {
  describe('normalize', () => {
    it('lowercases, trims, and collapses whitespace', () => {
      expect(normalize('  NETFLIX   Invoice  ')).toBe('netflix invoice');
    });

    it('strips trailing numeric sequences', () => {
      expect(normalize('Netflix Invoice 4471')).toBe('netflix invoice');
      expect(normalize('Netflix 4471 123')).toBe('netflix');
      expect(normalize('AWS #12345')).toBe('aws');
      expect(normalize('Zoom 123 456')).toBe('zoom');
    });

    it('keeps numbers that are part of words', () => {
      expect(normalize('Office365 Subscription')).toBe('office365 subscription');
    });
  });

  describe('detect', () => {
    const baseTx = {
      accountId: 'acc1',
      categoryId: 'cat1',
      type: 'EXPENSE',
    };

    it('true positive: 3 monthly transactions, same amount, same normalized description', () => {
      const txs = [
        { ...baseTx, description: 'Netflix 1', amount: '15.99', transactionDate: '2023-01-01T10:00:00Z' },
        { ...baseTx, description: 'Netflix 2', amount: '15.99', transactionDate: '2023-02-01T10:00:00Z' },
        { ...baseTx, description: 'Netflix 3', amount: '15.99', transactionDate: '2023-03-01T10:00:00Z' }
      ];

      const candidates = detect(txs);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].name).toBe('netflix');
      expect(candidates[0].intervalUnit).toBe('MONTHLY');
      expect(candidates[0].confidenceScore).toBeGreaterThan(0.7);
    });

    it('amount drift within tolerance (±5%): still grouped as one candidate', () => {
      const txs = [
        { ...baseTx, description: 'Water Bill', amount: '40.00', transactionDate: '2023-01-01T10:00:00Z' },
        { ...baseTx, description: 'Water Bill', amount: '41.00', transactionDate: '2023-02-01T10:00:00Z' },
        { ...baseTx, description: 'Water Bill', amount: '39.00', transactionDate: '2023-03-01T10:00:00Z' }
      ];
      // Mean is 40.00. 5% of 40 is 2. Range is 38 to 42.
      const candidates = detect(txs);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].amount).toBeCloseTo(40.00);
    });

    it('amount drift beyond tolerance: not grouped (treated as separate)', () => {
      const txs = [
        { ...baseTx, description: 'Electric Bill', amount: '100.00', transactionDate: '2023-01-01T10:00:00Z' },
        { ...baseTx, description: 'Electric Bill', amount: '200.00', transactionDate: '2023-02-01T10:00:00Z' },
      ];
      // 5% of 150 is 7.5. 100 and 200 are way out.
      const candidates = detect(txs);
      expect(candidates).toHaveLength(0);
    });

    it('interval inconsistency beyond tolerance: not grouped', () => {
      const txs = [
        { ...baseTx, description: 'Gym', amount: '50.00', transactionDate: '2023-01-01T10:00:00Z' },
        { ...baseTx, description: 'Gym', amount: '50.00', transactionDate: '2023-01-15T10:00:00Z' }, // 14 days
        { ...baseTx, description: 'Gym', amount: '50.00', transactionDate: '2023-02-28T10:00:00Z' }  // 44 days
      ];
      // Irregular spacing.
      const candidates = detect(txs);
      expect(candidates).toHaveLength(0);
    });

    it('single occurrence only: never a candidate', () => {
      const txs = [
        { ...baseTx, description: 'Spotify', amount: '9.99', transactionDate: '2023-01-01T10:00:00Z' }
      ];
      const candidates = detect(txs);
      expect(candidates).toHaveLength(0);
    });

    it('weekly cadence tolerance (±1 day)', () => {
      const txs = [
        { ...baseTx, description: 'Coffee', amount: '5.00', transactionDate: '2023-01-01T10:00:00Z' },
        { ...baseTx, description: 'Coffee', amount: '5.00', transactionDate: '2023-01-09T10:00:00Z' }, // +8 days (allowed, up to 1 day drift)
        { ...baseTx, description: 'Coffee', amount: '5.00', transactionDate: '2023-01-16T10:00:00Z' }  // +7 days
      ];
      const candidates = detect(txs);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].intervalUnit).toBe('WEEKLY');
    });

    it('description normalization: groups Netflix Invoice 4471 and 4522', () => {
      const txs = [
        { ...baseTx, description: 'Netflix Invoice 4471', amount: '15.99', transactionDate: '2023-01-01T10:00:00Z' },
        { ...baseTx, description: 'Netflix Invoice 4522', amount: '15.99', transactionDate: '2023-02-01T10:00:00Z' }
      ];
      const candidates = detect(txs);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].name).toBe('netflix invoice');
    });
  });
});
