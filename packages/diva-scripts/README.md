# Intro
This repository is a collection of scripts to interact with the DIVA smart contract.

# Getting started
* Clone repository via `git clone https://github.com/divaprotocol/diva-scripts.git`
* Run `yarn install`
* Add `.env` file with your wallet/node configuration (use `.env.example` for reference)

Note that the accounts derived from the wallet you specified in `.env` file via a mnemonic phrase and reference in the network settings in `hardhat.config.js` are the ones that will be used for interacting with the contracts. The accounts are loaded in the scripts via `await ethers.getSigners();`. By default, the first account in your wallet is the one that will interact with the functions. If you wish to use a different account, use the [`connect()`](https://docs.ethers.io/v5/api/contract/contract/#Contract-connect) method (see also `setFinalReferenceValue_ChallengeDisabled.js` for an example). 

# Preparation
Prior to interacting with the DIVA smart contract, you need to equip your wallet with some test assets:
* Get ETH from a faucet to pay for gas on the testnet (or MATIC if you decide to use Polygon's mainnet)
* Get an ERC20 token (e.g., convert some of your ETH into WETH on https://uniswap.org/)

The easiest way to get started is to use Paradigm's multi-faucet which will equip your wallet with ETH and ERC20 in one go: https://faucet.paradigm.xyz/.

After you have equipped your wallet with the test assets, go to `constants.js` and update the collateral token address (ERC20 in your wallet) for the network you want to test on.

![image](https://user-images.githubusercontent.com/37043174/147007600-21471b06-d5fb-4ce7-8e23-abdf1e5b9821.png)

## Create a contingent pool
**Step 1:** Go to `scripts/createContingentPool.js` and specify the `network` (ropsten, rinkeby, kovan or polygon). 

![image](https://user-images.githubusercontent.com/37043174/147008458-4f7228c9-6a72-453a-a3ad-6922a6552ce5.png)

**Step 2:** Specify the contract parameters. If you want to test the settlement process, set the `expiry` to a time in the past (e.g., `getExpiryInSeconds(-10)` for 10 seconds in the past) and put your second wallet account as the `dataFeedProvider`.

![image](https://user-images.githubusercontent.com/37043174/146926335-7f22ed65-de3f-41e7-82a3-fbdeccca1738.png)

**Step 3:** Run `yarn hardhat run scripts/createContingentPool.js --network ropsten`. Replace `ropsten` if you selected a different network in Step 1.

## Add liquidity
Requires an existing contingent pool that is not expired yet. If you don't have a pool yet, go to section [Create a contingent pool](#create-a-contingent-pool) and create one with expiry date in the future (i.e., pass in a positive value in `getExpiryInSeconds` function). Further, make sure that you have a sufficient collateral token balance in your wallet. If you don't know the collateral token address for the pool you want to add liquidity to, run the script as described in Step 3 and read it from the log.

**Step 1:** Go to `scripts/addLiquidity.js` and specify the `network` (ropsten, rinkeby, kovan or polygon). 

![image](https://user-images.githubusercontent.com/37043174/147008448-fb0a680e-e37f-4462-959e-7d8fe97bb369.png)

**Step 2:** Specify the input parameters for the `addLiquidity` smart contract function.

![image](https://user-images.githubusercontent.com/37043174/146926561-8f71ef9a-b0c1-49f9-b299-f8a2b3757fe8.png)

**Step 3:** Run `yarn hardhat run scripts/addLiquidity.js --network ropsten`. Replace `ropsten` if you selected a different network in Step 1.

## Remove liquidity
Requires an existing contingent pool that is not expired yet. If you don't have a pool yet, go to section [Create a contingent pool](#create-a-contingent-pool) and create one with expiry date in the future (i.e., pass in a positive value in `getExpiryInSeconds` function). Note that as opposed to `addLiquidity` where you specify the amount of collateral tokens to be added, in `removeLiquidity`, you pass in the number of long tokens to be removed. The required number of short tokens to withdraw collateral is calculated inside the smart contract function. Make sure you have a sufficient amount of both long and short position tokens in your wallet.

**Step 1:** Go to `scripts/removeLiquidity.js` and specify the `network` (ropsten, rinkeby, kovan or polygon). 

![image](https://user-images.githubusercontent.com/37043174/147008440-224424d8-903d-421d-9457-8d6d1d846084.png)

**Step 2:** Specify the input parameters for the `removeLiquidity` smart contract function.

![image](https://user-images.githubusercontent.com/37043174/146945413-445d07dd-02e3-488d-b89f-c7c3ac0f91d2.png)

**Step 3:** Run `yarn hardhat run scripts/removeLiquidity.js --network ropsten`. Replace `ropsten` if you selected a different network in Step 1.

## Submit final reference value (challenge disabled)
Requries a pool that expired less than 24h ago (that's the submission period for the data feed provider). In this example, a challenge of the submitted value is disabled.

**Step 1:** Go to `scripts/setFinalReferenceValue_ChallengeDisabled.js` and specify the `network` (ropsten, rinkeby, kovan or polygon) 

![image](https://user-images.githubusercontent.com/37043174/147008448-fb0a680e-e37f-4462-959e-7d8fe97bb369.png)

**Step 2:** Update the input parameters for the `setFinalReferenceValue` function. Keep `allowChallenge = false` as this particular script is supposed to simulate a value submission that does not allow for a challenge.

![image](https://user-images.githubusercontent.com/37043174/147008662-15440b86-2598-47bd-ac66-3339cb2b53b6.png)

**Step 3:** Run `yarn hardhat run scripts/setFinalReferenceValue_ChallengeDisabled.js --network ropsten`. Replace `ropsten` if you selected a different network in Step 1.

## Submit final reference value (challenge enabled)
Requires a pool that expired less than 24h ago (that's the submission period for the data feed provider). In this example, a challenge of the submitted value is enabled.

**Step 1:** Go to `scripts/setFinalReferenceValue_ChallengeAllowed.js` and specify the `network` (ropsten, rinkeby, kovan or polygon). 

![image](https://user-images.githubusercontent.com/37043174/147008448-fb0a680e-e37f-4462-959e-7d8fe97bb369.png)

**Step 2:** Update the input parameters for the `setFinalReferenceValue` function. Keep `allowChallenge = true` as this particular script is supposed to simulate a value submission that can be challenged.

![image](https://user-images.githubusercontent.com/37043174/147009199-1a4c44b3-22b5-4bfe-ba2f-ce7f2f0c1865.png)

**Step 3:** Run `yarn hardhat run scripts/setFinalReferenceValue_ChallengeEnabled.js --network ropsten`. Replace `ropsten` if you selected a different network in Step 1.

## Challenge final reference value
Requires a pool where a value has already been submitted and the time passed after the submission is less than 24h (that's the challenge period for position token holders). 

**Step 1:** Go to `scripts/challengeFinalReferenceValue.js` and specify the `network` (ropsten, rinkeby, kovan or polygon). 

![image](https://user-images.githubusercontent.com/37043174/147008448-fb0a680e-e37f-4462-959e-7d8fe97bb369.png)

**Step 2:** Update the input parameters for the `challengeFinalReferenceValue` function. 

![image](https://user-images.githubusercontent.com/37043174/147009452-5e514e75-a207-4b63-b355-a9d93811b346.png)

**Step 3:** Run `yarn hardhat run scripts/challengeFinalReferenceValue.js --network ropsten`. Replace `ropsten` if you selected a different network in Step 1.

## Redeem position token
Requires the final value for the respective pool to be confirmed.

**Step 1:** Go to `scripts/challengeFinalReferenceValue.js` and specify the `network` (ropsten, rinkeby, kovan or polygon). 

![image](https://user-images.githubusercontent.com/37043174/147008448-fb0a680e-e37f-4462-959e-7d8fe97bb369.png)

**Step 2:** Update the input parameters for the `redeemPositionToken` function. Note that the first input for `redeemPositionToken` is the long/short token address which is derived from the `poolId` in this example.

![image](https://user-images.githubusercontent.com/37043174/147009517-97da12f7-4cc3-4bb3-ba2b-049f28abee43.png)

**Step 3:** Run `yarn hardhat run scripts/redeemPositionToken.js --network ropsten`. Replace `ropsten` if you selected a different network in Step 1.

## Getter functions
```
getLatestPoolId()
getPoolParameters(poolId)
getPoolParametersByAddress(positionTokenAddress)
getGovernanceParameters()
getClaims(collateralTokenAddress, recipientAddress)
getTreasuryAddress()
```
