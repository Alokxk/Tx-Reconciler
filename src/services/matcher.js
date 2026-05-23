const { normalizeAsset } = require("../utils/assetNormalizer");
const { normalizeType, typesAreCompatible } = require("../utils/typeMapper");

function toSeconds(date) {
  return Math.floor(new Date(date).getTime() / 1000);
}

function quantityDiffPct(a, b) {
  if (b === 0) return a === 0 ? 0 : Infinity;
  return Math.abs(a - b) / b;
}

function match(userTransactions, exchangeTransactions, config) {
  const { timestampSeconds = 300, quantityPct = 0.01 } = config;

  const results = {
    matched: [],
    conflicting: [],
    unmatchedUser: [],
    unmatchedExchange: [],
  };

  // Track which exchange transactions have been matched
  const matchedExchangeIds = new Set();

  for (const userTx of userTransactions) {
    const userAsset = normalizeAsset(userTx.asset);
    const userType = normalizeType(userTx.type);
    const userTime = toSeconds(userTx.timestamp);

    // Find all exchange candidates for this user transaction
    const candidates = exchangeTransactions.filter((exTx) => {
      if (matchedExchangeIds.has(exTx._id.toString())) return false;

      const exAsset = normalizeAsset(exTx.asset);
      const exType = normalizeType(exTx.type);
      const exTime = toSeconds(exTx.timestamp);

      const assetMatches = userAsset === exAsset;
      const typeMatches = typesAreCompatible(userType, exType);
      const timeMatches = Math.abs(userTime - exTime) <= timestampSeconds;

      return assetMatches && typeMatches && timeMatches;
    });

    if (candidates.length === 0) {
      results.unmatchedUser.push({
        transaction: userTx,
        reason: "No matching exchange transaction found within tolerance",
      });
      continue;
    }

    // Pick the closest candidate by timestamp delta
    const best = candidates.reduce((prev, curr) => {
      const prevDelta = Math.abs(toSeconds(prev.timestamp) - userTime);
      const currDelta = Math.abs(toSeconds(curr.timestamp) - userTime);
      return currDelta < prevDelta ? curr : prev;
    });

    const qtyDiff = quantityDiffPct(userTx.quantity, best.quantity);

    if (qtyDiff <= quantityPct) {
      matchedExchangeIds.add(best._id.toString());
      results.matched.push({
        userTransaction: userTx,
        exchangeTransaction: best,
        reason: `matched within timestamp tolerance of ${timestampSeconds}s and quantity tolerance of ${quantityPct * 100}%`,
      });
    } else {
      matchedExchangeIds.add(best._id.toString());
      results.conflicting.push({
        userTransaction: userTx,
        exchangeTransaction: best,
        reason: `quantity mismatch: user=${userTx.quantity}, exchange=${best.quantity}, diff=${(qtyDiff * 100).toFixed(4)}% exceeds tolerance of ${quantityPct * 100}%`,
      });
    }
  }

  // Remaining exchange transactions with no match
  for (const exTx of exchangeTransactions) {
    if (!matchedExchangeIds.has(exTx._id.toString())) {
      results.unmatchedExchange.push({
        transaction: exTx,
        reason: "No matching user transaction found within tolerance",
      });
    }
  }

  return results;
}

module.exports = { match };
