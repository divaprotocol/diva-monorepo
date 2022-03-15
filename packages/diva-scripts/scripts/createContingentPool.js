/**
 * Script to create a contingent pool
 * To execute the script, run `yarn hardhat run scripts/createContingentPool.js --network ropsten` (you can replace ropsten with any other network that is listed in constants.js)
 * 
 * DIVA smart contract addresses for the different networks are registered in constants.js
 */

const { ethers } = require('hardhat');
const ERC20_ABI = require('../contracts/abis/ERC20.json');
const DIVA_ABI = require('../contracts/abis/DIVA.json');
const { parseEther, parseUnits, formatUnits } = require('@ethersproject/units')
const { addresses } = require('../constants/constants')
const { BigNumber } = require('ethers')
const { getExpiryInSeconds, AddressZero } = require('./utils.js')


async function main() {

  // INPUT (network)
  const network = "ropsten" // has to be one of the networks included in constants.js
  const collateralTokenSymbol = "DAI"

  // Connect to ERC20 token which will be used as collateral. Modify constants.js if you want to use a different ERC20 token
  const erc20CollateralTokenAddress = addresses[network][collateralTokenSymbol];
  const erc20Contract = await ethers.getContractAt(ERC20_ABI, erc20CollateralTokenAddress)
  const decimals = await erc20Contract.decimals();
  console.log("ERC20 collateral token address: " + erc20CollateralTokenAddress)
  console.log("Collateral token decimals: " + decimals);
  
  // INPUT (createContingentPool arguments)
  const inflection = parseEther("20")
  const cap = parseEther("25") 
  const floor = parseEther("15") 
  const collateralBalanceShort = parseUnits("0.00001", decimals) 
  const collateralBalanceLong = parseUnits("0.00001", decimals)  
  const expiryDate = getExpiryInSeconds(0) // epoch unix timestamp in seconds
  const supplyShort = parseEther("2")
  const supplyLong = parseEther("2") // 
  const referenceAsset = "ETH/USD" // "BTC/USD" 
  const collateralToken = erc20CollateralTokenAddress 
  const dataFeedProvider = "0xED6D661645a11C45F4B82274db677867a7D32675"
  const capacity = parseUnits("0", decimals)

  // Input checks
  if (referenceAsset.length === 0) {
    console.log("Reference asset cannot be an empty string");
    return;
  }
  
  if (!(floor.lte(inflection) && inflection.lte(cap))) {
    console.log("Ensure that floor <= inflection <= cap");
    return;
  }

  if (collateralToken === AddressZero || dataFeedProvider === AddressZero) {
    console.log("collateralToken/dataFeedProvider cannot be zero address");
    return;
  }

  if (supplyLong.eq(0) || supplyShort.eq(0)) {
    console.log("Token supply cannot be zero");
    return;
  }

  if (capacity.gt(0)) {
    if (capacity.lt(collateralBalanceShort.add(collateralBalanceLong))) {
      console.log("capacity cannot be smaller than collateral put in");
      return;
    }
  }

  if (decimals > 18) {
    console.log("Collateral token cannot have more than 18 decimals");
    return;
  }

  // Get account (account 1 in your Metamask wallet)
  const [poolCreator] = await ethers.getSigners();
  console.log("poolCreator address: " + poolCreator.address)

  // Check ERC20 token balance
  const balance = await erc20Contract.balanceOf(poolCreator.address)
  console.log("ERC20 token balance: " + formatUnits(balance, decimals))
  if (balance.lt(collateralBalanceShort.add(collateralBalanceLong))) {
    throw "Insufficient collateral tokens in wallet"
  }
  
  // Connect to DIVA contract
  const diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
  console.log("DIVA address: ", diva.address);

  // Set allowance for DIVA contract
  const approveTx = await erc20Contract.approve(diva.address, collateralBalanceLong.add(collateralBalanceShort));
  await approveTx.wait();

  // Check that allowance was set
  const allowance = await erc20Contract.allowance(poolCreator.address, diva.address)
  console.log("Approved amount: " + formatUnits(await allowance, decimals))

  // Create contingent pool
  const tx = await diva.createContingentPool([
    inflection, 
    cap,
    floor,
    collateralBalanceShort, 
    collateralBalanceLong,  
    expiryDate, 
    supplyShort, 
    supplyLong, 
    referenceAsset, 
    collateralToken, 
    dataFeedProvider,
    capacity 
  ]); 
  await tx.wait();

  // Get pool Id
  const poolId = await diva.getLatestPoolId();
  console.log("poolId of new pool created: " + poolId);

  // Get pool parameters
  const poolParams = await diva.getPoolParameters(poolId);
  console.log("Long token: " + poolParams.longToken)
  console.log("Short token: " + poolParams.shortToken)
  console.log("Supply long token: " + poolParams.supplyLong)
  console.log("Supply short token: " + poolParams.supplyShort)
  console.log("Collateral balance long: " + poolParams.collateralBalanceLong)
  console.log("Collateral balance long: " + poolParams.collateralBalanceShort)
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 