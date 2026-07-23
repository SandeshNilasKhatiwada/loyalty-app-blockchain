const { ethers } = require("ethers");

const TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function burnFrom(address account, uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const FACTORY_ABI = [
  "function createToken(string memory name, string memory symbol, address merchant) external returns (address)",
];

const REGISTRY_ABI = [
  "function addMerchant(address merchant, address token) external",
  "function isMerchant(address) view returns (bool)",
  "function merchantToToken(address) view returns (address)",
];

const DATA_REGISTRY_ABI = [
  "function setDataHash(address user, bytes32 hash) external",
  "function getDataHash(address user) view returns (bytes32)",
  "function setKycHash(address merchant, bytes32 hash) external",
  "function getKycHash(address merchant) view returns (bytes32)",
];

let provider, wallet, providerReady = false, addresses = {};
try {
  addresses = require("fs").existsSync(__dirname + "/../contract-addresses.json")
    ? JSON.parse(require("fs").readFileSync(__dirname + "/../contract-addresses.json", "utf8"))
    : {};
} catch {}

try {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545", null, { staticNetwork: true });
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY || ethers.ZeroHash, provider);
  provider.ready.then(() => { providerReady = true; }).catch(() => {});
} catch {}

function mockTx() {
  return { hash: "0x" + Date.now().toString(16).padStart(64, "0"), mock: true };
}

async function deployTokenForMerchant(merchantAddr, name, symbol) {
  if (!addresses?.factory || !providerReady) return mockTx().hash;
  try {
    const factory = new ethers.Contract(addresses.factory, FACTORY_ABI, wallet);
    const tx = await factory.createToken(name, symbol, merchantAddr);
    const receipt = await tx.wait();
    const event = receipt.logs.find(l => l.eventName === "TokenDeployed");
    return event?.args?.tokenAddress || mockTx().hash;
  } catch { return mockTx().hash; }
}

async function addMerchantToRegistry(merchantAddr, tokenAddr) {
  if (!addresses?.registry) return mockTx();
  const registry = new ethers.Contract(addresses.registry, REGISTRY_ABI, wallet);
  return (await registry.addMerchant(merchantAddr, tokenAddr)).wait();
}

async function mintTokens(tokenAddr, to, amount) {
  if (!provider || !providerReady) return mockTx();
  const token = new ethers.Contract(tokenAddr, TOKEN_ABI, wallet);
  return (await token.mint(to, amount)).wait();
}

async function burnTokens(tokenAddr, amount) {
  if (!provider || !providerReady) return mockTx();
  const token = new ethers.Contract(tokenAddr, TOKEN_ABI, wallet);
  return (await token.burn(amount)).wait();
}

async function burnFromCustomer(tokenAddr, account, amount) {
  if (!provider || !providerReady) return mockTx();
  const token = new ethers.Contract(tokenAddr, TOKEN_ABI, wallet);
  return (await token.burnFrom(account, amount)).wait();
}

async function getBalance(tokenAddr, address) {
  if (!provider || !providerReady) return "0";
  const token = new ethers.Contract(tokenAddr, TOKEN_ABI, provider);
  return (await token.balanceOf(address)).toString();
}

async function storeDataHash(userAddress, hash) {
  if (!addresses?.dataRegistry || !providerReady) return mockTx();
  try {
    const registry = new ethers.Contract(addresses.dataRegistry, DATA_REGISTRY_ABI, wallet);
    return (await registry.setDataHash(userAddress, hash)).wait();
  } catch { return mockTx(); }
}

async function getDataHash(userAddress) {
  if (!addresses?.dataRegistry || !providerReady) return null;
  try {
    const registry = new ethers.Contract(addresses.dataRegistry, DATA_REGISTRY_ABI, provider);
    const hash = await registry.getDataHash(userAddress);
    return hash !== ethers.ZeroHash ? hash : null;
  } catch { return null; }
}

async function storeKycHash(merchantAddress, hash) {
  if (!addresses?.dataRegistry || !providerReady) return mockTx();
  try {
    const registry = new ethers.Contract(addresses.dataRegistry, DATA_REGISTRY_ABI, wallet);
    return (await registry.setKycHash(merchantAddress, hash)).wait();
  } catch { return mockTx(); }
}

async function getKycHash(merchantAddress) {
  if (!addresses?.dataRegistry || !providerReady) return null;
  try {
    const registry = new ethers.Contract(addresses.dataRegistry, DATA_REGISTRY_ABI, provider);
    const hash = await registry.getKycHash(merchantAddress);
    return hash !== ethers.ZeroHash ? hash : null;
  } catch { return null; }
}

module.exports = {
  deployTokenForMerchant, addMerchantToRegistry,
  mintTokens, burnTokens, burnFromCustomer, getBalance,
  storeDataHash, getDataHash, storeKycHash, getKycHash,
};
