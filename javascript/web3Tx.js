import {
  sendUnityError,
  sendUnityMessage,
  mapArgsToArray,
  JSMessageType,
} from "./utils.js";

export async function SendGaslessTransaction(contractAddress, ABI, functionName, args) {
  try {
    let transaction = "";
    let state = await lync.smartWallet.getSmartAccountState();
    console.log("state", state);
    lync.isSADeployed = state.isDeployed;

    const nftContract = new ethers.Contract(
      contractAddress,
      ABI,
      lync.WalletProvider
    );

    console.log("smartAccount.address ", lync.smartWallet.address);
    console.log("nftContract ", nftContract);
    let safeMintTx;
    const argsArray = mapArgsToArray(args);
    if (Array.isArray(argsArray) && argsArray.length > 0) {
      safeMintTx = await nftContract.populateTransaction[functionName](
        ...argsArray
      );
    } else {
      safeMintTx = await nftContract.populateTransaction[functionName]();
    }
    console.log(safeMintTx.data);

    const tx1 = {
      to: contractAddress,
      data: safeMintTx.data,
    };

    const txResponse = await lync.smartWallet.sendTransaction({
      transaction: tx1,
    });

    console.log("Tx sent, userOpHash:", txResponse);
    console.log("Waiting for tx to be mined...");
    const txHash = await txResponse.wait();
    console.log("txHash", txHash.transactionHash);

    window.lync.response = txHash.transactionHash;
    transaction = txHash.transactionHash;
    sendUnityMessage(JSMessageType.TRANSACTION, {
      txHash: transaction,
      contractAddress,
    });
  } catch (error) {
    console.log(error);
    console.log("Sending above error to Unity");
    sendUnityError(JSMessageType.TRANSACTION, error.message);
  }
}


export async function sendUserPaidTrx(contractAddress, functionName, args, amount) {
  try {
    let transactionHashRes = "";
    let value; 
    console.log("amount: ",amount)
    if (amount != "") {
        console.log("INSIDE IF")
        value = amount;
    }
    else{
      console.log("INSIDE ELSE")
      value = 0;
    }

    console.log("value: ",value)
    console.log("window.lync.data.chainID: ",window.lync.data.chainID)
    const bundler = new window.Bundler({
      bundlerUrl:
        "https://bundler.biconomy.io/api/v2/" +
        window.lync.data.chainID +
        "/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
      chainId: window.lync.data.chainID,
      entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
    });

    let biconomyPaymasterUrl =
    "https://paymaster.biconomy.io/api/v1/" + window.lync.data.chainID + "/" + window.lync.data.biconomyAPIKey;

  const paymaster = new window.BiconomyPaymaster({
    paymasterUrl: biconomyPaymasterUrl,
  });

  const biconomySmartAccountConfig = {
    signer: lync.WalletProvider.getSigner(),
    chainId: window.lync.data.chainID,
    rpcUrl: "https://rpc.ankr.com/polygon_mumbai",
    paymaster: paymaster,
    bundler: bundler,
  };

  const biconomyAccount = new window.BiconomySmartAccount(
    biconomySmartAccountConfig
  );

  const biconomySmartAccount = await biconomyAccount.init({
    accountIndex: 0,
  });

  const nftInterface = new ethers.utils.Interface([
    "function " + functionName,
  ]);

  const rawFunctionName = functionName.substring(
    0,
    functionName.indexOf("(")
  );

  console.log("rawFunctionName",rawFunctionName);

  console.log("args",args)

  if (args) args = args.split(",");
  
  let data;
  
    console.log("ARGS: ",args)
    if (Array.isArray(args)) {
      data = nftInterface.encodeFunctionData(rawFunctionName, args);
      console.log("data",data)
    } else {
      data = await nftInterface.encodeFunctionData(rawFunctionName);
    }

    const nftAddress = contractAddress; // Todo // use from config
    const transaction = {
      to: nftAddress,
      data: data,
      value: ethers.utils.parseEther(value.toString()), // Add Value here as cost
    };

    console.log({ transaction });

    let partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);

    const biconomyPaymaster = biconomySmartAccount.paymaster;

    // let state = await lync.smartWallet.getSmartAccountState();
    // console.log("state", state);

    let paymasterServiceData = {
      mode: window.PaymasterMode.ERC20,
      // optional params...
      calculateGasLimits: true, // Always recommended when using paymaster
      expiryDuration: 500, // 500 seconds
    };

    console.log({paymasterServiceData});
    console.log({partialUserOp});
    try {
      const paymasterAndDataResponse =
        await biconomyPaymaster.getPaymasterAndData(
          partialUserOp,
          paymasterServiceData
        );

      console.log({ paymasterAndDataResponse });

      partialUserOp.paymasterAndData =
        paymasterAndDataResponse.paymasterAndData;

      if (
        paymasterAndDataResponse.callGasLimit &&
        paymasterAndDataResponse.verificationGasLimit &&
        paymasterAndDataResponse.preVerificationGas
      ) {
        partialUserOp.callGasLimit = paymasterAndDataResponse.callGasLimit;
        partialUserOp.verificationGasLimit =
          paymasterAndDataResponse.verificationGasLimit;
        partialUserOp.preVerificationGas =
          paymasterAndDataResponse.preVerificationGas;
      }
    } catch (e) {
      console.log("error received ", e);
    }

    try {
      const userOpResponse = await biconomySmartAccount.sendUserOp(
        partialUserOp
      );
      console.log(`userOp Hash: ${userOpResponse.userOpHash}`);
      const transactionDetails = await userOpResponse.wait();

      console.log("transactionHash: ",transactionDetails.logs[0].transactionHash)

      window.lync.response = transactionDetails.logs[0].transactionHash;
      transactionHashRes = transactionDetails.logs[0].transactionHash;
      console.log("transactionHashRes:",transactionHashRes)
      sendUnityMessage(JSMessageType.TRANSACTION, {
        txHash: transactionHashRes,
        contractAddress,
      });
    }
    catch (error) {
      console.log(`ERROR: ${error}`);
    }
  } catch (error) {
    console.log(error);
    console.log("Sending above error to Unity");
    sendUnityError(JSMessageType.TRANSACTION, error.message);
  }
}
