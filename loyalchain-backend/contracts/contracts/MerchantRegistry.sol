// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerchantRegistry is Ownable {
    mapping(address => bool) public isMerchant;
    mapping(address => address) public merchantToToken;
    event MerchantAdded(address indexed merchant, address token);
    event MerchantRemoved(address indexed merchant);

    constructor() Ownable(msg.sender) {}

    function addMerchant(address merchant, address token) external onlyOwner {
        isMerchant[merchant] = true;
        merchantToToken[merchant] = token;
        emit MerchantAdded(merchant, token);
    }

    function removeMerchant(address merchant) external onlyOwner {
        isMerchant[merchant] = false;
        delete merchantToToken[merchant];
        emit MerchantRemoved(merchant);
    }

    function getTokenForMerchant(
        address merchant
    ) external view returns (address) {
        return merchantToToken[merchant];
    }
}
