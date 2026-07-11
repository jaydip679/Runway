/**
 * Pure function to build the prompt for the AI affordability query.
 * 
 * @param {Object} params
 * @param {Object[]} params.forecast - Array of forecast snapshot objects
 * @param {Object[]} params.recurringCommitments - Array of confirmed recurring commitments
 * @param {String} params.question - The user's question
 * @returns {String} The constructed prompt
 */
const buildPrompt = ({ forecast, recurringCommitments, question }) => {
  const forecastContext = forecast.slice(0, 30).map((f) => 
    `- Date: ${f.forecastDate.toLocaleDateString()}, Projected Balance: $${f.projectedBalance.toFixed(2)}, Confidence: ${f.confidenceLevel}`
  ).join('\n');

  const commitmentsContext = recurringCommitments.map((c) => 
    `- ${c.name}: $${c.amount.toFixed(2)} (${c.type}) every ${c.intervalCount} ${c.intervalUnit} (Next: ${c.nextOccurrenceDate.toLocaleDateString()})`
  ).join('\n');

  return `
You are Runway's AI Affordability Assistant. Your goal is to answer the user's financial question based STRICTLY on the data provided below.
Do not originate figures. Do not make assumptions about income or expenses not present in the data.

### Forecast Data (Next 30 Days)
${forecastContext || 'No forecast data available.'}

### Known Recurring Commitments
${commitmentsContext || 'No known recurring commitments.'}

### User's Question
"${question}"

### Instructions
Analyze the forecast data and commitments to answer the user's question. 
Output your response as a raw JSON object with NO markdown formatting, NO \`\`\`json wrappers, exactly matching this schema:
{
  "answer": "A concise, direct answer to the question (1-2 sentences).",
  "reasoning": "A brief explanation of how you arrived at this answer, citing specific dates and balances from the data.",
  "confidence": "HIGH", "MEDIUM", or "LOW"
}
`;
};

module.exports = { buildPrompt };
