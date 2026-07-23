import hre from "hardhat";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dirname = fileURLToPath(new URL(".", import.meta.url));

async function main() {
  const connection = await hre.network.create();

  const factory = await connection.viem.deployContract("LoyalFactory", []);
  const factoryAddress = factory.address;
  console.log("Factory deployed to:", factoryAddress);

  const registry = await connection.viem.deployContract("MerchantRegistry", []);
  const registryAddress = registry.address;
  console.log("Registry deployed to:", registryAddress);

  const data = { factory: factoryAddress, registry: registryAddress };
  writeFileSync(
    join(dirname, "../../backend/contract-addresses.json"),
    JSON.stringify(data, null, 2),
  );
  console.log("contract-addresses.json written");
}

main().catch(console.error);
