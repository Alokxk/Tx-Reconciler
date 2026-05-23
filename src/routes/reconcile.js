const express = require("express");
const path = require("path");
const { runReconciliation } = require("../services/reporter");

const router = express.Router();

router.post("/reconcile", async (req, res) => {
  try {
    const overrides = {};

    if (req.body.timestampToleranceSeconds !== undefined) {
      const val = Number(req.body.timestampToleranceSeconds);
      if (isNaN(val) || val <= 0) {
        return res
          .status(400)
          .json({
            error: "timestampToleranceSeconds must be a positive number",
          });
      }
      overrides.timestampToleranceSeconds = val;
    }

    if (req.body.quantityTolerancePct !== undefined) {
      const val = Number(req.body.quantityTolerancePct);
      if (isNaN(val) || val < 0) {
        return res
          .status(400)
          .json({
            error: "quantityTolerancePct must be a non-negative number",
          });
      }
      overrides.quantityTolerancePct = val;
    }

    const userFilePath = path.resolve("data/user_transactions.csv");
    const exchangeFilePath = path.resolve("data/exchange_transactions.csv");

    const result = await runReconciliation(
      userFilePath,
      exchangeFilePath,
      overrides,
    );

    return res.status(201).json(result);
  } catch (err) {
    console.error("Reconciliation error:", err.message);
    return res
      .status(500)
      .json({ error: "Reconciliation failed", detail: err.message });
  }
});

module.exports = router;
