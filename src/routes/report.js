const express = require("express");
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

module.exports = router;
