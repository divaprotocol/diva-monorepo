/**
 * Script to create a contingent pool
 * Run: `yarn hardhat run scripts/createContingentPool.js --network ropsten`
 * Replace ropsten with any other network that is listed in constants.js
 */

const { ethers } = require('hardhat');
const ERC20_ABI = require('../contracts/abis/ERC20.json');
const DIVA_ABI = require('../contracts/abis/DIVA.json');
const { parseEther, parseUnits, formatUnits } = require('@ethersproject/units')
const { addresses } = require('../constants/constants')
const { getExpiryInSeconds, AddressZero } = require('./utils.js')


async function main() {

  // INPUT: network, collateral token symbol (check constants.js for available values)
  const network = "ropsten" 
  const collateralTokenSymbol = "WAGMI6"

  // Get signers
  const [acc1, acc2, acc3] = await ethers.getSigners();
  const user = acc1;
  console.log("poolCreator address: " + user.address)

  // Connect to ERC20 token which will be used as collateral. Modify constants.js if you want to use a different ERC20 token
  const erc20CollateralTokenAddress = addresses[network][collateralTokenSymbol];
  const erc20Contract = await ethers.getContractAt(ERC20_ABI, erc20CollateralTokenAddress)
  const decimals = await erc20Contract.decimals();
  console.log("ERC20 collateral token address: " + erc20CollateralTokenAddress)
  console.log("Collateral token decimals: " + decimals);
  
  // INPUTS: arguments for `createContingentPool` function
  const referenceAsset = "UMA/USD" // "BTC/USD" 
  const expiryTime = getExpiryInSeconds(0) // epoch unix timestamp in seconds
  const floor = parseEther("20000") 
  const inflection = parseEther("20000")
  const cap = parseEther("45000") 
  const collateralBalanceShort = parseUnits("50", decimals) 
  const collateralBalanceLong = parseUnits("50", decimals)  
  const supplyPositionToken = parseEther("100")
  const collateralToken = erc20CollateralTokenAddress 
  const dataProvider = "0x9AdEFeb576dcF52F5220709c1B267d89d5208D78" // Tellor: "0xED6D661645a11C45F4B82274db677867a7D32675"
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

  if (collateralToken === AddressZero || dataProvider === AddressZero) {
    console.log("collateralToken/dataProvider cannot be zero address");
    return;
  }

  if (supplyPositionToken.eq(0)) {
    console.log("Position token supply cannot be zero");
    return;
  }

  if (capacity.gt(0)) {
    if (capacity.lt(collateralBalanceShort.add(collateralBalanceLong))) {
      console.log("Capacity cannot be smaller than collateral provided");
      return;
    }
  }

  if (decimals > 18) {
    console.log("Collateral token cannot have more than 18 decimals");
    return;
  }

  if (decimals < 3) {
    console.log("Collateral token cannot have less than 3 decimals");
    return;
  }

  // Check ERC20 token balance
  const balance = await erc20Contract.balanceOf(user.address)
  console.log("ERC20 token balance: " + formatUnits(balance, decimals))
  if (balance.lt(collateralBalanceShort.add(collateralBalanceLong))) {
    throw "Insufficient collateral tokens in wallet"
  }
  
  // Connect to DIVA contract
  const diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
  console.log("DIVA address: ", diva.address);

  // Set allowance for DIVA contract
  const approveTx = await erc20Contract.connect(user).approve(diva.address, collateralBalanceLong.add(collateralBalanceShort));
  await approveTx.wait();

  // Check that allowance was set
  const allowance = await erc20Contract.allowance(user.address, diva.address)
  console.log("Approved amount: " + formatUnits(await allowance, decimals))

  // Create contingent pool
  const tx = await diva.connect(user).createContingentPool([
    referenceAsset, 
    expiryTime, 
    floor,
    inflection, 
    cap,
    collateralBalanceShort, 
    collateralBalanceLong,  
    supplyPositionToken, 
    collateralToken, 
    dataProvider,
    capacity
  ]); 
  await tx.wait();

  // Get pool Id
  const poolId = await diva.getLatestPoolId();
  console.log("poolId of new pool created: " + poolId);

  // Get pool parameters
  const poolParams = await diva.getPoolParameters(poolId);

  // Get instances of short and long position token
  const shortTokenInstance = await ethers.getContractAt(ERC20_ABI, poolParams.shortToken)
  const longTokenInstance = await ethers.getContractAt(ERC20_ABI, poolParams.longToken)
  console.log("Short token address: " + poolParams.shortToken)
  console.log("Long token address: " + poolParams.longToken)
  console.log("Supply short token: " + await shortTokenInstance.totalSupply())
  console.log("Supply long token: " + await longTokenInstance.totalSupply())
  console.log("Collateral balance short initial: " + poolParams.collateralBalanceShortInitial)
  console.log("Collateral balance long initial: " + poolParams.collateralBalanceLongInitial)
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 