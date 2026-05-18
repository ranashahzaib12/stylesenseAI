if (!process.env.VERCEL) {
  require("dotenv").config();
}

const express = require("express");
const { configureSecurity } = require("./middleware/security");
const apiRoutes = require("./routes");

const app = express();

app.set("trust proxy", 1);

configureSecurity(app);

app.get("/", (_req, res) => {
  res.json({ message: "StyleSense AR Try-On API is running." });
});

app.use("/api", apiRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message =
    status >= 500 ? "Internal server error." : err.message || "Request failed.";
  res.status(status).json({ error: message });
});

module.exports = app;
