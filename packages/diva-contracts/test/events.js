const { ethers } = require("hardhat");

async function poolIssuedEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('PoolIssued(uint256,address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function liquidityAddedEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('LiquidityAdded(uint256,address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function liquidityRemovedEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('LiquidityRemoved(uint256,address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function statusChangedEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('StatusChanged(uint8,address,uint256,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function feeClaimAllocatedEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('FeeClaimAllocated(uint256,address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events
}

async function feesClaimedEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('FeesClaimed(address,address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function feeClaimTransferredEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('FeeClaimTransferred(address,address,address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function redemptionFeeSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('RedemptionFeeSet(address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function settlementFeeSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('SettlementFeeSet(address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function submissionPeriodSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('SubmissionPeriodSet(address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function challengePeriodSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('ChallengePeriodSet(address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function reviewPeriodSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('ReviewPeriodSet(address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function fallbackSubmissionPeriodSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('FallbackSubmissionPeriodSet(address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function treasuryAddressSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('TreasuryAddressSet(address,address)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function fallbackDataProviderSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('FallbackDataProviderSet(address,address)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function ownershipTransferredEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('OwnershipTransferred(address,address)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function pauseReceiveCollateralSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('PauseReceiveCollateralSet(address,bool)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

async function pauseReturnCollateralSetEvent(contract) {
    const filter = {
        address: contract.address,
        topics: [ethers.utils.id('PauseReturnCollateralSet(address,uint256)')],
    }

    const events = await contract.queryFilter(filter, 'latest')
    return events[0].args
}

exports.poolIssuedEvent = poolIssuedEvent;
exports.liquidityAddedEvent = liquidityAddedEvent;
exports.liquidityRemovedEvent = liquidityRemovedEvent;
exports.statusChangedEvent = statusChangedEvent;
exports.feeClaimAllocatedEvent = feeClaimAllocatedEvent;
exports.feesClaimedEvent = feesClaimedEvent;
exports.feeClaimTransferredEvent = feeClaimTransferredEvent;
exports.redemptionFeeSetEvent = redemptionFeeSetEvent;
exports.settlementFeeSetEvent = settlementFeeSetEvent;
exports.submissionPeriodSetEvent = submissionPeriodSetEvent;
exports.challengePeriodSetEvent = challengePeriodSetEvent;
exports.reviewPeriodSetEvent = reviewPeriodSetEvent;
exports.fallbackSubmissionPeriodSetEvent = fallbackSubmissionPeriodSetEvent;
exports.treasuryAddressSetEvent = treasuryAddressSetEvent;
exports.fallbackDataProviderSetEvent = fallbackDataProviderSetEvent;
exports.ownershipTransferredEvent = ownershipTransferredEvent;
exports.pauseReceiveCollateralSetEvent = pauseReceiveCollateralSetEvent;
exports.pauseReturnCollateralSetEvent = pauseReturnCollateralSetEvent;