// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Kaido LP Token
 * @dev Simple ERC-20 token for presale participants
 * This token will be manually distributed to presale participants
 * and later redeemed for the main KAIDO token
 */
contract KaidoLPToken {
    string public name = "Kaido LP";
    string public symbol = "KAIDO";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    address public owner;
    bool public paused = false;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused();
    event Unpaused();
    
    modifier onlyOwner() {
        require(msg.sender == owner, "KaidoLP: caller is not the owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "KaidoLP: token transfer while paused");
        _;
    }
    
    constructor() {
        totalSupply = 1000000000 * 10**decimals; // 1 billion tokens
        owner = msg.sender;
        _balances[owner] = totalSupply;
        emit Transfer(address(0), owner, totalSupply);
    }
    
    /**
     * @dev Returns the balance of the specified address
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @dev Transfer tokens to a specified address
     */
    function transfer(address to, uint256 amount) public whenNotPaused returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @dev Returns the remaining number of tokens that spender is allowed to spend
     */
    function allowance(address tokenOwner, address spender) public view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }
    
    /**
     * @dev Approve the passed address to spend the specified amount of tokens
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Transfer tokens from one address to another
     */
    function transferFrom(address from, address to, uint256 amount) public whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "KaidoLP: transfer amount exceeds allowance");
        
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    /**
     * @dev Internal transfer function
     */
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "KaidoLP: transfer from the zero address");
        require(to != address(0), "KaidoLP: transfer to the zero address");
        require(_balances[from] >= amount, "KaidoLP: transfer amount exceeds balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }
    
    /**
     * @dev Internal approve function
     */
    function _approve(address tokenOwner, address spender, uint256 amount) internal {
        require(tokenOwner != address(0), "KaidoLP: approve from the zero address");
        require(spender != address(0), "KaidoLP: approve to the zero address");
        
        _allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }
    
    /**
     * @dev Batch transfer tokens to multiple addresses (for manual distribution)
     */
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "KaidoLP: arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Mint additional tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "KaidoLP: mint to the zero address");
        
        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @dev Burn tokens from owner's balance
     */
    function burn(uint256 amount) external onlyOwner {
        require(_balances[msg.sender] >= amount, "KaidoLP: burn amount exceeds balance");
        
        _balances[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }
    
    /**
     * @dev Transfer ownership of the contract
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "KaidoLP: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @dev Emergency function to recover any BNB sent to contract
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
