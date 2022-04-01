/**
 * Script to remove liquidity from an existing pool that has not yet expired
 * To execute the script, run `yarn hardhat run scripts/removeLiquidity.js --network ropsten` (you can replace ropsten with any other network that is listed in constants.js)
 * 
 * Note that as opposed to `addLiquidity` where you specify the amount of collateral tokens to be added, in `removeLiquidity`, you pass in the 
 * number of long tokens to be removed. The required number of short tokens to withdraw collateral is calculated inside the smart contract function
 *  
 * DIVA smart contract addresses for the different networks are registered in constants.js
 */

const { ethers } = require('hardhat');
const ERC20_ABI = require('../contracts/abis/ERC20.json');
const positionToken_ABI = require('../contracts/abis/PositionToken.json');
const DIVA_ABI = require('../contracts/abis/DIVA.json');
const { parseEther, formatEther, parseUnits, formatUnits } = require('@ethersproject/units')
const { addresses } = require('../constants/constants')

async function main() {

    // INPUT (network)
    const network = "ropsten" // has to be one of the networks included in constants.js
    
    // INPUT (removeLiquidity arguments)
    const poolId = 3 // id of an existing pool
    const amountTokens = parseEther("1") // number of long tokens to be removed from an existing pool
    
    // Get account (account 1 in your Metamask wallet)
    const [user1] = await ethers.getSigners();
    console.log("user1 address: " + user1.address)
    
    // Connect to DIVA contract
    let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
    console.log("DIVA address: ", diva.address);

    // Get pool parameters before liquidity is removed
    const poolParamsBefore = await diva.getPoolParameters(poolId)

    // Connect to ERC20 collateral token 
    const erc20Contract = await ethers.getContractAt(ERC20_ABI, poolParamsBefore.collateralToken)    
    const decimals = await erc20Contract.decimals();
    console.log("Collateral token address: " + poolParamsBefore.collateralToken)
    console.log("Collateral balance before: " + formatUnits(poolParamsBefore.collateralBalance, decimals))
    console.log("Long token address: " + poolParamsBefore.longToken)
    console.log("Short token address: " + poolParamsBefore.shortToken)
    
    // Connect to long and short tokens 
    const longToken = await ethers.getContractAt(positionToken_ABI, poolParamsBefore.longToken)    
    const shortToken = await ethers.getContractAt(positionToken_ABI, poolParamsBefore.shortToken)   
    
    // Calculate required short token balance in user wallet
    const supplyLong = await longToken.totalSupply()
    const supplyShort = await shortToken.totalSupply()

    console.log("Long token supply before: " + formatEther(supplyLong))
    console.log("Short token supply before: " + formatEther(supplyShort))

    // Get user's long and short token balances
    const longBalance = await longToken.balanceOf(user1.address)
    const shortBalance = await shortToken.balanceOf(user1.address)
    console.log("Long token balance user: " + formatEther(longBalance))
    console.log("Short token balance user: " + formatEther(shortBalance))

    // Check user's long and short token wallet balance
    if (longBalance.lt(amountTokens)) {
      throw "Insufficient long token amount in wallet"
    } else if (shortBalance.lt(amountTokens)) {
      throw "Insufficient short token amount in wallet"
    }
    
    // Set allowance for DIVA contract to move long position tokens
    const approveLongTx = await longToken.approve(diva.address, amountTokens);
    await approveLongTx.wait();

    // Set allowance for DIVA contract to move short position tokens
    const approveShortTx = await shortToken.approve(diva.address, amountTokens); 
    await approveShortTx.wait();

    // Check that allowances were set
    const longTokenAllowance = await longToken.allowance(user1.address, diva.address)
    console.log("Long token allowance: " + formatEther(await longTokenAllowance))

    const shortTokenAllowance = await shortToken.allowance(user1.address, diva.address)
    console.log("Short token allowance: " + formatEther(await shortTokenAllowance))

    // Remove liquidity
    let tx = await diva.removeLiquidity(poolId, amountTokens); 
    await tx.wait();
    
    // Get pool parameters after liquidity has been removed
    const poolParamsAfter = await diva.getPoolParameters(poolId)
    const supplyLongAfter = await longToken.totalSupply()
    const supplyShortAfter = await shortToken.totalSupply()
    console.log("Collateral balance after: " + formatUnits(poolParamsAfter.collateralBalance, decimals))
    console.log("Long token supply after: " + formatEther(supplyLongAfter))
    console.log("Short token supply after: " + formatEther(supplyShortAfter))
    
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 