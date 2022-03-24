// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IClaim.sol";
import "@solidstate/contracts/utils/ReentrancyGuard.sol";

contract ClaimFacet is IClaim, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    function claimFees(address _collateralToken) external override nonReentrant {
        LibDiamond.FeeClaimStorage storage fs = LibDiamond.feeClaimStorage();

        uint256 _amount = fs.claimableFeeAmount[_collateralToken][msg.sender];

        fs.claimableFeeAmount[_collateralToken][msg.sender] -= _amount;

        IERC20Metadata(_collateralToken).safeTransfer(msg.sender, _amount);

        emit FeesClaimed(msg.sender, _collateralToken, _amount);
    }

    function transferFeeClaim(
        address _recipient,
        address _collateralToken,
        uint256 _amount
    ) external override {
        LibDiamond.FeeClaimStorage storage fs = LibDiamond.feeClaimStorage();
        require(fs.claimableFeeAmount[_collateralToken][msg.sender] >= _amount, "DIVA: amount exceeds claimable fee amount");

        fs.claimableFeeAmount[_collateralToken][msg.sender] -= _amount;
        fs.claimableFeeAmount[_collateralToken][_recipient] += _amount;

        emit FeeClaimTransferred(msg.sender, _recipient, _collateralToken, _amount);
    }
}
