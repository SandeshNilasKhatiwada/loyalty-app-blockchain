// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "./LoyalToken.sol";

contract LoyalFactory {
    event TokenDeployed(
        address indexed merchant,
        address tokenAddress,
        string name,
        string symbol
    );

    function createToken(
        string memory name,
        string memory symbol,
        address merchant
    ) external returns (address) {
        LoyalToken token = new LoyalToken(name, symbol, merchant);
        emit TokenDeployed(merchant, address(token), name, symbol);
        return address(token);
    }
}
