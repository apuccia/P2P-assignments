// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Soul is ERC20 {
    constructor(address owner, uint32 voters) ERC20("Soul", "SOU") {
        _mint(owner, 100 * voters);
    }
}