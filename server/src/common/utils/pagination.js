/**
 * Encode a compound cursor from transactionDate and id.
 * @param {Date|string} date 
 * @param {string} id 
 * @returns {string} base64url encoded cursor
 */
const encodeCursor = (date, id) => {
  if (!date || !id) return null;
  const dateStr = date instanceof Date ? date.toISOString() : date;
  const raw = `${dateStr}|${id}`;
  return Buffer.from(raw).toString('base64url');
};

/**
 * Decode a base64url cursor back into date and id.
 * @param {string} cursor 
 * @returns {{ date: string, id: string }|null}
 */
const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8');
    const [date, id] = raw.split('|');
    if (!date || !id) return null;
    return { date, id };
  } catch (err) {
    return null;
  }
};

module.exports = {
  encodeCursor,
  decodeCursor
};
