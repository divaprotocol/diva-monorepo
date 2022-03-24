const { chai, use } = require("chai");
const { solidity } = require('ethereum-waffle')
const { ethers } = require('hardhat')

use(solidity)

async function positionTokenAttachFixture(tokenAddress) {
    const Factory = await ethers.getContractFactory('PositionToken')
    return (await Factory.attach(tokenAddress))
}

exports.positionTokenAttachFixture = positionTokenAttachFixture;
