/**
 * Script to add liquidity to an existing pool that has not yet expired
 * To execute the script, run `yarn hardhat run scripts/addLiquidity.js --network ropsten` (you can replace ropsten with any other network that is listed in constants.js)
 * 
 * DIVA smart contract addresses for the different networks are registered in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json')
const ERC20_ABI = require('@diva/contracts/abis/erc20.json')
const { parseUnits, formatUnits, formatEther } = require('@ethersproject/units')
const { addresses } = require('../constants/constants')

async function main() {
    let additionalAmount

    // INPUT (network)
    const network = "ropsten" // has to be one of the networks included in constants.js
    
    // INPUT (addLiquidity arguments)
    const poolId = 131 // id of an existing pool
    additionalAmount = 3 // collateral token amount to be added to an existing pool

    // Get account (account 1 in your Metamask wallet)
    const [liquidityProvider] = await ethers.getSigners();
    console.log("liquidityProvider address: " + liquidityProvider.address)
    
    // Connect to DIVA contract
    let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
    console.log("DIVA address: ", diva.address);

    // Get pool parameters before new liquidity is added
    const poolParamsBefore = await diva.getPoolParameters(poolId)

    // Connect to ERC20 collateral token 
    const erc20Contract = await ethers.getContractAt(ERC20_ABI, poolParamsBefore.collateralToken)    
    const decimals = await erc20Contract.decimals();
    additionalAmount = parseUnits(additionalAmount.toString(), decimals)
    
    // Print collateral token and liquidity information
    console.log("Collateral token decimals: " + decimals)
    console.log("Collateral token address: " + poolParamsBefore.collateralToken)
    console.log("Current liquidity: " + formatUnits((poolParamsBefore.collateralBalanceLong).add(poolParamsBefore.collateralBalanceShort), decimals))

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
    
    // Get pool parameters after new liquidity has been added
    const poolParamsAfter = await diva.getPoolParameters(poolId)
    console.log("New liquidity: " + formatUnits((poolParamsAfter.collateralBalanceLong).add(poolParamsAfter.collateralBalanceShort), decimals))
    console.log("New long token supply: " + poolParamsAfter.supplyLong)
    console.log("New short token supply: " + poolParamsAfter.supplyShort)
    console.log("New long token supply (formatted): " + formatEther(poolParamsAfter.supplyLong))
    console.log("New short token supply (formatted): " + formatEther(poolParamsAfter.supplyShort))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 