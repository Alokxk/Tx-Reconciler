const mongoose = require("mongoose");
const app = require("./src/app");
const config = require("./src/config");

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
