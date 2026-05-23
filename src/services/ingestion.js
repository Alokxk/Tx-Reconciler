const fs = require("fs");
const { parse } = require("csv-parse");
const Transaction = require("../models/Transaction");
const DataQualityIssue = require("../models/DataQualityIssue");
const { normalizeAsset } = require("../utils/assetNormalizer");
const { normalizeType } = require("../utils/typeMapper");

const VALID_TYPES = ["BUY", "SELL", "TRANSFER_IN", "TRANSFER_OUT"];

function validateRow(row, rowNumber, seenIds) {
  const reasons = [];

  // Duplicate transaction id within same source
  if (!row.transaction_id || row.transaction_id.trim() === "") {
    reasons.push("missing transaction_id");
  } else if (seenIds.has(row.transaction_id.trim())) {
    reasons.push(`duplicate transaction_id: ${row.transaction_id.trim()}`);
  }

  // Timestamp
  const rawTimestamp = row.timestamp ? row.timestamp.trim() : "";
  const parsedDate = new Date(rawTimestamp);
  if (!rawTimestamp || isNaN(parsedDate.getTime())) {
    reasons.push(`invalid or missing timestamp: "${rawTimestamp}"`);
  }

  // Type
  const type = normalizeType(row.type);
  if (!type) {
    reasons.push("missing type");
  } else if (!VALID_TYPES.includes(type)) {
    reasons.push(`unknown type: "${row.type}"`);
  }

  // Asset
  const asset = normalizeAsset(row.asset);
  if (!asset) {
    reasons.push("missing asset");
  }

  // Quantity
  const quantity = parseFloat(row.quantity);
  if (isNaN(quantity)) {
    reasons.push(`invalid quantity: "${row.quantity}"`);
  } else if (quantity <= 0) {
    reasons.push(`quantity must be positive, got: ${quantity}`);
  }

  return reasons;
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }));

    parser.on("data", (row) => records.push(row));
    parser.on("error", reject);
    parser.on("end", () => resolve(records));
  });
}

async function ingestFile(filePath, source, runId) {
  const rows = await parseCSV(filePath);

  const validTransactions = [];
  const qualityIssues = [];
  const seenIds = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 accounts for 1-based index and header row
    const reasons = validateRow(row, rowNumber, seenIds);

    if (reasons.length > 0) {
      qualityIssues.push({
        runId,
        source,
        rowNumber,
        transactionId: row.transaction_id ? row.transaction_id.trim() : null,
        reasons,
        rawData: row,
      });
    } else {
      seenIds.add(row.transaction_id.trim());
      validTransactions.push({
        runId,
        source,
        transactionId: row.transaction_id.trim(),
        timestamp: new Date(row.timestamp.trim()),
        type: normalizeType(row.type),
        asset: normalizeAsset(row.asset),
        quantity: parseFloat(row.quantity),
        priceUsd:
          row.price_usd && row.price_usd !== ""
            ? parseFloat(row.price_usd)
            : null,
        fee: row.fee && row.fee !== "" ? parseFloat(row.fee) : null,
        note: row.note && row.note !== "" ? row.note.trim() : null,
      });
    }
  }

  if (validTransactions.length > 0) {
    await Transaction.insertMany(validTransactions);
  }

  if (qualityIssues.length > 0) {
    await DataQualityIssue.insertMany(qualityIssues);
  }

  return {
    total: rows.length,
    inserted: validTransactions.length,
    flagged: qualityIssues.length,
  };
}

module.exports = { ingestFile };
