// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract Soul is ERC20, ERC20Detailed {
    constructor(address owner, uint32 voters)
        public
        ERC20Detailed("Soul", "SOU", 18)
    {
        _mint(owner, 100 * voters);
    }
}
