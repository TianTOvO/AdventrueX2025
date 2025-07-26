const hre = require("hardhat");

async function main() {
  console.log("开始测试智能合约功能...");

  // 获取测试账户
  const [deployer, user1, user2, contributor1] = await ethers.getSigners();
  console.log("测试账户:");
  console.log("部署者:", deployer.address);
  console.log("用户1:", user1.address);
  console.log("用户2:", user2.address);
  console.log("贡献者1:", contributor1.address);

  // 部署合约
  console.log("\n1. 部署合约...");
  const PoolManager = await hre.ethers.getContractFactory("PoolManager");
  const poolManager = await PoolManager.deploy();
  await poolManager.deployed();

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(deployer.address);
  await escrow.deployed();

  const ProxyContract = await hre.ethers.getContractFactory("ProxyContract");
  const proxyContract = await ProxyContract.deploy(deployer.address, escrow.address);
  await proxyContract.deployed();

  // 配置合约关联
  await escrow.setProxyContract(proxyContract.address);
  await poolManager.setProxyContract(proxyContract.address);

  console.log("合约部署完成");

  // 测试用户管理功能
  console.log("\n2. 测试用户管理功能...");
  
  // 添加用户
  const addUserTx = await proxyContract.addUser(
    "张三", 
    45, 
    user1.address, 
    0, // City
    2  // Critical
  );
  await addUserTx.wait();
  console.log("✅ 用户1添加成功");

  const addUser2Tx = await proxyContract.addUser(
    "李四", 
    32, 
    user2.address, 
    1, // District
    1  // Sick
  );
  await addUser2Tx.wait();
  console.log("✅ 用户2添加成功");

  // 验证用户信息
  const user1Info = await proxyContract.getUser(1);
  const user2Info = await proxyContract.getUser(2);
  console.log("用户1信息:", {
    name: user1Info.userName,
    age: user1Info.userAge.toString(),
    address: user1Info.userAddress,
    areaLevel: user1Info.userAreaLevel.toString(),
    healthStatus: user1Info.userHealthStatus.toString()
  });

  // 测试资金池功能
  console.log("\n3. 测试资金池功能...");
  
  // 添加资金到资金池
  const addFundsTx = await poolManager.connect(contributor1).addFunds("测试资金注入", {
    value: ethers.utils.parseEther("10")
  });
  await addFundsTx.wait();
  console.log("✅ 资金注入成功");

  // 获取资金池信息
  const poolInfo = await poolManager.getPoolInfo();
  console.log("资金池信息:", {
    totalBalance: ethers.utils.formatEther(poolInfo.totalBalance),
    monthlyInflow: ethers.utils.formatEther(poolInfo.monthlyInflow),
    monthlyOutflow: ethers.utils.formatEther(poolInfo.monthlyOutflow),
    netChange: ethers.utils.formatEther(poolInfo.netChange)
  });

  // 测试拨款申请功能
  console.log("\n4. 测试拨款申请功能...");
  
  // 用户1提交申请
  const submitAppTx = await proxyContract.connect(user1).submitApplication(
    1, // userId
    ethers.utils.parseEther("1"), // amount
    "医疗费用", // reason
    "用于治疗慢性疾病，包括药物费用和定期检查" // description
  );
  await submitAppTx.wait();
  console.log("✅ 申请提交成功");

  // 用户2提交申请
  const submitApp2Tx = await proxyContract.connect(user2).submitApplication(
    2, // userId
    ethers.utils.parseEther("0.5"), // amount
    "手术费用", // reason
    "心脏手术相关费用，包括术前检查和术后康复" // description
  );
  await submitApp2Tx.wait();
  console.log("✅ 申请2提交成功");

  // 获取申请信息
  const application1 = await proxyContract.getApplication(1);
  const application2 = await proxyContract.getApplication(2);
  console.log("申请1信息:", {
    id: application1.id.toString(),
    userId: application1.userId.toString(),
    amount: ethers.utils.formatEther(application1.amount),
    reason: application1.reason,
    status: application1.status.toString()
  });

  // 测试申请审核功能
  console.log("\n5. 测试申请审核功能...");
  
  // 审核申请1为批准
  const reviewTx = await proxyContract.reviewApplication(
    1, // applicationId
    1, // Approved
    "申请已批准，资金将在3个工作日内到账" // notes
  );
  await reviewTx.wait();
  console.log("✅ 申请1审核完成");

  // 审核申请2为拒绝
  const review2Tx = await proxyContract.reviewApplication(
    2, // applicationId
    2, // Rejected
    "申请被拒绝，原因：手术费用不在当前资助范围内" // notes
  );
  await review2Tx.wait();
  console.log("✅ 申请2审核完成");

  // 获取申请统计
  const appStats = await proxyContract.getApplicationStats();
  console.log("申请统计:", {
    total: appStats.total.toString(),
    pending: appStats.pending.toString(),
    approved: appStats.approved.toString(),
    rejected: appStats.rejected.toString()
  });

  // 获取用户统计
  const user1Stats = await proxyContract.getUserStats(1);
  console.log("用户1统计:", {
    totalApplications: user1Stats.totalApplications.toString(),
    approvedApplications: user1Stats.approvedApplications.toString(),
    totalAmount: ethers.utils.formatEther(user1Stats.totalAmount)
  });

  // 测试批量操作功能
  console.log("\n6. 测试批量操作功能...");
  
  // 添加更多用户用于批量测试
  const addUser3Tx = await proxyContract.addUser(
    "王五", 
    28, 
    contributor1.address, 
    2, // Village
    0  // Healthy
  );
  await addUser3Tx.wait();

  // 批量转账
  const batchTransferTx = await proxyContract.batchTransferToUsers(
    [1, 2, 3], // userIds
    [
      ethers.utils.parseEther("0.1"),
      ethers.utils.parseEther("0.1"),
      ethers.utils.parseEther("0.1")
    ] // amounts
  );
  await batchTransferTx.wait();
  console.log("✅ 批量转账完成");

  // 验证用户余额
  const user1Balance = await proxyContract.getUserBalance(1);
  const user2Balance = await proxyContract.getUserBalance(2);
  const user3Balance = await proxyContract.getUserBalance(3);
  console.log("用户余额:", {
    user1: ethers.utils.formatEther(user1Balance),
    user2: ethers.utils.formatEther(user2Balance),
    user3: ethers.utils.formatEther(user3Balance)
  });

  // 测试资金池统计功能
  console.log("\n7. 测试资金池统计功能...");
  
  const poolStats = await poolManager.getPoolStats();
  console.log("资金池统计:", {
    totalBalance: ethers.utils.formatEther(poolStats.totalBalance),
    contributorCount: poolStats.contributorCount.toString(),
    transactionCount: poolStats.transactionCount.toString()
  });

  // 获取最近交易
  const recentTransactions = await poolManager.getRecentTransactions(5);
  console.log("最近交易数量:", recentTransactions.length);

  // 获取主要贡献者
  const [contributors, amounts] = await poolManager.getTopContributors(3);
  console.log("主要贡献者:", {
    addresses: contributors,
    amounts: amounts.map(amount => ethers.utils.formatEther(amount))
  });

  console.log("\n✅ 所有测试完成!");
  console.log("\n📋 测试总结:");
  console.log("- 用户管理功能正常");
  console.log("- 资金池功能正常");
  console.log("- 拨款申请功能正常");
  console.log("- 申请审核功能正常");
  console.log("- 批量操作功能正常");
  console.log("- 统计功能正常");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 