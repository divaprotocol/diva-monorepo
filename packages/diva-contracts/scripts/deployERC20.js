// Script to deploy an ERC20 token for testing purposes

const hre = require("hardhat");
const { parseUnits } = require('@ethersproject/units');

async function main() {

    const tokenName = "WAGMI20"
    const symbol = "WAGMI20"
    const decimals = 20
    const totalSupply = parseUnits("10000000000", decimals)
    const recipient = "0x9AdEFeb576dcF52F5220709c1B267d89d5208D78"

    const ERC20 = await hre.ethers.getContractFactory("MockERC20");
    const erc20 = await ERC20.deploy(tokenName, symbol, totalSupply, recipient, decimals);

    await erc20.deployed();

    console.log("ERC20 token to:", erc20.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
