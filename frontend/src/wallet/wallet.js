import { MetaMaskSDK } from "@metamask/sdk";

const STORAGE_KEY = "wallet_session_v1";
let sdkInstance = null;

const buildDappMetadata = () => {
  if (typeof window === "undefined") {
    return { name: "ØNE-ARB", url: "" };
  }
  return {
    name: "ØNE-ARB",
    url: window.location.href
  };
};

const getMetaMaskSDK = () => {
  if (typeof window === "undefined") return null;
  if (!sdkInstance) {
    sdkInstance = new MetaMaskSDK({
      dappMetadata: buildDappMetadata(),
      checkInstallationImmediately: false
    });
  }
  return sdkInstance;
};

export const getMetaMaskClient = () => {
  if (typeof window === "undefined") {
    return { provider: null, sdk: null, isExtension: false };
  }
  const { ethereum } = window;
  if (ethereum?.isMetaMask) {
    return { provider: ethereum, sdk: null, isExtension: true };
  }
  const sdk = getMetaMaskSDK();
  const provider = sdk?.getProvider() ?? null;
  return { provider, sdk, isExtension: false };
};

export const WALLET_NETWORKS = {
  allowlist: ["0x1", "0xaa36a7"],
  defaultChainId: "0x1",
  networks: {
    "0x1": {
      chainId: "0x1",
      chainName: "Ethereum Mainnet",
      rpcUrls: ["https://cloudflare-eth.com"],
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      blockExplorerUrls: ["https://etherscan.io"]
    },
    "0xaa36a7": {
      chainId: "0xaa36a7",
      chainName: "Sepolia",
      rpcUrls: ["https://rpc.sepolia.org"],
      nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
      blockExplorerUrls: ["https://sepolia.etherscan.io"]
    }
  }
};

export const getEthereumProvider = () => {
  return getMetaMaskClient().provider;
};

export const readSession = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

export const writeSession = (address) => {
  if (typeof window === "undefined") return;
  const payload = { connected: true, address };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const formatAddress = (address) => {
  if (!address) return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getChainIdDecimal = (chainId) => {
  if (!chainId) return null;
  return Number.parseInt(chainId, 16);
};

export const getNetworkName = (chainId) => {
  if (!chainId) return "Unknown network";
  return WALLET_NETWORKS.networks[chainId]?.chainName || "Unknown network";
};

export const isAllowedChain = (chainId) => {
  if (!chainId) return false;
  return WALLET_NETWORKS.allowlist.includes(chainId);
};

// Context7: "Connect to MetaMask and Access Accounts (JavaScript)" recommends calling
// eth_requestAccounts from a user action and disabling further requests while pending.
export const requestAccounts = async (provider) => {
  return provider.request({ method: "eth_requestAccounts" });
};

export const fetchAccounts = async (provider) => {
  return provider.request({ method: "eth_accounts" });
};

export const fetchChainId = async (provider) => {
  return provider.request({ method: "eth_chainId" });
};

// Context7: "accountsChanged Event", "Handle chainChanged Event", and "disconnect Event".
export const subscribeToProvider = (provider, handlers) => {
  if (!provider?.on) return () => {};
  const { onAccountsChanged, onChainChanged, onDisconnect } = handlers;
  if (onAccountsChanged) provider.on("accountsChanged", onAccountsChanged);
  if (onChainChanged) provider.on("chainChanged", onChainChanged);
  if (onDisconnect) provider.on("disconnect", onDisconnect);

  return () => {
    if (onAccountsChanged) provider.removeListener("accountsChanged", onAccountsChanged);
    if (onChainChanged) provider.removeListener("chainChanged", onChainChanged);
    if (onDisconnect) provider.removeListener("disconnect", onDisconnect);
  };
};

export const getUnlockStatus = async (provider) => {
  const unlockFn = provider?._metamask?.isUnlocked;
  if (!unlockFn) return null;
  try {
    return await unlockFn();
  } catch (err) {
    return null;
  }
};

// Context7: "Add and Switch Ethereum Network with MetaMask" for wallet_switchEthereumChain
// and wallet_addEthereumChain with error code 4902 when the chain is missing.
export const switchToChain = async (provider, chainId) => {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }]
    });
  } catch (switchError) {
    if (switchError?.code === 4902) {
      const network = WALLET_NETWORKS.networks[chainId];
      if (!network) throw switchError;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [network]
      });
    } else {
      throw switchError;
    }
  }
};

export const getProviderErrorMessage = (error) => {
  if (!error) return null;
  // Context7: "Connect to MetaMask and Access Accounts (JavaScript)" notes 4001 user rejection.
  if (error.code === 4001) {
    return "Request rejected. Please approve the MetaMask prompt to continue.";
  }
  // Context7: "JSON-RPC Error Codes" lists -32002 Resource unavailable (pending request).
  if (error.code === -32002) {
    return "A request is already pending in MetaMask. Open MetaMask to continue.";
  }
  if (error.code === 4902) {
    return "This network is not added to MetaMask. Approve the add network request.";
  }
  return error.message || "Something went wrong. Check MetaMask and try again.";
};
