export const PAIR_OPTIONS = [
  "ETH/USDT", "ETH/USDC", "ETH/DAI",
  "WBTC/ETH", "WBTC/USDT", "WBTC/USDC", "WBTC/DAI",
  "USDC/USDT", "USDC/DAI", "USDT/DAI",
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
];

export const REPORT_PERIODS = [
  { key: "24h", label: "24h", hours: 24 },
  { key: "7d", label: "7 days", hours: 24 * 7 },
  { key: "30d", label: "30 days", hours: 24 * 30 },
  { key: "all", label: "All time", hours: null },
];
