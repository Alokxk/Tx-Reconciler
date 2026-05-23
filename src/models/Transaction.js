const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, index: true },
    source: { type: String, enum: ["user", "exchange"], required: true },
    transactionId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    type: { type: String, required: true },
    asset: { type: String, required: true },
    quantity: { type: Number, required: true },
    priceUsd: { type: Number, default: null },
    fee: { type: Number, default: null },
    note: { type: String, default: null },
  },
  { timestamps: false },
);

module.exports = mongoose.model("Transaction", transactionSchema);
