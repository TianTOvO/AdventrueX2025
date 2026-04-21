// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

contract Escrow {
    // 资金库
    uint public platformPool;
    address public owner;
    address public firstManager;
    address public proxyContract;
    bool public isSet;

// test test
// test test
// test test

    // 资金库添加者结构体
    struct Contributor {
        address contributorAddress;
        uint amount;
    }

    // 资金库添加者记录
    mapping (address => Contributor) public contributors;

    event PlatformPoolUpdated(uint newAmount);
    event FirstManagerChanged(address newManager);
    event ProxyContractSet(address proxyContract);

    constructor(address _firstManager) {
        require(_firstManager != address(0), "First manager address cannot be zero");
        firstManager = _firstManager;
        owner = msg.sender;
        isSet = false;
        platformPool = 0;
    }

    modifier onlyOwnerOrFirstManager() {
        require(msg.sender == owner || msg.sender == firstManager, "Only the owner or first manager can call this function");
        _;
    }

    modifier onlyProxyContract() {
        require(msg.sender == proxyContract, "Only the proxy contract can call this function");
        _;
    }

    function addPlatformPool() public payable onlyOwnerOrFirstManager() {
        require(msg.value > 0, "Amount must be greater than zero");
        platformPool = platformPool + msg.value;
        
        // 更新贡献者记录
        if (contributors[msg.sender].contributorAddress == address(0)) {
            contributors[msg.sender] = Contributor(msg.sender, msg.value);
        } else {
            contributors[msg.sender].amount += msg.value;
        }
        
        emit PlatformPoolUpdated(platformPool);
    }

    function getContributor(address _address) public view returns (address, uint) {
        Contributor memory contributor = contributors[_address];
        return (contributor.contributorAddress, contributor.amount);
    }

    function getPlatformPool() public view returns (uint) {
        return platformPool;
    }

    function setProxyContract(address _proxyContract) public onlyOwnerOrFirstManager() {
        require(_proxyContract != address(0), "Proxy contract address cannot be zero");
        require(!isSet, "Proxy contract is already set");
        proxyContract = _proxyContract;
        isSet = true;
        emit ProxyContractSet(_proxyContract);
    }

    function transferToUser(address _userAddress, uint _amount) public onlyProxyContract() returns (bool) {
        require(_userAddress != address(0), "User address cannot be zero");
        require(_amount > 0, "Transfer amount must be greater than zero");
        require(platformPool >= _amount, "Insufficient platform pool balance");

        platformPool -= _amount;
        payable(_userAddress).transfer(_amount);
        
        emit PlatformPoolUpdated(platformPool);
        return true;
    }

    function setFirstManager(address _newManager) public onlyOwnerOrFirstManager() {
        require(_newManager != address(0), "New manager address cannot be zero");
        firstManager = _newManager;
        emit FirstManagerChanged(_newManager);
    }

    // 接收ETH
    receive() external payable {
        // 允许直接接收ETH
    }
}