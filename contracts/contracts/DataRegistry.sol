// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DataRegistry is Ownable {
    mapping(address => bytes32) private _dataHashes;
    mapping(address => bytes32) private _kycHashes;

    event DataHashSet(address indexed user, bytes32 hash);
    event KycHashSet(address indexed merchant, bytes32 hash);

    constructor() Ownable(msg.sender) {}

    function setDataHash(address user, bytes32 hash) external onlyOwner {
        _dataHashes[user] = hash;
        emit DataHashSet(user, hash);
    }

    function getDataHash(address user) external view returns (bytes32) {
        return _dataHashes[user];
    }

    function setKycHash(address merchant, bytes32 hash) external onlyOwner {
        _kycHashes[merchant] = hash;
        emit KycHashSet(merchant, hash);
    }

    function getKycHash(address merchant) external view returns (bytes32) {
        return _kycHashes[merchant];
    }
}
