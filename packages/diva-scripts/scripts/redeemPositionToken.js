/**
 * Script to redeem long tokens from a pool that has already expired 
 * To execute the script, run `yarn hardhat run scripts/redeemPositionToken.js --network ropsten` (you can replace ropsten with any other network that is listed in constants.js)
 * 
 * Note that as opposed to `addLiquidity` where you specify the amount of collateral tokens to be added, in `removeLiquidity`, you pass in the 
 * number of long tokens to be removed. The required number of short tokens to withdraw collateral is calculated inside the smart contract function
 *  
 * DIVA smart contract addresses for the different networks are registered in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json')
const ERC20_ABI = require('@diva/contracts/abis/erc20.json')
const positionToken_ABI = require('@diva/contracts/abis/position-token.json')
const { parseEther, formatEther, formatUnits } = require('@ethersproject/units')
const { addresses } = require('../constants/constants')

async function main() {

  // INPUT (network)
  const network = "ropsten" // has to be one of the networks included in constants.js
  
  // INPUT (in this example, the first input `positionTokenAddress` into redeemPositionToken function is derived from the poolId)
  const poolId = 132 // id of an existing pool
  const redemptionAmount = parseEther("10") // number of position tokens to redeem
  
  // Get account (account 1 in your Metamask wallet)
  const [user1] = await ethers.getSigners();
  console.log("user1 address: " + user1.address)
  
  // Connect to DIVA contract
  let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
  console.log("DIVA address: ", diva.address);

  // Get pool parameters before long token redemption
  const poolParamsBefore = await diva.getPoolParameters(poolId)
  console.log("Long token supply before: " + formatEther(poolParamsBefore.supplyLong))

  // Connect to ERC20 collateral token 
  const erc20Contract = await ethers.getContractAt(ERC20_ABI, poolParamsBefore.collateralToken)   
  const decimals = await erc20Contract.decimals() 

  // Get user's collateral token balance before redemption
  const collateralBalanceBefore = await erc20Contract.balanceOf(user1.address)
  console.log("Collateral token balance user before: " + formatUnits(collateralBalanceBefore, decimals))

  // Connect to long token 
  const longToken = await ethers.getContractAt(positionToken_ABI, poolParamsBefore.longToken)    

  // Get user's long token balance before redemption
  const longBalanceBefore = await longToken.balanceOf(user1.address)
  console.log("Long token balance user before: " + formatEther(longBalanceBefore))

  // Check user's long token wallet balance
  if (longBalanceBefore.lt(redemptionAmount)) {
    throw "Insufficient long token balance"
  }
  
  // Redeem long tokens
  let tx = await diva.redeemPositionToken(poolParamsBefore.longToken, redemptionAmount); 
  await tx.wait();
  
  // Get pool parameters after redemption
  const poolParamsAfter = await diva.getPoolParameters(poolId)
  console.log("Long token supply after: " + formatEther(poolParamsAfter.supplyLong))

  // Get user's collateral token balance after redemption
  const collateralBalanceAfter = await erc20Contract.balanceOf(user1.address)
  console.log("Collateral token balance user after: " + formatUnits(collateralBalanceAfter, decimals))

  // Get user's long token balance after redemption
  const longBalanceAfter = await longToken.balanceOf(user1.address)
  console.log("Long token balance user after: " + formatEther(longBalanceAfter))

 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
  