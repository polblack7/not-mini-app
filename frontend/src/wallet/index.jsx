import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WalletSection } from "./wallet-ui";
import {
  WALLET_NETWORKS,
  clearSession,
  fetchAccounts,
  fetchChainId,
  formatAddress,
  getChainIdDecimal,
  getMetaMaskClient,
  getNetworkName,
  getProviderErrorMessage,
  getUnlockStatus,
  isAllowedChain,
  readSession,
  requestAccounts,
  subscribeToProvider,
  switchToChain,
  writeSession
} from "./wallet";

const INITIAL_STATE = {
  hasProvider: false,
  isMetaMask: false,
  usesSDK: false,
  isConnecting: false,
  connected: false,
  address: null,
  chainId: null,
  chainIdDecimal: null,
  networkName: "--",
  isWrongNetwork: false,
  errorMessage: null,
  copyHint: null
};

export const WalletConnectSection = ({ onWalletConnected }) => {
  const [state, setState] = useState(INITIAL_STATE);
  const providerRef = useRef(null);
  const addressRef = useRef(null);
  const chainIdRef = useRef(null);
  const onWalletConnectedRef = useRef(onWalletConnected);
  const sdkRef = useRef(null);

  useEffect(() => {
    onWalletConnectedRef.current = onWalletConnected;
  }, [onWalletConnected]);

  const updateChainInfo = useCallback((chainId) => {
    chainIdRef.current = chainId || null;
    setState((prev) => ({
      ...prev,
      chainId,
      chainIdDecimal: getChainIdDecimal(chainId),
      networkName: chainId ? getNetworkName(chainId) : "--",
      isWrongNetwork: chainId ? !isAllowedChain(chainId) : false
    }));
  }, []);

  const updateAddress = useCallback((address) => {
    addressRef.current = address || null;
    setState((prev) => ({
      ...prev,
      address: address || null,
      connected: Boolean(address)
    }));
  }, []);

  const notifyConnected = useCallback(() => {
    const address = addressRef.current;
    const chainId = chainIdRef.current;
    if (address && chainId && typeof onWalletConnectedRef.current === "function") {
      onWalletConnectedRef.current({ address, chainId });
    }
  }, []);

  const handleDisconnectState = useCallback((message) => {
    clearSession();
    updateAddress(null);
    setState((prev) => ({
      ...prev,
      errorMessage: message || null
    }));
  }, [updateAddress]);

  const hydrateFromSession = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) return;

    try {
      const chainId = await fetchChainId(provider);
      updateChainInfo(chainId);
    } catch (err) {
      updateChainInfo(null);
    }

    const session = readSession();
    if (session?.connected && session?.address) {
      try {
        const accounts = await fetchAccounts(provider);
        const primary = accounts?.[0];
        if (primary) {
          updateAddress(primary);
          writeSession(primary);
          notifyConnected();
        } else {
          clearSession();
          updateAddress(null);
        }
      } catch (err) {
        clearSession();
      }
    }

    const unlocked = await getUnlockStatus(provider);
    if (unlocked === false && !addressRef.current) {
      setState((prev) => ({
        ...prev,
        errorMessage: "MetaMask is locked. Unlock it to continue."
      }));
    }
  }, [notifyConnected, updateAddress, updateChainInfo]);

  useEffect(() => {
    const { provider, sdk } = getMetaMaskClient();
    if (!provider) {
      setState((prev) => ({
        ...prev,
        hasProvider: false,
        isMetaMask: false,
        usesSDK: false
      }));
      return;
    }

    providerRef.current = provider;
    sdkRef.current = sdk;
    setState((prev) => ({
      ...prev,
      hasProvider: true,
      isMetaMask: true,
      usesSDK: Boolean(sdk)
    }));

    hydrateFromSession();

    const unsubscribe = subscribeToProvider(provider, {
      onAccountsChanged: (accounts) => {
        const primary = accounts?.[0];
        if (!primary) {
          handleDisconnectState(null);
          return;
        }
        updateAddress(primary);
        writeSession(primary);
        setState((prev) => ({
          ...prev,
          errorMessage: null
        }));
        notifyConnected();
      },
      onChainChanged: (chainId) => {
        updateChainInfo(chainId);
        setState((prev) => ({
          ...prev,
          errorMessage: null
        }));
        if (addressRef.current) notifyConnected();
      },
      onDisconnect: () => {
        handleDisconnectState("MetaMask disconnected. Please reconnect.");
      }
    });

    return () => unsubscribe();
  }, [handleDisconnectState, hydrateFromSession, notifyConnected, updateAddress, updateChainInfo]);

  const handleConnect = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) {
      setState((prev) => ({
        ...prev,
        hasProvider: false,
        isMetaMask: false,
        errorMessage: "MetaMask is not installed."
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isConnecting: true,
      errorMessage: null
    }));

    try {
      const sdk = sdkRef.current;
      const accounts = sdk ? await sdk.connect() : await requestAccounts(provider);
      const chainId = await fetchChainId(provider);
      updateChainInfo(chainId);

      const primary = accounts?.[0];
      if (primary) {
        updateAddress(primary);
        writeSession(primary);
        notifyConnected();
      } else {
        handleDisconnectState(null);
        const unlocked = await getUnlockStatus(provider);
        if (unlocked === false) {
          setState((prev) => ({
            ...prev,
            errorMessage: "MetaMask is locked. Unlock it to continue."
          }));
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        errorMessage: getProviderErrorMessage(err)
      }));
    } finally {
      setState((prev) => ({
        ...prev,
        isConnecting: false
      }));
    }
  }, [handleDisconnectState, notifyConnected, updateAddress, updateChainInfo]);

  const handleDisconnect = useCallback(async () => {
    const sdk = sdkRef.current;
    if (sdk?.terminate) {
      try {
        await sdk.terminate();
      } catch (err) {
        // Ignore SDK termination failures to keep local state consistent.
      }
    }
    handleDisconnectState(null);
  }, [handleDisconnectState]);

  const handleSwitchNetwork = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) return;

    const targetChainId = WALLET_NETWORKS.defaultChainId || WALLET_NETWORKS.allowlist[0];
    if (!targetChainId) return;

    try {
      setState((prev) => ({ ...prev, errorMessage: null }));
      await switchToChain(provider, targetChainId);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        errorMessage: getProviderErrorMessage(err)
      }));
    }
  }, []);

  const handleCopyAddress = useCallback(async () => {
    const address = addressRef.current;
    if (!address) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = address;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setState((prev) => ({
        ...prev,
        copyHint: "Copied"
      }));
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          copyHint: null
        }));
      }, 1600);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        copyHint: "Copy failed"
      }));
    }
  }, []);

  const viewState = useMemo(() => {
    const statusText = !state.hasProvider
      ? "MetaMask not installed"
      : state.isConnecting
      ? "Connecting"
      : state.connected
      ? state.isWrongNetwork
        ? "Wrong network"
        : "Connected"
      : "Not connected";

    const connectionLabel = state.isWrongNetwork
      ? "Wrong network"
      : state.connected
      ? "Connected"
      : "Not connected";

    const targetChainId = WALLET_NETWORKS.defaultChainId || WALLET_NETWORKS.allowlist[0];
    const wrongNetworkMessage =
      state.isWrongNetwork && targetChainId
        ? `Unsupported network. Switch to ${getNetworkName(targetChainId)} (${targetChainId}).`
        : null;

    return {
      ...state,
      statusText,
      connectionLabel,
      connectHint: state.usesSDK
        ? "On iOS, this opens the MetaMask app to approve the connection."
        : null,
      errorMessage: state.errorMessage || wrongNetworkMessage,
      addressLabel: formatAddress(state.address),
      chainLabel: state.chainId
        ? `${state.chainId} (${state.chainIdDecimal ?? "--"})`
        : "--",
      canConnect: state.hasProvider && !state.isConnecting && !state.connected,
      showDisconnect: state.connected,
      showSwitchNetwork: state.hasProvider && state.chainId && state.isWrongNetwork,
      hasProvider: state.hasProvider,
      hasAddress: Boolean(state.address)
    };
  }, [state]);

  return (
    <WalletSection
      state={viewState}
      actions={{
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onSwitchNetwork: handleSwitchNetwork,
        onCopyAddress: handleCopyAddress
      }}
    />
  );
};
