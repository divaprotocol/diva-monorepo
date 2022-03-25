const { chai, use } = require("chai");
const { solidity } = require('ethereum-waffle')
const { ethers } = require('hardhat')

use(solidity)

async function fakePositionTokenDeployFixture(name, symbol, poolId, owner) {
    const Factory = await ethers.getContractFactory('FakePositionToken')
    return (await Factory.deploy(name, symbol, poolId, owner))
}

exports.fakePositionTokenDeployFixture = fakePositionTokenDeployFixture;
