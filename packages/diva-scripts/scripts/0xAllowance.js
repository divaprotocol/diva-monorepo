/**
 * Script to set the allowance for the 0x exchange contract
 * Run: `yarn hardhat run scripts/0xAllowance.js --network ropsten`
 * Replace ropsten with any other network that is listed in constants.js
 */

 const { ethers } = require('hardhat');
 const ERC20_ABI = require('../contracts/abis/ERC20.json');
 const { parseUnits, formatUnits } = require('@ethersproject/units')

 
 async function main() {
 
    // INPUT: 0x exchange proxy address, token to approve, amount to approve
    const exchangeProxyAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff" // same for several chains including Mainnet and Ropsten     
    const tokenToApprove = "0xdd17bfaca24efd6b9aeea9d570f4d1b1ea2efeed"
    let allowance = 10 // conversion into BigNumber with the respective number of decimals is done below 

    // Get signers
    const [acc1, acc2, acc3] = await ethers.getSigners();
    const user = acc1;

    console.log("Approved by: " + user.address)
    console.log("Approved for: " + exchangeProxyAddress)

    // Connect to token to approve
    const erc20 = await ethers.getContractAt(ERC20_ABI, tokenToApprove);

    // Get token decimals and convert allowance amount into BigNumber
    decimals = await erc20.decimals()
    allowance = parseUnits(allowance.toString(), decimals)
    
    // Allowance before
    const allowanceBefore = await erc20.allowance(user.address, exchangeProxyAddress)
    console.log("Approved amount before: " + formatUnits(allowanceBefore, decimals))

    // Set allowance for exchangeProxyAddress
    const tx = await erc20.connect(user).approve(exchangeProxyAddress, allowance)
    await tx.wait()

    // Print
    const allowanceAfter = await erc20.allowance(user.address, exchangeProxyAddress)
    console.log("Approved amount after: " + formatUnits(allowanceAfter, decimals))
 
 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
  