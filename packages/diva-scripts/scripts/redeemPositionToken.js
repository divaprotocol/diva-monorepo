/**
 * Script to redeem position tokens from a pool that has already expired 
 * Run: `yarn hardhat run scripts/redeemPositionToken.js --network goerli` 
 * Replace goerli with any other network that is listed in constants.js
 * 
 * Note that as opposed to `addLiquidity` where you specify the amount of collateral tokens to be added, in `removeLiquidity`, you pass in the 
 * number of position tokens to remove (e.g., 200 means that 200 position and 200 short tokens will be removed). The collateral to return is 
 * calculated inside the smart contract.
 */

const { ethers } = require('hardhat');
const ERC20_ABI = require('@diva/contracts/abis/erc20.json');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json');

const { parseEther, formatEther, formatUnits } = require('@ethersproject/units')
const { addresses } = require('../constants/constants')


async function main() {

  // INPUT: network (check constants.js for available values), id of an existing pool
  const network = "goerli"
  
  // INPUT id of an existing pool and number of position tokens to redeem
  const poolId = 4 // id of an existing pool
  const redemptionAmount = parseEther("30") // number of position tokens to redeem
  const sideToRedeem = "long" // short / long
  
  // Get accounts
  const [acc1, acc2, acc3] = await ethers.getSigners();
  positionTokenHolder = acc1;
  console.log("PositionTokenHolder address: " + positionTokenHolder.address)
  
  // Connect to DIVA contract
  let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
  console.log("DIVA address: ", diva.address);

  // Get pool parameters before position token redemption
  const poolParamsBefore = await diva.getPoolParameters(poolId)

  // Connect to position token 
  if (sideToRedeem === "short") {
    positionTokenInstance = await ethers.getContractAt(ERC20_ABI, poolParamsBefore.shortToken)
  } else if (sideToRedeem === "long") {
    positionTokenInstance = await ethers.getContractAt(ERC20_ABI, poolParamsBefore.longToken)
  } else {
    console.log("Invalid input for sideToRedeem. Choose short or long")
    return;
  }
  
  console.log("Position token supply before: " + formatEther(await positionTokenInstance.totalSupply()))

  // Connect to ERC20 collateral token 
  const erc20Contract = await ethers.getContractAt(ERC20_ABI, poolParamsBefore.collateralToken)   
  const decimals = await erc20Contract.decimals() 

  // Get positionTokenHolder's collateral token balance before redemption
  const collateralBalanceBefore = await erc20Contract.balanceOf(positionTokenHolder.address)
  console.log("Collateral token balance positionTokenHolder before: " + formatUnits(collateralBalanceBefore, decimals))

  // Get positionTokenHolder's position token balance before redemption
  const positionTokenBalanceBefore = await positionTokenInstance.balanceOf(positionTokenHolder.address)
  console.log("Position token balance positionTokenHolder before: " + formatEther(positionTokenBalanceBefore))

  // Check positionTokenHolder's position token wallet balance
  if (positionTokenBalanceBefore.lt(redemptionAmount)) {
    throw "Insufficient position token balance"
  }
  
  // Redeem position tokens
  let tx = await diva.redeemPositionToken(positionTokenInstance.address, redemptionAmount); 
  await tx.wait();
  
  // Get pool parameters after redemption
  console.log("Position token supply after: " + formatEther(await positionTokenInstance.totalSupply()))

  // Get positionTokenHolder's collateral token balance after redemption
  const collateralBalanceAfter = await erc20Contract.balanceOf(positionTokenHolder.address)
  console.log("Collateral token balance positionTokenHolder after: " + formatUnits(collateralBalanceAfter, decimals))

  // Get positionTokenHolder's position token balance after redemption
  const positionTokenBalanceAfter = await positionTokenInstance.balanceOf(positionTokenHolder.address)
  console.log("position token balance positionTokenHolder after: " + formatEther(positionTokenBalanceAfter))

 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
  