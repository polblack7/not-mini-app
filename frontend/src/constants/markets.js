export const PAIR_OPTIONS = [
  // Core
  "ETH/USDT", "ETH/USDC", "ETH/DAI",
  "WBTC/ETH", "WBTC/USDT", "WBTC/USDC", "WBTC/DAI",
  "USDC/USDT", "USDC/DAI", "USDT/DAI",
  // BTC wrappers
  "CBBTC/ETH", "CBBTC/USDC", "WBTC/CBBTC",
  // LST
  "WSTETH/ETH", "WSTETH/USDC",
  // Stable variants
  "USDS/USDC", "USDS/DAI",
  "USDE/USDT", "USDE/USDC",
  "GHO/USDC", "GHO/USDT",
  "FRAX/USDC", "FRAX/DAI",
  // Meme
  "PEPE/ETH",
];

export const DEX_OPTIONS = [
  "Uniswap V2",
  "Uniswap V3",
  "SushiSwap",
  "ShibaSwap",
  "Curve",
  "Balancer V2",
  "Balancer V3",
  "0x",
  "1inch",
  "KyberSwap Elastic",
  "DODO V2",
  "Fluid DEX",
];

export const REPORT_PERIODS = [
  { key: "24h", label: "24h", hours: 24 },
  { key: "7d", label: "7 days", hours: 24 * 7 },
  { key: "30d", label: "30 days", hours: 24 * 30 },
  { key: "all", label: "All time", hours: null },
];
