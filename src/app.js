const express = require("express");
const reconcileRouter = require("./routes/reconcile");
const reportRouter = require("./routes/report");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(reconcileRouter);
app.use(reportRouter);

module.exports = app;
