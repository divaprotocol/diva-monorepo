// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// TO BE DELETED AFTER MIGRATION OF TESTS HAS BEEN COMPLETED
// REPLACED BY MOCKERC20

contract ERC20CollateralToken is Ownable, ERC20 {
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    function mintPositionToken(uint256 nbrToken) external onlyOwner {
        _mint(msg.sender, nbrToken);
    }
}
