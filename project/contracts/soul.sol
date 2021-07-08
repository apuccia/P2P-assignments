// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SOUToken is ERC20 {
    mapping(address => bool) private casted;

    constructor() ERC20("Soul", "SOU") {}

    function mint(address _target) public {
        if (!casted[_target]) {
            casted[_target] = true;
            // fixed, 18 decimals
            _mint(_target, 100 * (10**uint256(decimals())));
        }
    }
}
