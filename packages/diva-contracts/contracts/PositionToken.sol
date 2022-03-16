// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IPositionToken.sol";

contract PositionToken is IPositionToken, ERC20 {
    uint256 private _poolId;
    address private _owner;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 poolId_
    ) ERC20(name_, symbol_) {
        _owner = msg.sender;
        _poolId = poolId_;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "PositionToken: caller is not owner");
        _;
    }

    function mint(address recipient, uint256 amount) external override onlyOwner {
        _mint(recipient, amount);
    }

    function burn(address redeemer, uint256 amount) external override onlyOwner {
        _burn(redeemer, amount);
    }

    function poolId() external view override returns (uint256) {
        return _poolId;
    }

    function owner() external view override returns (address) {
        return _owner;
    }
}
