import { sendUnityError, sendUnityMessage, JSMessageType } from "./utils.js";

export async function OpenLogin() {
  try {
    await lync.web3auth.connect();
    if (!lync.WalletProvider)
      lync.WalletProvider = new ethers.providers.Web3Provider(
        lync.web3auth.provider
      );
    const accounts = await lync.WalletProvider.listAccounts();
    lync.EOAAddress = accounts[0];
    await InitializeSmartWallet();
    sendUnityMessage(JSMessageType.LOGIN, {
      publicAddress: lync.EOAAddress,
      smartAccount: lync.smartWallet.address,
    });
  } catch (error) {
    console.log(error);
    sendUnityError(JSMessageType.LOGIN, error.message);
  }
}

export async function InitializeSmartWallet() {
  console.log("lync.smartWallet ", lync.smartWallet);
  if (lync.smartWallet) return;
  lync.smartWallet = new window.smartAccount(
    lync.WalletProvider,
    lync.biconomyConfig
  );
  lync.smartWallet = await lync.smartWallet.init();
  console.log("lync.smartWallet ", lync.smartWallet);
}

export function InitializeWeb3() {
  if (
    lync?.web3auth &&
    (lync.web3auth.status == "connected" || lync.web3auth.status == "ready")
  )
    return;
  lync.web3auth = new window.Web3Auth({
    web3AuthNetwork: "testnet",
    clientId: window.lync.data.web3AuthClientId,
    chainConfig: {
      chainNamespace: "eip155",
      chainId: "0x1",
    },
  });
}

export function InitializeBiconomyConfig() {
  lync.biconomyConfig = {
    activeNetworkId: window.lync.data.chainID,
    supportedNetworksIds: [window.lync.data.chainID],
    networkConfig: [
      {
        chainId: window.lync.data.chainID,
        dappAPIKey: window.lync.data.biconomyAPIKey,
      },
    ],
  };
}

export async function CheckIsWalletConnected() {
  return;
  try {
    console.log("HEEREE?", lync.web3auth.provider);
    InitializeBiconomyConfig(chainID, APIKey);
    InitializeWeb3(Web3AuthClientId);

    // await lync.web3auth.initModal();

    if (lync.web3auth.status == "not_ready") await lync.web3auth.initModal();
    if (lync.web3auth.status == "connected") {
      lync.WalletProvider = new ethers.providers.Web3Provider(
        lync.web3auth.provider
      );
      const accounts = await lync.WalletProvider.listAccounts();
      lync.EOAAddress = accounts[0];
      await InitializeSmartWallet();
      sendUnityMessage(JSMessageType.CONNECTED, {
        publicAddress: lync.EOAAddress,
        smartAccount: lync.smartWallet.address,
      });
    } else {
      sendUnityMessage(JSMessageType.CONNECTED, {
        publicAddress: "",
        smartAccount: "",
      });
    }
  } catch (error) {
    console.log(error);
    sendUnityError(JSMessageType.CONNECTED, error.message);
  }
}

export async function LogOut() {
  try {
    lync.web3auth.logout();
    sendUnityMessage(JSMessageType.LOGOUT, "success");
  } catch (error) {
    console.log(error);
    sendUnityError(JSMessageType.LOGOUT, error.message);
  }
}
