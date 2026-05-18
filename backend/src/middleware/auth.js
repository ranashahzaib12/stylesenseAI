function getUserFromHeaders(req) {
  const uid = String(req.headers["x-user-id"] || "").trim();
  const email = String(req.headers["x-user-email"] || "").trim();
  if (!uid) return null;
  return { uid, email: email || null };
}

async function optionalAuth(req, _res, next) {
  req.user = getUserFromHeaders(req);
  return next();
}

async function requireAuth(req, res, next) {
  const user = getUserFromHeaders(req);
  if (!user) {
    return res.status(401).json({ error: "Missing x-user-id header." });
  }
  req.user = user;
  return next();
}

module.exports = { optionalAuth, requireAuth };
