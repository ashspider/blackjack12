import * as Web3Init from "./web3Init.js";
import * as Utils from "./utils.js";
import { SendGaslessTransaction } from "./web3Tx.js";
import { sendUserPaidTrx } from "./web3Tx.js";

Utils.loadScript("../web3/ethers.min.js");

async function InitializeLyncSDK(
  web3AuthClientId,
  biconomyAPIKey,
  chainID,
  networkType
) {
  window.lync.data = {
    web3AuthClientId,
    biconomyAPIKey,
    chainID,
    networkType,
  };
  console.log(window.lync.data);
  try {
    Web3Init.InitializeBiconomyConfig();
    Web3Init.InitializeWeb3();
    if (lync.web3auth.status == "not_ready") await lync.web3auth.initModal();

  
    if (lync.web3auth.status == "connected") {
      lync.WalletProvider = new ethers.providers.Web3Provider(
        lync.web3auth.provider
      );
      const accounts = await lync.WalletProvider.listAccounts();
      lync.EOAAddress = accounts[0];
      await Web3Init.InitializeSmartWallet();
      console.log("lync.smartWallet.address = " + lync.smartWallet.address);
      console.log(lync.biconomyConfig);
      Utils.sendUnityMessage(Utils.JSMessageType.CONNECTED, {
        publicAddress: lync.EOAAddress,
        smartAccount: lync.smartWallet.address,
      });
    }
  } catch (error) {
    console.log(error);
  }
}

window.lync = {
  ...Web3Init,
  EOAAddress: "",
  smartWallet: "",
  SendGaslessTransaction,
  sendUserPaidTrx,
  response: "",
  WalletProvider: "",
  biconomyConfig: "",
  isSADeployed: "",
  SetResponse,
  web3auth: "",
  InitializeLyncSDK,
};

function SetResponse(value) {
  lync.response = value;
}
