const mongoose = require("mongoose");

const matchedEntrySchema = new mongoose.Schema(
  {
    userTransaction: { type: mongoose.Schema.Types.Mixed },
    exchangeTransaction: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
  },
  { _id: false },
);

const unmatchedEntrySchema = new mongoose.Schema(
  {
    transaction: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
  },
  { _id: false },
);

const reconciliationReportSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, unique: true, index: true },
    createdAt: { type: Date, default: Date.now },
    config: {
      timestampToleranceSeconds: { type: Number },
      quantityTolerancePct: { type: Number },
    },
    summary: {
      matched: { type: Number, default: 0 },
      conflicting: { type: Number, default: 0 },
      unmatchedUser: { type: Number, default: 0 },
      unmatchedExchange: { type: Number, default: 0 },
      dataQualityIssues: { type: Number, default: 0 },
    },
    matched: [matchedEntrySchema],
    conflicting: [matchedEntrySchema],
    unmatchedUser: [unmatchedEntrySchema],
    unmatchedExchange: [unmatchedEntrySchema],
  },
  { timestamps: false },
);

module.exports = mongoose.model(
  "ReconciliationReport",
  reconciliationReportSchema,
);
