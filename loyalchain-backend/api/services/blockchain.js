const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let addresses = {};
try {
  addresses = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../contract-addresses.json"),
      "utf-8",
    ),
  );
} catch {
  console.warn(
    "⚠ contract-addresses.json not found — blockchain features disabled",
  );
}

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

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || "http://127.0.0.1:8545",
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

class BlockchainService {
  _requireAddresses() {
    if (!addresses.factory || !addresses.registry) {
      throw new Error(
        "Blockchain not configured — deploy contracts and create contract-addresses.json",
      );
    }
  }

  _getFactory() {
    this._requireAddresses();
    return new ethers.Contract(addresses.factory, FACTORY_ABI, wallet);
  }

  _getRegistry() {
    this._requireAddresses();
    return new ethers.Contract(addresses.registry, REGISTRY_ABI, wallet);
  }

  async deployTokenForMerchant(merchantAddress, name, symbol) {
    const factory = this._getFactory();
    const tx = await factory.createToken(name, symbol, merchantAddress);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log) => log.eventName === "TokenDeployed");
    if (!event) throw new Error("TokenDeployed event not found");
    return event.args.tokenAddress;
  }

  async addMerchantToRegistry(merchantAddress, tokenAddress) {
    const registry = this._getRegistry();
    const tx = await registry.addMerchant(merchantAddress, tokenAddress);
    return tx.wait();
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
    const registry = this._getRegistry();
    return await registry.merchantToToken(merchantAddress);
  }

  async isMerchant(address) {
    const registry = this._getRegistry();
    return await registry.isMerchant(address);
  }

  // In api/services/blockchain.js
  async burnFromCustomer(tokenAddress, customerAddress, amount) {
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, this.wallet);
    const tx = await token.burnFrom(customerAddress, amount);
    return tx.wait();
  }
}

module.exports = new BlockchainService();
