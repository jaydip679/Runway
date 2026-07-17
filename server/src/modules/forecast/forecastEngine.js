const { Decimal } = require('@prisma/client/runtime/library');
const { addDays, isSameDay } = require('date-fns');

/**
 * Pure function to compute the 60-day forecast.
 * @param {Object} params
 * @param {Decimal} params.dayZeroBalance - Sum of all active account balances
 * @param {Array} params.confirmedRecurring - Array of confirmed recurring commitments
 * @param {Decimal} params.discretionaryDaily - Average daily discretionary spend (always positive)
 * @param {number} [params.windowDays=60] - Number of days to forecast
 * @param {Array} [params.oneTimeEvents=[]] - Array of { date, amount, type } for scenario planning
 * @returns {Array} Array of ForecastDay objects { forecastDate, projectedBalance, confidenceLevel }
 */
function computeForecast({ dayZeroBalance, confirmedRecurring, discretionaryDaily, windowDays = 60, oneTimeEvents = [] }) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let runningBalance = new Decimal(dayZeroBalance);
  const dailyDiscretionary = new Decimal(discretionaryDaily);

  for (let i = 1; i <= windowDays; i++) {
    const currentDay = addDays(today, i);
    let confidenceLevel = 'LOW';
    if (i <= 14) confidenceLevel = 'HIGH';
    else if (i <= 30) confidenceLevel = 'MEDIUM';

    // Discretionary spend is always an expense (subtracted)
    runningBalance = runningBalance.minus(dailyDiscretionary);

    // Evaluate all confirmed recurring commitments for this day
    for (const commitment of confirmedRecurring) {
      if (isOccurrenceDay(commitment, currentDay)) {
        const amt = new Decimal(commitment.amount);
        if (commitment.type === 'INCOME') {
          runningBalance = runningBalance.plus(amt);
        } else if (commitment.type === 'EXPENSE') {
          runningBalance = runningBalance.minus(amt);
        }
      }
    }

    // Evaluate scenario one-time events for this day
    for (const event of oneTimeEvents) {
      if (isSameDay(currentDay, new Date(event.date))) {
        const amt = new Decimal(event.amount);
        if (event.type === 'ONE_TIME_INCOME') {
          runningBalance = runningBalance.plus(amt);
        } else if (event.type === 'ONE_TIME_EXPENSE') {
          runningBalance = runningBalance.minus(amt);
        }
      }
    }

    days.push({
      forecastDate: currentDay,
      projectedBalance: new Decimal(runningBalance),
      confidenceLevel,
    });
  }

  return days;
}

/**
 * Determines if a given day is an occurrence day for a commitment by expanding it forward.
 * Note: A more efficient approach for very long windows might pre-expand, but for 60 days
 * scanning forward from nextOccurrenceDate is fine.
 */
function isOccurrenceDay(commitment, targetDay) {
  const nextOccurrenceDate = new Date(commitment.nextOccurrenceDate);
  nextOccurrenceDate.setHours(0, 0, 0, 0);

  // If targetDay is before the very first occurrence, it's not an occurrence day.
  if (targetDay < nextOccurrenceDate) {
    return false;
  }

  // If it's exactly the next occurrence date, it's a match.
  if (isSameDay(targetDay, nextOccurrenceDate)) {
    return true;
  }

  // Expand forward based on intervalUnit and intervalCount
  let currentOccurrence = new Date(nextOccurrenceDate);
  const { intervalUnit, intervalCount } = commitment;

  // We cap iteration to avoid infinite loops, though targetDay is bounded by windowDays (60).
  while (currentOccurrence <= targetDay) {
    if (isSameDay(currentOccurrence, targetDay)) {
      return true;
    }

    switch (intervalUnit) {
      case 'DAILY':
        currentOccurrence.setDate(currentOccurrence.getDate() + intervalCount);
        break;
      case 'WEEKLY':
        currentOccurrence.setDate(currentOccurrence.getDate() + (7 * intervalCount));
        break;
      case 'MONTHLY':
        currentOccurrence.setMonth(currentOccurrence.getMonth() + intervalCount);
        break;
      case 'YEARLY':
        currentOccurrence.setFullYear(currentOccurrence.getFullYear() + intervalCount);
        break;
      default:
        // Unknown interval, just break out
        return false;
    }
  }

  return false;
}

module.exports = {
  computeForecast,
  isOccurrenceDay,
};
