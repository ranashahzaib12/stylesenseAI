require("dotenv").config();
const axios = require("axios");
const app = require("./app");

const PORT = Number(process.env.PORT || 8787);
const MODAL_URL = (process.env.TRYON_MODAL_URL || "").replace(/\/+$/, "");

app.listen(PORT, () => {
  console.log(`StyleSense AR Try-On API listening on port ${PORT}`);

  if (MODAL_URL) {
    const ping = () =>
      axios.get(`${MODAL_URL}/health`, { timeout: 10000 }).catch(() => {});
    ping();
    setInterval(ping, 4 * 60 * 1000);
  } else {
    console.warn("[stylesense] TRYON_MODAL_URL is not set — try-on generation will fail.");
  }
});
