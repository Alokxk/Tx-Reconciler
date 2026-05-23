const { v4: uuidv4 } = require("uuid");
const Transaction = require("../models/Transaction");
const DataQualityIssue = require("../models/DataQualityIssue");
const ReconciliationReport = require("../models/ReconciliationReport");
const { ingestFile } = require("./ingestion");
const { match } = require("./matcher");
const config = require("../config");

async function runReconciliation(
  userFilePath,
  exchangeFilePath,
  overrides = {},
) {
  const runId = uuidv4();

  const tolerances = {
    timestampSeconds:
      overrides.timestampToleranceSeconds ?? config.tolerances.timestampSeconds,
    quantityPct:
      overrides.quantityTolerancePct ?? config.tolerances.quantityPct,
  };

  // Ingest both files
  const userIngestion = await ingestFile(userFilePath, "user", runId);
  const exchangeIngestion = await ingestFile(
    exchangeFilePath,
    "exchange",
    runId,
  );

  // Fetch valid transactions for this run
  const userTxs = await Transaction.find({ runId, source: "user" });
  const exchangeTxs = await Transaction.find({ runId, source: "exchange" });

  // Run matching
  const results = match(userTxs, exchangeTxs, tolerances);

  // Count total data quality issues
  const totalQualityIssues = await DataQualityIssue.countDocuments({ runId });

  // Build and persist report
  const report = await ReconciliationReport.create({
    runId,
    config: {
      timestampToleranceSeconds: tolerances.timestampSeconds,
      quantityTolerancePct: tolerances.quantityPct,
    },
    summary: {
      matched: results.matched.length,
      conflicting: results.conflicting.length,
      unmatchedUser: results.unmatchedUser.length,
      unmatchedExchange: results.unmatchedExchange.length,
      dataQualityIssues: totalQualityIssues,
    },
    matched: results.matched,
    conflicting: results.conflicting,
    unmatchedUser: results.unmatchedUser,
    unmatchedExchange: results.unmatchedExchange,
  });

  return {
    runId: report.runId,
    createdAt: report.createdAt,
    ingestion: {
      user: userIngestion,
      exchange: exchangeIngestion,
    },
    summary: report.summary,
  };
}

module.exports = { runReconciliation };
