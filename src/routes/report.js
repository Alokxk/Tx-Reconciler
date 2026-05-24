const express = require("express");
const { stringify } = require("csv-stringify/sync");
const ReconciliationReport = require("../models/ReconciliationReport");
const DataQualityIssue = require("../models/DataQualityIssue");

const router = express.Router();

router.get("/runs", async (req, res) => {
  try {
    const runs = await ReconciliationReport.find(
      {},
      { runId: 1, createdAt: 1, summary: 1, config: 1, _id: 0 },
    ).sort({ createdAt: -1 });
    return res.json(runs);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to fetch runs", detail: err.message });
  }
});

router.get("/report/:runId", async (req, res) => {
  try {
    const report = await ReconciliationReport.findOne(
      { runId: req.params.runId },
      { __v: 0 },
    );
    if (!report) return res.status(404).json({ error: "Run not found" });
    return res.json(report);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to fetch report", detail: err.message });
  }
});

router.get("/report/:runId/summary", async (req, res) => {
  try {
    const report = await ReconciliationReport.findOne(
      { runId: req.params.runId },
      { runId: 1, createdAt: 1, summary: 1, config: 1, _id: 0 },
    );
    if (!report) return res.status(404).json({ error: "Run not found" });
    return res.json(report);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to fetch summary", detail: err.message });
  }
});

router.get("/report/:runId/unmatched", async (req, res) => {
  try {
    const report = await ReconciliationReport.findOne(
      { runId: req.params.runId },
      { unmatchedUser: 1, unmatchedExchange: 1, _id: 0 },
    );
    if (!report) return res.status(404).json({ error: "Run not found" });
    return res.json({
      unmatchedUser: report.unmatchedUser,
      unmatchedExchange: report.unmatchedExchange,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to fetch unmatched", detail: err.message });
  }
});

router.get("/report/:runId/quality-issues", async (req, res) => {
  try {
    const report = await ReconciliationReport.findOne(
      { runId: req.params.runId },
      { _id: 0, runId: 1 },
    );
    if (!report) return res.status(404).json({ error: "Run not found" });
    const issues = await DataQualityIssue.find(
      { runId: req.params.runId },
      { __v: 0, _id: 0 },
    );
    return res.json({ runId: req.params.runId, total: issues.length, issues });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to fetch quality issues", detail: err.message });
  }
});

router.get("/report/:runId/export", async (req, res) => {
  try {
    const report = await ReconciliationReport.findOne({
      runId: req.params.runId,
    });
    if (!report) return res.status(404).json({ error: "Run not found" });

    const toISO = (v) => (v ? new Date(v).toISOString() : null);
    const rows = [];

    for (const entry of report.matched) {
      rows.push({
        category: "MATCHED",
        user_transaction_id: entry.userTransaction.transactionId,
        user_timestamp: toISO(entry.userTransaction.timestamp),
        user_type: entry.userTransaction.type,
        user_asset: entry.userTransaction.asset,
        user_quantity: entry.userTransaction.quantity,
        exchange_transaction_id: entry.exchangeTransaction.transactionId,
        exchange_timestamp: toISO(entry.exchangeTransaction.timestamp),
        exchange_type: entry.exchangeTransaction.type,
        exchange_asset: entry.exchangeTransaction.asset,
        exchange_quantity: entry.exchangeTransaction.quantity,
        reason: entry.reason,
      });
    }

    for (const entry of report.conflicting) {
      rows.push({
        category: "CONFLICTING",
        user_transaction_id: entry.userTransaction.transactionId,
        user_timestamp: toISO(entry.userTransaction.timestamp),
        user_type: entry.userTransaction.type,
        user_asset: entry.userTransaction.asset,
        user_quantity: entry.userTransaction.quantity,
        exchange_transaction_id: entry.exchangeTransaction.transactionId,
        exchange_timestamp: toISO(entry.exchangeTransaction.timestamp),
        exchange_type: entry.exchangeTransaction.type,
        exchange_asset: entry.exchangeTransaction.asset,
        exchange_quantity: entry.exchangeTransaction.quantity,
        reason: entry.reason,
      });
    }

    for (const entry of report.unmatchedUser) {
      rows.push({
        category: "UNMATCHED_USER",
        user_transaction_id: entry.transaction.transactionId,
        user_timestamp: toISO(entry.transaction.timestamp),
        user_type: entry.transaction.type,
        user_asset: entry.transaction.asset,
        user_quantity: entry.transaction.quantity,
        exchange_transaction_id: null,
        exchange_timestamp: null,
        exchange_type: null,
        exchange_asset: null,
        exchange_quantity: null,
        reason: entry.reason,
      });
    }

    for (const entry of report.unmatchedExchange) {
      rows.push({
        category: "UNMATCHED_EXCHANGE",
        user_transaction_id: null,
        user_timestamp: null,
        user_type: null,
        user_asset: null,
        user_quantity: null,
        exchange_transaction_id: entry.transaction.transactionId,
        exchange_timestamp: toISO(entry.transaction.timestamp),
        exchange_type: entry.transaction.type,
        exchange_asset: entry.transaction.asset,
        exchange_quantity: entry.transaction.quantity,
        reason: entry.reason,
      });
    }

    const csv = stringify(rows, { header: true });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${req.params.runId}.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to export report", detail: err.message });
  }
});

module.exports = router;
