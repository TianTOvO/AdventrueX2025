// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

contract PoolManager {
    // 资金池结构体
    struct Pool {
        uint totalBalance;
        uint monthlyInflow;
        uint monthlyOutflow;
        uint lastUpdateTime;
    }

    // 交易记录结构体
    struct Transaction {
        uint id;
        address from;
        address to;
        uint amount;
        string description;
        uint timestamp;
        bool isInflow;
    }

    // 贡献者结构体
    struct Contributor {
        address contributorAddress;
        uint totalContributed;
        uint lastContributionTime;
        uint contributionCount;
    }

    address public owner;
    address public proxyContract;
    bool public isProxySet;

    Pool public pool;
    uint public transactionCount;
    uint public contributorCount;

    mapping(uint => Transaction) public transactions;
    mapping(address => Contributor) public contributors;
    mapping(uint => address) public contributorIndex;

    event PoolUpdated(uint totalBalance, uint monthlyInflow, uint monthlyOutflow);
    event TransactionAdded(uint transactionId, address from, address to, uint amount, string description);
    event ContributorAdded(address contributor, uint amount);
    event ProxyContractSet(address proxyContract);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyProxyContract() {
        require(msg.sender == proxyContract, "Only proxy contract can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        isProxySet = false;
        transactionCount = 0;
        contributorCount = 0;
        pool = Pool(0, 0, 0, block.timestamp);
    }

    /**
     * @dev 设置代理合约地址
     * @param _proxyContract 代理合约地址
     */
    function setProxyContract(address _proxyContract) public onlyOwner {
        require(_proxyContract != address(0), "Proxy contract address cannot be zero");
        require(!isProxySet, "Proxy contract is already set");
        proxyContract = _proxyContract;
        isProxySet = true;
        emit ProxyContractSet(_proxyContract);
    }

    /**
     * @dev 添加资金到资金池
     * @param _description 资金描述
     */
    function addFunds(string memory _description) public payable {
        require(msg.value > 0, "Amount must be greater than zero");
        require(isProxySet, "Proxy contract not set");

        // 更新资金池
        pool.totalBalance += msg.value;
        pool.monthlyInflow += msg.value;
        pool.lastUpdateTime = block.timestamp;

        // 记录交易
        uint transactionId = ++transactionCount;
        transactions[transactionId] = Transaction({
            id: transactionId,
            from: msg.sender,
            to: address(this),
            amount: msg.value,
            description: _description,
            timestamp: block.timestamp,
            isInflow: true
        });

        // 更新贡献者信息
        if (contributors[msg.sender].contributorAddress == address(0)) {
            contributorCount++;
            contributorIndex[contributorCount] = msg.sender;
            contributors[msg.sender] = Contributor({
                contributorAddress: msg.sender,
                totalContributed: msg.value,
                lastContributionTime: block.timestamp,
                contributionCount: 1
            });
        } else {
            contributors[msg.sender].totalContributed += msg.value;
            contributors[msg.sender].lastContributionTime = block.timestamp;
            contributors[msg.sender].contributionCount++;
        }

        emit PoolUpdated(pool.totalBalance, pool.monthlyInflow, pool.monthlyOutflow);
        emit TransactionAdded(transactionId, msg.sender, address(this), msg.value, _description);
        emit ContributorAdded(msg.sender, msg.value);
    }

    /**
     * @dev 从资金池转出资金（仅代理合约可调用）
     * @param _to 接收地址
     * @param _amount 转账金额
     * @param _description 转账描述
     */
    function transferFunds(address _to, uint _amount, string memory _description) public onlyProxyContract returns (bool) {
        require(_to != address(0), "Recipient address cannot be zero");
        require(_amount > 0, "Amount must be greater than zero");
        require(pool.totalBalance >= _amount, "Insufficient pool balance");

        // 更新资金池
        pool.totalBalance -= _amount;
        pool.monthlyOutflow += _amount;
        pool.lastUpdateTime = block.timestamp;

        // 记录交易
        uint transactionId = ++transactionCount;
        transactions[transactionId] = Transaction({
            id: transactionId,
            from: address(this),
            to: _to,
            amount: _amount,
            description: _description,
            timestamp: block.timestamp,
            isInflow: false
        });

        // 执行转账
        payable(_to).transfer(_amount);

        emit PoolUpdated(pool.totalBalance, pool.monthlyInflow, pool.monthlyOutflow);
        emit TransactionAdded(transactionId, address(this), _to, _amount, _description);

        return true;
    }

    /**
     * @dev 获取资金池信息
     * @return totalBalance 总余额
     * @return monthlyInflow 本月流入
     * @return monthlyOutflow 本月流出
     * @return netChange 净变化
     */
    function getPoolInfo() public view returns (uint totalBalance, uint monthlyInflow, uint monthlyOutflow, uint netChange) {
        totalBalance = pool.totalBalance;
        monthlyInflow = pool.monthlyInflow;
        monthlyOutflow = pool.monthlyOutflow;
        netChange = monthlyInflow - monthlyOutflow;
    }

    /**
     * @dev 获取最近的交易记录
     * @param _limit 限制数量
     * @return 交易记录数组
     */
    function getRecentTransactions(uint _limit) public view returns (Transaction[] memory) {
        uint count = _limit > transactionCount ? transactionCount : _limit;
        Transaction[] memory recentTransactions = new Transaction[](count);
        
        for (uint i = 0; i < count; i++) {
            recentTransactions[i] = transactions[transactionCount - i];
        }
        
        return recentTransactions;
    }

    /**
     * @dev 获取主要贡献者
     * @param _limit 限制数量
     * @return 贡献者地址数组
     * @return 贡献金额数组
     */
    function getTopContributors(uint _limit) public view returns (address[] memory, uint[] memory) {
        uint count = _limit > contributorCount ? contributorCount : _limit;
        address[] memory addresses = new address[](count);
        uint[] memory amounts = new uint[](count);
        
        for (uint i = 0; i < count; i++) {
            address contributorAddr = contributorIndex[i + 1];
            addresses[i] = contributorAddr;
            amounts[i] = contributors[contributorAddr].totalContributed;
        }
        
        return (addresses, amounts);
    }

    /**
     * @dev 获取贡献者信息
     * @param _contributor 贡献者地址
     * @return 贡献者信息
     */
    function getContributorInfo(address _contributor) public view returns (Contributor memory) {
        return contributors[_contributor];
    }

    /**
     * @dev 重置月度统计（每月调用一次）
     */
    function resetMonthlyStats() public onlyOwner {
        pool.monthlyInflow = 0;
        pool.monthlyOutflow = 0;
        pool.lastUpdateTime = block.timestamp;
        emit PoolUpdated(pool.totalBalance, pool.monthlyInflow, pool.monthlyOutflow);
    }

    /**
     * @dev 获取资金池统计
     * @return totalBalance 总余额
     * @return contributorCount 贡献者数量
     * @return transactionCount 交易数量
     */
    function getPoolStats() public view returns (uint totalBalance, uint contributorCount, uint transactionCount) {
        totalBalance = pool.totalBalance;
        contributorCount = contributorCount;
        transactionCount = transactionCount;
    }

    /**
     * @dev 紧急提取资金（仅所有者）
     * @param _to 接收地址
     * @param _amount 提取金额
     */
    function emergencyWithdraw(address _to, uint _amount) public onlyOwner {
        require(_to != address(0), "Recipient address cannot be zero");
        require(_amount > 0, "Amount must be greater than zero");
        require(pool.totalBalance >= _amount, "Insufficient pool balance");

        pool.totalBalance -= _amount;
        payable(_to).transfer(_amount);

        emit PoolUpdated(pool.totalBalance, pool.monthlyInflow, pool.monthlyOutflow);
    }

    // 接收ETH
    receive() external payable {
        addFunds("Direct ETH transfer");
    }
} 