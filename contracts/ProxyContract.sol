// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

contract ProxyContract {

    // 用户地区层级
    // 0-2
    enum AreaLevel{
        City,
        District,
        Village
    }

    // 用户健康状态
    // 健康、病态、危急
    // 0-2
    enum usersHealthStatus{
        Healthy, // 没有重大疾病
        Sick, // 有重大疾病
        Critical // 病危
    }

    // 申请状态枚举
    // 0-2
    enum ApplicationStatus {
        Pending,    // 待审核
        Approved,   // 已批准
        Rejected    // 已拒绝
    }

    // todo 设计用户经济状况分级(DisputeDAO合约需要同步更改)

    struct User{
        string userName;
        uint id;
        uint userAge;
        address userAddress;
        AreaLevel userAreaLevel;
        usersHealthStatus userHealthStatus;
    }

    // 拨款申请结构体
    struct GrantApplication {
        uint id;
        uint userId;
        uint amount;
        string reason;
        string description;
        ApplicationStatus status;
        uint appliedDate;
        uint processedDate;
        string notes;
    }

    address public firstManager;

    address[] public managers;

    mapping (uint => User) public users;
    mapping (uint => uint) public userBalance;
    mapping (uint => GrantApplication) public applications;
    mapping (uint => uint[]) public userApplications; // 用户ID => 申请ID数组

    event UserAdded(string name, uint id, uint age, address userAddress);
    event TransferToUser(address userAddress, uint amount);
    event UserDeleted(uint id);
    event ManagerChanged(address newManager);
    // 合约更新事件
    event ContractAddressUpdated (string contractName, address contractAddress);
    // 申请相关事件
    event ApplicationSubmitted(uint applicationId, uint userId, uint amount, string reason);
    event ApplicationReviewed(uint applicationId, ApplicationStatus status, string notes);
    event UserBalanceUpdated(uint userId, uint newBalance);

    address public owner;
    uint public userCount;
    uint public applicationCount;

    /* 逻辑合约地址 */
    address public escrow;

    constructor(address _firstManager, address _escrow) {
        require(_firstManager != address(0), "First manager address cannot be zero");
        firstManager = _firstManager;
        managers.push(_firstManager);
        owner = msg.sender;
        escrow = _escrow;
        userCount = 0;
        applicationCount = 0;
    }

    modifier onlyFirstManagerOrOwner() {
        require(msg.sender == firstManager || msg.sender == owner, "Only the first manager or owner can call this function");
        _;
    }


    function addUser(string memory _name, uint _age, address _address, AreaLevel _areaLevel, usersHealthStatus _healthStatus) public onlyFirstManagerOrOwner() returns (bool, uint) {
        require(_address != address(0), "User address cannot be zero");
        require(bytes(_name).length > 0, "User name cannot be empty");
        uint _id = ++userCount;
        require(bytes(users[_id].userName).length == 0, "User already exists");

        require(uint(_areaLevel) <= 2, "Invalid area level (0-2)");
        require(uint(_healthStatus) <= 2, "Invalid health status (0-2)");

        users[_id] = User(_name, _id, _age, _address, _areaLevel, _healthStatus);
        emit UserAdded(_name, _id, _age, _address);

        return (true, _id);
    }

    function getUser(uint _id) public view returns (User memory) {
        return users[_id];
    }

    function getAllUsers() public view returns (User[] memory) {
        User[] memory allUsers = new User[](userCount);
        for (uint i = 1; i <= userCount; i++) {
            allUsers[i - 1] = users[i];
        }
        return allUsers;
    }

    function updateUser(uint _id, string memory _name, uint _age, address _address, AreaLevel _areaLevel, usersHealthStatus _healthStatus) public onlyFirstManagerOrOwner(){
        require(_address != address(0), "User address cannot be zero");
        require(bytes(users[_id].userName).length != 0, "User does not exist");
        require(_id > 0, "User ID must be greater than zero");
        require(bytes(_name).length > 0, "User name cannot be empty");

        require(uint(_areaLevel) <= 2, "Invalid area level (0-2)");
        require(uint(_healthStatus) <= 2, "Invalid health status (0-2)");
                
        users[_id] = User(_name, _id, _age, _address, _areaLevel, _healthStatus);
        emit UserAdded(_name, _id, _age, _address);
    }

    function deleteUser(uint _id) public onlyFirstManagerOrOwner() {
        require(bytes(users[_id].userName).length != 0, "User does not exist");
        delete users[_id];
        emit UserDeleted(_id);
    }

    function transferToUser(address _userAddress, uint _amount, uint _userId) public payable onlyFirstManagerOrOwner() {
        require(_userAddress != address(0), "User address cannot be zero");
        require(_amount > 0, "Transfer amount must be greater than zero");
        require(users[_userId].userAddress == _userAddress, "User address does not match the user ID");
        // 调用escrow合约
        (bool success, ) = escrow.call(
            abi.encodeWithSignature("transferToUser(address,uint256)", _userAddress, _amount)
        );
        require(success, "Escrow deposit failed");
        emit TransferToUser(_userAddress, _amount);
    }

    function getUserBalance(uint _userId) public view returns (uint) {
        return userBalance[_userId];
    }

    function setNextManager(address _nextManager) public onlyFirstManagerOrOwner() {
        require(_nextManager != address(0), "Next manager address cannot be zero");
        firstManager = _nextManager;
        managers.push(_nextManager);
        emit ManagerChanged(_nextManager);
    }

    function getAllManagers() public view returns (address[] memory) {
        return managers;
    }

    function getManagersByIndex(uint _index) public view returns (address) {
        require(_index < managers.length, "Index out of bounds");
        return managers[_index];
    }

    function updateEscrowAddress(address _escrow) public onlyFirstManagerOrOwner() {
        require(_escrow != address(0), "Escrow address cannot be zero");
        escrow = _escrow;

        emit ContractAddressUpdated("Escrow", _escrow);
    }

    // ========== 拨款申请相关函数 ==========

    /**
     * @dev 用户提交拨款申请
     * @param _userId 用户ID
     * @param _amount 申请金额
     * @param _reason 申请原因
     * @param _description 详细描述
     * @return 申请ID
     */
    function submitApplication(uint _userId, uint _amount, string memory _reason, string memory _description) public returns (uint) {
        require(_userId > 0 && _userId <= userCount, "Invalid user ID");
        require(_amount > 0, "Amount must be greater than zero");
        require(bytes(_reason).length > 0, "Reason cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        // 验证调用者是用户本人
        require(users[_userId].userAddress == msg.sender, "Only the user can submit application");

        uint applicationId = ++applicationCount;
        applications[applicationId] = GrantApplication({
            id: applicationId,
            userId: _userId,
            amount: _amount,
            reason: _reason,
            description: _description,
            status: ApplicationStatus.Pending,
            appliedDate: block.timestamp,
            processedDate: 0,
            notes: ""
        });

        // 添加到用户的申请列表
        userApplications[_userId].push(applicationId);

        emit ApplicationSubmitted(applicationId, _userId, _amount, _reason);
        return applicationId;
    }

    /**
     * @dev 管理员审核申请
     * @param _applicationId 申请ID
     * @param _status 审核状态
     * @param _notes 审核备注
     */
    function reviewApplication(uint _applicationId, ApplicationStatus _status, string memory _notes) public onlyFirstManagerOrOwner() {
        require(_applicationId > 0 && _applicationId <= applicationCount, "Invalid application ID");
        require(applications[_applicationId].status == ApplicationStatus.Pending, "Application is not pending");

        applications[_applicationId].status = _status;
        applications[_applicationId].processedDate = block.timestamp;
        applications[_applicationId].notes = _notes;

        // 如果批准申请，自动转账给用户
        if (_status == ApplicationStatus.Approved) {
            uint userId = applications[_applicationId].userId;
            uint amount = applications[_applicationId].amount;
            address userAddress = users[userId].userAddress;
            
            // 调用escrow合约转账
            (bool success, ) = escrow.call(
                abi.encodeWithSignature("transferToUser(address,uint256)", userAddress, amount)
            );
            require(success, "Transfer failed");

            // 更新用户余额
            userBalance[userId] += amount;
            emit UserBalanceUpdated(userId, userBalance[userId]);
        }

        emit ApplicationReviewed(_applicationId, _status, _notes);
    }

    /**
     * @dev 批量审核申请
     * @param _applicationIds 申请ID数组
     * @param _statuses 状态数组
     */
    function batchReviewApplications(uint[] memory _applicationIds, ApplicationStatus[] memory _statuses) public onlyFirstManagerOrOwner() {
        require(_applicationIds.length == _statuses.length, "Arrays length mismatch");
        
        for (uint i = 0; i < _applicationIds.length; i++) {
            reviewApplication(_applicationIds[i], _statuses[i], "");
        }
    }

    /**
     * @dev 获取用户的所有申请
     * @param _userId 用户ID
     * @return 申请ID数组
     */
    function getUserApplications(uint _userId) public view returns (uint[] memory) {
        return userApplications[_userId];
    }

    /**
     * @dev 获取所有申请
     * @return 申请数组
     */
    function getAllApplications() public view returns (GrantApplication[] memory) {
        GrantApplication[] memory allApplications = new GrantApplication[](applicationCount);
        for (uint i = 1; i <= applicationCount; i++) {
            allApplications[i - 1] = applications[i];
        }
        return allApplications;
    }

    /**
     * @dev 获取申请详情
     * @param _applicationId 申请ID
     * @return 申请详情
     */
    function getApplication(uint _applicationId) public view returns (GrantApplication memory) {
        require(_applicationId > 0 && _applicationId <= applicationCount, "Invalid application ID");
        return applications[_applicationId];
    }

    /**
     * @dev 获取申请统计
     * @return total 总申请数
     * @return pending 待审核数
     * @return approved 已批准数
     * @return rejected 已拒绝数
     */
    function getApplicationStats() public view returns (uint total, uint pending, uint approved, uint rejected) {
        total = applicationCount;
        for (uint i = 1; i <= applicationCount; i++) {
            if (applications[i].status == ApplicationStatus.Pending) {
                pending++;
            } else if (applications[i].status == ApplicationStatus.Approved) {
                approved++;
            } else if (applications[i].status == ApplicationStatus.Rejected) {
                rejected++;
            }
        }
    }

    /**
     * @dev 获取用户统计
     * @param _userId 用户ID
     * @return totalApplications 总申请数
     * @return approvedApplications 已批准申请数
     * @return totalAmount 总批准金额
     */
    function getUserStats(uint _userId) public view returns (uint totalApplications, uint approvedApplications, uint totalAmount) {
        uint[] memory userAppIds = userApplications[_userId];
        totalApplications = userAppIds.length;
        
        for (uint i = 0; i < userAppIds.length; i++) {
            GrantApplication memory app = applications[userAppIds[i]];
            if (app.status == ApplicationStatus.Approved) {
                approvedApplications++;
                totalAmount += app.amount;
            }
        }
    }

    /**
     * @dev 更新用户余额
     * @param _userId 用户ID
     * @param _newBalance 新余额
     */
    function updateUserBalance(uint _userId, uint _newBalance) public onlyFirstManagerOrOwner() {
        require(_userId > 0 && _userId <= userCount, "Invalid user ID");
        userBalance[_userId] = _newBalance;
        emit UserBalanceUpdated(_userId, _newBalance);
    }

    /**
     * @dev 批量转账给用户
     * @param _userIds 用户ID数组
     * @param _amounts 金额数组
     */
    function batchTransferToUsers(uint[] memory _userIds, uint[] memory _amounts) public payable onlyFirstManagerOrOwner() {
        require(_userIds.length == _amounts.length, "Arrays length mismatch");
        
        for (uint i = 0; i < _userIds.length; i++) {
            uint userId = _userIds[i];
            uint amount = _amounts[i];
            
            require(userId > 0 && userId <= userCount, "Invalid user ID");
            require(amount > 0, "Amount must be greater than zero");
            
            address userAddress = users[userId].userAddress;
            
            // 调用escrow合约转账
            (bool success, ) = escrow.call(
                abi.encodeWithSignature("transferToUser(address,uint256)", userAddress, amount)
            );
            require(success, "Transfer failed");

            // 更新用户余额
            userBalance[userId] += amount;
            emit UserBalanceUpdated(userId, userBalance[userId]);
        }
    }
    
}