const mongoose = require("mongoose");

const dataQualityIssueSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, index: true },
    source: { type: String, enum: ["user", "exchange"], required: true },
    rowNumber: { type: Number, required: true },
    transactionId: { type: String, default: null },
    reasons: [{ type: String }],
    rawData: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: false },
);

module.exports = mongoose.model("DataQualityIssue", dataQualityIssueSchema);
