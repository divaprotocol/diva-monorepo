// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is Ownable, ERC20 {
    uint8 private tokenDecimals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _recipient,
        uint8 _decimals
    ) ERC20(_name, _symbol) {
        _mint(_recipient, _totalSupply);
        tokenDecimals = _decimals;
    }

    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}
