const { run } = require("hardhat");
const deployments = require("../deployments.json");

async function main() {
  console.log("🔍 Verifying contracts on block explorer...");

  if (!deployments.contracts) {
    console.error("❌ No contracts found in deployments.json");
    process.exit(1);
  }

  const { AgentRegistry, AgentDAO } = deployments.contracts;

  try {
    // Verify AgentRegistry
    console.log("📝 Verifying AgentRegistry...");
    await run("verify:verify", {
      address: AgentRegistry,
      constructorArguments: [],
    });
    console.log("✅ AgentRegistry verified");

    // Verify AgentDAO
    console.log("🗳️  Verifying AgentDAO...");
    await run("verify:verify", {
      address: AgentDAO,
      constructorArguments: [AgentRegistry],
    });
    console.log("✅ AgentDAO verified");

    console.log("\n🎉 All contracts verified successfully!");
  } catch (error) {
    console.error("❌ Verification error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 