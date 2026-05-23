const ASSET_ALIASES = {
  bitcoin: "BTC",
  btc: "BTC",
  ethereum: "ETH",
  eth: "ETH",
  solana: "SOL",
  sol: "SOL",
  tether: "USDT",
  usdt: "USDT",
  matic: "MATIC",
  polygon: "MATIC",
  chainlink: "LINK",
  link: "LINK",
};

function normalizeAsset(asset) {
  if (!asset || typeof asset !== "string") return null;
  const key = asset.trim().toLowerCase();
  return ASSET_ALIASES[key] || asset.trim().toUpperCase();
}

module.exports = { normalizeAsset };
