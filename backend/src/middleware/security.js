const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

function createCorsMiddleware() {
  const allowList = (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return cors({
    origin(origin, callback) {
      if (!origin || allowList.includes("*")) {
        return callback(null, true);
      }
      if (allowList.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin blocked by CORS policy."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-email", "x-tryon-api-key", "x-ml-admin-key"],
    credentials: true,
  });
}

function configureSecurity(app) {
  const windowMs = 15 * 60 * 1000;
  const generalMax = Number(process.env.RATE_LIMIT_MAX || 120);
  const tryOnMax = Number(process.env.TRYON_RATE_LIMIT_MAX || 20);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(morgan("dev"));
  app.use(createCorsMiddleware());

  app.use((req, _res, next) => {
    const isTryOnLarge =
      req.path.includes("/tryon/generate") ||
      req.path.includes("/tryon/detect-category");
    const limit = isTryOnLarge ? "20mb" : "10mb";
    express.json({ limit })(req, _res, next);
  });
  app.use(express.urlencoded({ extended: true }));

  app.use(
    "/api/tryon",
    rateLimit({
      windowMs,
      max: tryOnMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many try-on requests. Please retry shortly." },
    }),
  );

  app.use(
    rateLimit({
      windowMs,
      max: generalMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip(req) {
        return req.path.startsWith("/api/tryon");
      },
      message: { error: "Too many requests. Please retry shortly." },
    }),
  );
}

module.exports = { configureSecurity };
