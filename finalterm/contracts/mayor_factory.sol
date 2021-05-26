// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.1;

import "./mayor.sol"; 

contract MayorFactory {
    constructor () {
        
    }

    function create_instance(address payable _candidate, address payable _escrow, uint32 _quorum) public {
        new Mayor(_candidate, _escrow, _quorum);
    }
}