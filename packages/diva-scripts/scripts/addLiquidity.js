/**
 * Script to add liquidity to an existing pool that has not yet expired
 * Run: `yarn hardhat run scripts/addLiquidity.js --network ropsten`
 * Replace ropsten with any other network that is listed in constants.js
 */

const { ethers } = require('hardhat');
const ERC20_ABI = require('@diva/contracts/abis/erc20.json');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json');
const { parseUnits, formatUnits, formatEther } = require('@ethersproject/units')
const { addresses } = require('../constants/constants')

async function main() {
    let additionalAmount

    // INPUT: network, collateral token symbol (check constants.js for available values)
    const network = "ropsten" 
    
    // INPUT: arguments for `addLiquidity` function
    const poolId = 3 // id of an existing pool
    additionalAmount = 3 // collateral token amount to be added to an existing pool

    // Get account (account 1 in your Metamask wallet)
    const [acc1, acc2, acc3] = await ethers.getSigners();
    const liquidityProvider = acc1;  
    console.log("liquidityProvider address: " + liquidityProvider.address)
    
    // Connect to DIVA contract
    let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
    console.log("DIVA address: ", diva.address);

    // Get pool parameters before new liquidity is added
    const poolParamsBefore = await diva.getPoolParameters(poolId)

    // Check that pool didn't expire yet
    currentTime = Math.floor(Date.now() / 1000)
    if (poolParamsBefore.expiryTime <= new Date().getTime() / 1000) {
      console.log("Pool already expired. No addition of liquidity possible anymore.")
      return;
    }

    // Connect to ERC20 collateral token 
    const erc20Contract = await ethers.getContractAt(ERC20_ABI, poolParamsBefore.collateralToken)    
    const decimals = await erc20Contract.decimals();
    additionalAmount = parseUnits(additionalAmount.toString(), decimals)
    
    // Print collateral token and liquidity information
    console.log("Collateral token decimals: " + decimals)
    console.log("Collateral token address: " + poolParamsBefore.collateralToken)
    console.log("Current liquidity: " + formatUnits(poolParamsBefore.collateralBalance, decimals))

    // Get user's collateral token balances
    const balance = await erc20Contract.balanceOf(liquidityProvider.address)
    console.log("ERC20 token balance: " + formatUnits(balance, decimals))

    // Check user's collateral token wallet balance
    if (balance.lt(additionalAmount)) {
        throw "Insufficient collateral tokens in wallet"
    }
    
    // Set allowance for DIVA contract
    const approveTx = await erc20Contract.approve(diva.address, additionalAmount);
    await approveTx.wait();

    // Check that allowance was set
    const allowance = await erc20Contract.allowance(liquidityProvider.address, diva.address)
    console.log("Approved amount: " + formatUnits(await allowance, decimals))

    // Add liquidity
    let tx = await diva.addLiquidity(poolId, additionalAmount); 
    await tx.wait();
    
    // Get pool parameters and position token supply after new liquidity has been added
    const poolParamsAfter = await diva.getPoolParameters(poolId)
    const longTokenInstance = await ethers.getContractAt(ERC20_ABI, poolParamsAfter.longToken)
    const shortTokenInstance = await ethers.getContractAt(ERC20_ABI, poolParamsAfter.shortToken)
    const supplyShort = await shortTokenInstance.totalSupply();
    const supplyLong = await longTokenInstance.totalSupply();
    console.log("New liquidity: " + formatUnits(poolParamsAfter.collateralBalance, decimals))
    console.log("New long token supply: " + supplyLong)
    console.log("New short token supply: " + supplyShort)
    console.log("New long token supply (formatted): " + formatEther(supplyLong))
    console.log("New short token supply (formatted): " + formatEther(supplyShort))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 