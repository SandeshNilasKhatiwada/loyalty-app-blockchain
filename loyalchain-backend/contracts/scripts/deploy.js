const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.deployContract("LoyalFactory");
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddress);

  const registry = await hre.ethers.deployContract("MerchantRegistry");
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("Registry deployed to:", registryAddress);

  // Save to a JSON file for the API to read
  const fs = require("fs");
  const path = require("path");
  const data = { factory: factoryAddress, registry: registryAddress };
  fs.writeFileSync(
    path.join(__dirname, "../../api/contract-addresses.json"),
    JSON.stringify(data, null, 2),
  );
}

main().catch(console.error);
