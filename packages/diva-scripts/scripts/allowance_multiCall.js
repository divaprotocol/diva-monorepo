/**
 * Script to set the allowance for the 0x exchange contract
 * Run: `yarn hardhat run scripts/allowance_multiCall.js --network ropsten`
 * Replace ropsten with any other network that is listed in constants.js
 */

 const { ethers } = require('hardhat');
 const BalanceCheckerABI = require('../../diva-app/src/abi/BalanceCheckerABI.json');
 const { parseUnits, formatUnits } = require('@ethersproject/units');

 
 async function main() {
 
    const ownerAddresses = ["0x41da2397b493fd5fcf8eb9f81c1ba838d9da6563"];
    const spenderAddresses = ["0xdef1c0ded9bec7f1a1670819833240f027b25eff"] // exchangeProxyAddress: 0xdef1c0ded9bec7f1a1670819833240f027b25eff   
    const tokenAddresses = ["0x134e62bd2ee247d4186a1fdbaa9e076cb26c1355"]
    const balanceCheckerAddress = "0xD713aeC2156709A6AF392bb84018ACc6b44f1885"

    // Connect to token to approve
    const balanceChecker = await ethers.getContractAt(BalanceCheckerABI, balanceCheckerAddress);
    
    // Allowances returned from BalanceChecker contract
    const allowances = await balanceChecker.allowances(ownerAddresses, spenderAddresses, tokenAddresses)
    console.log("allowances: " + allowances)
 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
  