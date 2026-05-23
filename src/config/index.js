module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || "mongodb://mongo:27017/tx-reconciler",
  tolerances: {
    timestampSeconds: parseInt(
      process.env.TIMESTAMP_TOLERANCE_SECONDS || "300",
      10,
    ),
    quantityPct: parseFloat(process.env.QUANTITY_TOLERANCE_PCT || "0.01"),
  },
};
