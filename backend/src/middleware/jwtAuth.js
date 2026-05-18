const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-prod";
const ISSUER = "stylesense.ai";
const TTL = "7d";

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.display_name || null },
    SECRET,
    { issuer: ISSUER, expiresIn: TTL },
  );
}

function decodeFromRequest(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), SECRET, { issuer: ISSUER });
  } catch {
    return null;
  }
}

function optionalJwt(req, _res, next) {
  const payload = decodeFromRequest(req);
  if (payload) {
    req.user = { uid: payload.sub, email: payload.email, name: payload.name };
    req.headers["x-user-id"] = payload.sub;
    if (payload.email) req.headers["x-user-email"] = payload.email;
  }
  return next();
}

function requireJwt(req, res, next) {
  const payload = decodeFromRequest(req);
  if (!payload) {
    return res.status(401).json({ error: "Authentication required." });
  }
  req.user = { uid: payload.sub, email: payload.email, name: payload.name };
  req.headers["x-user-id"] = payload.sub;
  if (payload.email) req.headers["x-user-email"] = payload.email;
  return next();
}

module.exports = { signToken, optionalJwt, requireJwt };
