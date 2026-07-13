/**
 * In-memory trailing hour metrics tracker.
 * Implements a sliding window of 60 buckets (1 minute each) to track
 * request counts and error counts.
 */

class MetricsTracker {
  constructor() {
    this.numBuckets = 60;
    this.buckets = new Array(this.numBuckets).fill(null).map(() => ({ reqs: 0, errs: 0, timestamp: 0 }));
    this.currentBucketIndex = 0;
    this.lastMinute = Math.floor(Date.now() / 60000);
  }

  _tick() {
    const currentMinute = Math.floor(Date.now() / 60000);
    const diff = currentMinute - this.lastMinute;

    if (diff > 0) {
      if (diff >= this.numBuckets) {
        // More than an hour passed, clear all buckets
        for (let i = 0; i < this.numBuckets; i++) {
          this.buckets[i] = { reqs: 0, errs: 0, timestamp: currentMinute - diff + i + 1 };
        }
      } else {
        // Clear missed buckets
        for (let i = 1; i <= diff; i++) {
          const idx = (this.currentBucketIndex + i) % this.numBuckets;
          this.buckets[idx] = { reqs: 0, errs: 0, timestamp: this.lastMinute + i };
        }
      }
      this.currentBucketIndex = (this.currentBucketIndex + diff) % this.numBuckets;
      this.lastMinute = currentMinute;
    }
  }

  recordRequest() {
    this._tick();
    this.buckets[this.currentBucketIndex].reqs += 1;
  }

  recordError() {
    this._tick();
    this.buckets[this.currentBucketIndex].errs += 1;
  }

  getTrailingHourMetrics() {
    this._tick();
    
    let totalReqs = 0;
    let totalErrs = 0;
    
    const oneHourAgo = this.lastMinute - this.numBuckets;
    
    for (const bucket of this.buckets) {
      if (bucket.timestamp > oneHourAgo) {
        totalReqs += bucket.reqs;
        totalErrs += bucket.errs;
      }
    }
    
    const errorRate = totalReqs > 0 ? totalErrs / totalReqs : 0;
    
    return {
      totalRequests: totalReqs,
      totalErrors: totalErrs,
      errorRate
    };
  }
}

// Export a singleton instance
module.exports = new MetricsTracker();
