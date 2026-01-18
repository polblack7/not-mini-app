export function isValidWallet(wallet) {
  return /^0x[a-fA-F0-9]{40}$/.test(wallet.trim());
}
