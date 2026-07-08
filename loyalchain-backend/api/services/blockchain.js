const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// 1. Load contract addresses (from Hardhat deployment)
const addresses = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf-8"),
);

// 2. Minimal ABIs (only the functions we need)
const TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const FACTORY_ABI = [
  "function createToken(string memory name, string memory symbol, address merchant) external returns (address)",
];

const REGISTRY_ABI = [
  "function addMerchant(address merchant, address token) external",
  "function isMerchant(address) view returns (bool)",
  "function merchantToToken(address) view returns (address)",
];

// 3. Connect to blockchain
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || "http://127.0.0.1:8545",
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 4. Instantiate contracts
const factory = new ethers.Contract(addresses.factory, FACTORY_ABI, wallet);
const registry = new ethers.Contract(addresses.registry, REGISTRY_ABI, wallet);

class BlockchainService {
  async deployTokenForMerchant(merchantAddress, name, symbol) {
    const tx = await factory.createToken(name, symbol, merchantAddress);
    const receipt = await tx.wait();
    // Find the TokenDeployed event (emitted by Factory)
    const event = receipt.logs.find((log) => log.eventName === "TokenDeployed");
    if (!event) throw new Error("TokenDeployed event not found");
    return event.args.tokenAddress;
  }

  async mintTokens(tokenAddress, to, amount) {
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
    const tx = await token.mint(to, amount);
    return tx.wait();
  }

  async burnTokens(tokenAddress, amount) {
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
    const tx = await token.burn(amount);
    return tx.wait();
  }

  async getBalance(tokenAddress, address) {
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
    const balance = await token.balanceOf(address);
    return balance.toString();
  }

  async getTokenForMerchant(merchantAddress) {
    return await registry.merchantToToken(merchantAddress);
  }

  async isMerchant(address) {
    return await registry.isMerchant(address);
  }
}

module.exports = new BlockchainService();
