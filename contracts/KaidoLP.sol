// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title KaidoLP
 * @dev ERC20 token for Kaido LP - presale token that will be redeemed for main KAIDO token
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract KaidoLP is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    
    address private _owner;
    bool private _paused;
    
    // Presale related variables
    mapping(address => bool) public presaleParticipants;
    mapping(address => uint256) public presaleContributions; // BNB contributed
    mapping(address => uint256) public presaleTokens; // LP tokens allocated
    
    bool public presaleActive;
    uint256 public presalePrice; // Price in wei per token (e.g., 0.0004 USD worth of BNB)
    uint256 public presaleStartTime;
    uint256 public presaleEndTime;
    uint256 public minContribution; // Minimum BNB contribution
    uint256 public maxContribution; // Maximum BNB contribution
    uint256 public totalPresaleTokens; // Total tokens allocated for presale
    uint256 public soldPresaleTokens; // Total tokens sold in presale
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused();
    event Unpaused();
    event PresaleStarted(uint256 startTime, uint256 endTime, uint256 price);
    event PresaleEnded();
    event PresaleParticipation(address indexed participant, uint256 bnbAmount, uint256 tokenAmount);
    event TokensRedeemed(address indexed participant, uint256 amount);

    modifier onlyOwner() {
        require(_owner == msg.sender, "KaidoLP: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "KaidoLP: token transfer while paused");
        _;
    }

    modifier whenPresaleActive() {
        require(presaleActive && block.timestamp >= presaleStartTime && block.timestamp <= presaleEndTime, "KaidoLP: presale not active");
        _;
    }

    constructor() {
        _name = "Kaido LP";
        _symbol = "KAIDO";
        _decimals = 18;
        _totalSupply = 1000000000 * 10**_decimals; // 1 billion tokens
        _owner = msg.sender;
        _paused = false;
        
        // Mint all tokens to owner initially
        _balances[_owner] = _totalSupply;
        emit Transfer(address(0), _owner, _totalSupply);
        
        // Initialize presale parameters
        presaleActive = false;
        presalePrice = 0.0004 ether; // Default price, can be updated
        minContribution = 0.1 ether; // 0.1 BNB minimum
        maxContribution = 35 ether; // 35 BNB maximum
        totalPresaleTokens = 400000000 * 10**_decimals; // 40% of total supply for presale
        soldPresaleTokens = 0;
    }

    // ERC20 Standard Functions
    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "KaidoLP: transfer amount exceeds allowance");

        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);

        return true;
    }

    // Internal transfer function
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "KaidoLP: transfer from the zero address");
        require(recipient != address(0), "KaidoLP: transfer to the zero address");

        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "KaidoLP: transfer amount exceeds balance");

        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
    }

    // Internal approve function
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "KaidoLP: approve from the zero address");
        require(spender != address(0), "KaidoLP: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    // Owner functions
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "KaidoLP: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function pause() public onlyOwner {
        _paused = true;
        emit Paused();
    }

    function unpause() public onlyOwner {
        _paused = false;
        emit Unpaused();
    }

    function paused() public view returns (bool) {
        return _paused;
    }

    // Presale functions
    function startPresale(uint256 _startTime, uint256 _endTime, uint256 _price) public onlyOwner {
        require(!presaleActive, "KaidoLP: presale already active");
        require(_startTime < _endTime, "KaidoLP: invalid time range");
        require(_price > 0, "KaidoLP: invalid price");
        
        presaleStartTime = _startTime;
        presaleEndTime = _endTime;
        presalePrice = _price;
        presaleActive = true;
        
        emit PresaleStarted(_startTime, _endTime, _price);
    }

    function endPresale() public onlyOwner {
        require(presaleActive, "KaidoLP: presale not active");
        presaleActive = false;
        emit PresaleEnded();
    }

    function updatePresaleParams(uint256 _price, uint256 _minContribution, uint256 _maxContribution) public onlyOwner {
        presalePrice = _price;
        minContribution = _minContribution;
        maxContribution = _maxContribution;
    }

    // Presale participation function
    function participateInPresale() public payable whenPresaleActive {
        require(msg.value >= minContribution, "KaidoLP: contribution below minimum");
        require(msg.value <= maxContribution, "KaidoLP: contribution above maximum");
        
        // Calculate tokens to allocate based on BNB contribution and current BNB price
        // For simplicity, we'll use a fixed rate. In production, you'd want to use an oracle
        uint256 tokensToAllocate = (msg.value * 10**_decimals) / presalePrice;
        
        require(soldPresaleTokens + tokensToAllocate <= totalPresaleTokens, "KaidoLP: presale allocation exceeded");
        
        // Update participant data
        if (!presaleParticipants[msg.sender]) {
            presaleParticipants[msg.sender] = true;
        }
        
        presaleContributions[msg.sender] += msg.value;
        presaleTokens[msg.sender] += tokensToAllocate;
        soldPresaleTokens += tokensToAllocate;
        
        // Transfer tokens to participant
        _transfer(_owner, msg.sender, tokensToAllocate);
        
        emit PresaleParticipation(msg.sender, msg.value, tokensToAllocate);
    }

    // Withdraw BNB from presale
    function withdrawPresaleFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "KaidoLP: no funds to withdraw");
        
        payable(_owner).transfer(balance);
    }

    // Emergency functions
    function emergencyWithdraw() public onlyOwner {
        payable(_owner).transfer(address(this).balance);
    }

    // View functions for presale info
    function getPresaleInfo() public view returns (
        bool active,
        uint256 startTime,
        uint256 endTime,
        uint256 price,
        uint256 minContrib,
        uint256 maxContrib,
        uint256 totalTokens,
        uint256 soldTokens
    ) {
        return (
            presaleActive,
            presaleStartTime,
            presaleEndTime,
            presalePrice,
            minContribution,
            maxContribution,
            totalPresaleTokens,
            soldPresaleTokens
        );
    }

    function getParticipantInfo(address participant) public view returns (
        bool isParticipant,
        uint256 contribution,
        uint256 tokens
    ) {
        return (
            presaleParticipants[participant],
            presaleContributions[participant],
            presaleTokens[participant]
        );
    }

    // Receive function to accept BNB
    receive() external payable {
        if (presaleActive && block.timestamp >= presaleStartTime && block.timestamp <= presaleEndTime) {
            participateInPresale();
        } else {
            revert("KaidoLP: presale not active");
        }
    }
}
