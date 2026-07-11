const { buildPrompt } = require('../ai.promptBuilder');

describe('AI Prompt Builder', () => {
  it('should inject forecast and commitments into the prompt', () => {
    const forecast = [
      { forecastDate: new Date('2026-07-01'), projectedBalance: 1000.5, confidenceLevel: 'HIGH' }
    ];
    const recurringCommitments = [
      { name: 'Rent', amount: 500, type: 'EXPENSE', intervalCount: 1, intervalUnit: 'MONTHLY', nextOccurrenceDate: new Date('2026-07-05') }
    ];

    const prompt = buildPrompt({ forecast, recurringCommitments, question: 'Can I afford this?' });

    expect(prompt).toContain('1000.50');
    expect(prompt).toContain('Rent: $500.00');
    expect(prompt).toContain('Can I afford this?');
    expect(prompt).toContain('"answer"');
    expect(prompt).toContain('"confidence"');
  });

  it('should handle empty data gracefully', () => {
    const prompt = buildPrompt({ forecast: [], recurringCommitments: [], question: 'Hello?' });
    expect(prompt).toContain('No forecast data available.');
    expect(prompt).toContain('No known recurring commitments.');
  });
});
