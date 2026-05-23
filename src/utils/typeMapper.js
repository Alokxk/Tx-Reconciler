const PERSPECTIVE_FLIPS = {
  TRANSFER_OUT: "TRANSFER_IN",
  TRANSFER_IN: "TRANSFER_OUT",
};

function normalizeType(type) {
  if (!type || typeof type !== "string") return null;
  return type.trim().toUpperCase();
}

function typesAreCompatible(userType, exchangeType) {
  const u = normalizeType(userType);
  const e = normalizeType(exchangeType);
  if (!u || !e) return false;
  if (u === e) return true;
  return PERSPECTIVE_FLIPS[u] === e;
}

module.exports = { normalizeType, typesAreCompatible };
