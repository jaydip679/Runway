const crypto = require('crypto');
const { differenceInDays, addDays, addMonths, startOfDay } = require('date-fns');

function normalize(description) {
  if (!description) return '';
  let norm = description.toLowerCase().trim().replace(/\s+/g, ' ');
  // Strip trailing numeric sequences (e.g. "netflix invoice 4471")
  // Matches space followed by optional # and numbers at the end of the string
  norm = norm.replace(/(?:\s+#?\d+)+$/, '');
  return norm.trim();
}

function computeSignature(accountId, categoryId, description) {
  const normDesc = normalize(description);
  const raw = `${accountId}|${categoryId || 'none'}|${normDesc}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} - Array of candidate groups
 */
function detect(transactions) {
  // 1. Group by signature
  const groups = {};
  for (const tx of transactions) {
    const sig = computeSignature(tx.accountId, tx.categoryId, tx.description);
    if (!groups[sig]) {
      groups[sig] = {
        signature: sig,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        name: normalize(tx.description), // Base name on normalized desc
        type: tx.type,
        transactions: []
      };
    }
    groups[sig].transactions.push(tx);
  }

  const candidates = [];

  // 2. Evaluate each group
  for (const sig in groups) {
    const group = groups[sig];
    const txs = group.transactions.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));

    if (txs.length < 2) continue;

    // Check amount consistency (±5% of mean)
    const amounts = txs.map(t => parseFloat(t.amount));
    const meanAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    
    let amountsConsistent = true;
    for (const amt of amounts) {
      if (amt < meanAmount * 0.95 || amt > meanAmount * 1.05) {
        amountsConsistent = false;
        break;
      }
    }
    if (!amountsConsistent) continue;

    // Check interval consistency
    const intervals = [];
    for (let i = 1; i < txs.length; i++) {
      const days = differenceInDays(
        startOfDay(new Date(txs[i].transactionDate)),
        startOfDay(new Date(txs[i - 1].transactionDate))
      );
      intervals.push(days);
    }

    const meanInterval = intervals.reduce((sum, d) => sum + d, 0) / intervals.length;
    
    let intervalUnit = null;
    let intervalsConsistent = true;
    let nextOccurrenceDate = null;
    const lastDate = startOfDay(new Date(txs[txs.length - 1].transactionDate));

    if (meanInterval >= 6 && meanInterval <= 8) {
      intervalUnit = 'WEEKLY';
      // ±1 day tolerance for weekly
      for (const inv of intervals) {
        if (Math.abs(inv - 7) > 1) {
          intervalsConsistent = false;
          break;
        }
      }
      nextOccurrenceDate = addDays(lastDate, 7);
    } else if (meanInterval >= 25 && meanInterval <= 35) {
      intervalUnit = 'MONTHLY';
      // ±3 days tolerance for monthly
      for (const inv of intervals) {
        // Evaluate strictly against 30 days as per SRS, or against meanInterval
        if (Math.abs(inv - 30) > 3 && Math.abs(inv - meanInterval) > 3) {
          intervalsConsistent = false;
          break;
        }
      }
      nextOccurrenceDate = addMonths(lastDate, 1);
    } else {
      intervalsConsistent = false;
    }

    if (!intervalsConsistent) continue;

    let confidenceScore = 0.5;
    if (txs.length >= 3) confidenceScore += 0.2;
    if (txs.length >= 5) confidenceScore += 0.1;
    
    const maxAmountDeviation = Math.max(...amounts.map(a => Math.abs(a - meanAmount))) / meanAmount;
    if (maxAmountDeviation <= 0.01) confidenceScore += 0.2;
    else if (maxAmountDeviation <= 0.03) confidenceScore += 0.1;
    
    confidenceScore = Math.min(confidenceScore, 1.0);

    candidates.push({
      groupSignature: sig,
      accountId: group.accountId,
      categoryId: group.categoryId,
      name: group.name,
      amount: meanAmount,
      type: group.type,
      intervalUnit: intervalUnit,
      intervalCount: 1,
      nextOccurrenceDate: nextOccurrenceDate,
      detectionSource: 'AUTO_DETECTED',
      confidenceScore: confidenceScore
    });
  }

  return candidates;
}

module.exports = { detect, normalize, computeSignature };
