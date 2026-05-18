const express = require("express");
const { optionalJwt } = require("../middleware/jwtAuth");
const tryOnRoutes = require("./tryon");

const router = express.Router();

router.use(optionalJwt);

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "stylesense-ar-tryon-api",
    timestamp: new Date().toISOString(),
  });
});

router.use("/tryon", tryOnRoutes);

module.exports = router;
