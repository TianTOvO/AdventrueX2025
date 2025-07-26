const hre = require("hardhat");

async function main() {
  console.log("开始部署智能合约...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", (await deployer.getBalance()).toString());

  // 部署 PoolManager 合约
  console.log("\n1. 部署 PoolManager 合约...");
  const PoolManager = await hre.ethers.getContractFactory("PoolManager");
  const poolManager = await PoolManager.deploy();
  await poolManager.deployed();
  console.log("PoolManager 合约地址:", poolManager.address);

  // 部署 Escrow 合约
  console.log("\n2. 部署 Escrow 合约...");
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(deployer.address);
  await escrow.deployed();
  console.log("Escrow 合约地址:", escrow.address);

  // 部署 ProxyContract 合约
  console.log("\n3. 部署 ProxyContract 合约...");
  const ProxyContract = await hre.ethers.getContractFactory("ProxyContract");
  const proxyContract = await ProxyContract.deploy(deployer.address, escrow.address);
  await proxyContract.deployed();
  console.log("ProxyContract 合约地址:", proxyContract.address);

  // 配置合约关联
  console.log("\n4. 配置合约关联...");
  
  // 设置 ProxyContract 地址到 Escrow 合约
  const setProxyTx = await escrow.setProxyContract(proxyContract.address);
  await setProxyTx.wait();
  console.log("Escrow 合约关联配置完成");

  // 设置 ProxyContract 地址到 PoolManager 合约
  const setPoolProxyTx = await poolManager.setProxyContract(proxyContract.address);
  await setPoolProxyTx.wait();
  console.log("PoolManager 合约关联配置完成");

  // 验证部署
  console.log("\n5. 验证部署结果...");
  const escrowFirstManager = await escrow.firstManager();
  const proxyFirstManager = await proxyContract.firstManager();
  const proxyEscrow = await proxyContract.escrow();
  const poolManagerProxy = await poolManager.proxyContract();

  console.log("Escrow 合约管理员:", escrowFirstManager);
  console.log("ProxyContract 管理员:", proxyFirstManager);
  console.log("ProxyContract 关联的 Escrow:", proxyEscrow);
  console.log("PoolManager 关联的 ProxyContract:", poolManagerProxy);

  console.log("\n✅ 合约部署完成!");
  console.log("\n📋 部署信息:");
  console.log("PoolManager 合约:", poolManager.address);
  console.log("Escrow 合约:", escrow.address);
  console.log("ProxyContract 合约:", proxyContract.address);
  console.log("管理员地址:", deployer.address);

  // 保存部署信息到文件
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    poolManager: poolManager.address,
    escrow: escrow.address,
    proxyContract: proxyContract.address,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 部署信息已保存到 deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 