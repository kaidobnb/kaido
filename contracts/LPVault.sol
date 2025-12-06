// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @dev Interface for PredictionFactory
 */
interface IPredictionFactory {
    function addLPLiquidity(
        uint256 predictionId,
        string[] memory choices,
        uint256[] memory amounts
    ) external;
}

/**
 * @dev Interface for FeeDistributor
 */
interface IFeeDistributor {
    enum BoostType { NONE, BOOST_VAULT, CREATOR_VAULT }

    function setBoostType(uint256 predictionId, BoostType boostType) external;
}

/**
 * @title LPVault
 * @dev KAIDO LP Vault - Dual vault system (70% Boost / 30% Creator-Engagement)
 *
 * ATTENTION LIQUIDITY MODEL:
 * - Users stake BNB, auto-split into 70% Boost Vault + 30% Creator/Engagement Vault
 * - Admin deploys LP to predictions as "attention liquidity"
 * - LP positions are displayed but NOT paid out to winners
 * - LP funds return to vault after resolution
 * - LP earns yield from 3 engines: KAIDO Boost, Creator Backing, Engagement Boost
 */
contract LPVault {

    // Vault Types
    enum VaultType { BOOST, CREATOR_ENGAGEMENT }

    // State variables
    address public owner;
    address public admin;
    address public predictionFactory;
    address public feeDistributor;

    // Vault Balances (70/30 split)
    uint256 public totalLPStaked;           // Total BNB staked by all LPs
    uint256 public boostVaultBalance;       // 70% - For KAIDO-created markets
    uint256 public creatorEngagementVaultBalance; // 30% - For creator collabs & campaigns

    // LP Shares (not tokens, internal accounting)
    mapping(address => uint256) public userLPBalance; // User's share of total LP

    // Yield Tracking (Three Engines)
    uint256 public lpBoostYield;            // From KAIDO boost markets
    uint256 public lpCreatorYield;          // From creator partnerships
    uint256 public lpEngagementYield;       // From engagement campaigns
    uint256 public totalLPYield;            // Sum of all yield

    // Claimed Tracking
    mapping(address => uint256) public lpClaimed; // Amount already claimed by user
    
    // Deployment tracking
    struct LPDeployment {
        uint256 predictionId;
        VaultType vaultType;
        uint256 totalAmount;
        bool returned;
        uint256 deployedAt;
        uint256 returnedAt;
    }

    mapping(uint256 => LPDeployment) public deployments;
    uint256[] public activePredictionIds;

    // Configuration
    uint256 public constant BOOST_VAULT_PERCENTAGE = 70;
    uint256 public constant CREATOR_VAULT_PERCENTAGE = 30;
    uint256 public constant MAX_DEPLOYMENT_PER_PREDICTION = 20;
    uint256 public constant MIN_STAKE_AMOUNT = 0.01 ether;
    uint256 public engagementYieldPercentage = 30; // Configurable

    // Events
    event LPStaked(address indexed user, uint256 amount);
    event LPUnstaked(address indexed user, uint256 amount);
    event BoostApplied(uint256 indexed predictionId, VaultType vaultType, uint256 amount);
    event LPYieldRecorded(string source, uint256 amount);
    event LPRewardsClaimed(address indexed user, uint256 amount);
    event LiquidityReturned(uint256 indexed predictionId, uint256 amount);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == owner, "Only admin");
        _;
    }
    
    modifier onlyPredictionFactory() {
        require(msg.sender == predictionFactory, "Only prediction factory");
        _;
    }
    
    constructor(address _admin) {
        owner = msg.sender;
        admin = _admin;
    }
    
    /**
     * @dev Stake BNB - Auto-splits into 70% Boost Vault + 30% Creator/Engagement Vault
     */
    function stake() external payable {
        require(msg.value >= MIN_STAKE_AMOUNT, "Below minimum stake");

        // Split deposit: 70% Boost, 30% Creator/Engagement
        uint256 boostAmount = (msg.value * BOOST_VAULT_PERCENTAGE) / 100;
        uint256 creatorAmount = (msg.value * CREATOR_VAULT_PERCENTAGE) / 100;

        boostVaultBalance += boostAmount;
        creatorEngagementVaultBalance += creatorAmount;

        // Track user's LP share (internal accounting, not tokens)
        userLPBalance[msg.sender] += msg.value;
        totalLPStaked += msg.value;

        emit LPStaked(msg.sender, msg.value);
    }
    
    /**
     * @dev Unstake BNB - Returns proportional share from both vaults
     */
    function unstake(uint256 amount) external {
        require(userLPBalance[msg.sender] >= amount, "Insufficient LP balance");
        require(amount > 0, "Must unstake some amount");

        // Calculate proportional withdrawal from each vault
        uint256 boostWithdrawal = (amount * BOOST_VAULT_PERCENTAGE) / 100;
        uint256 creatorWithdrawal = (amount * CREATOR_VAULT_PERCENTAGE) / 100;

        require(boostVaultBalance >= boostWithdrawal, "Insufficient boost vault");
        require(creatorEngagementVaultBalance >= creatorWithdrawal, "Insufficient creator vault");

        // Update balances
        userLPBalance[msg.sender] -= amount;
        totalLPStaked -= amount;
        boostVaultBalance -= boostWithdrawal;
        creatorEngagementVaultBalance -= creatorWithdrawal;

        // Transfer BNB
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Unstake transfer failed");

        emit LPUnstaked(msg.sender, amount);
    }
    
    /**
     * @dev Admin boosts a prediction with LP from selected vault
     * @param predictionId The prediction to boost
     * @param vaultType Which vault to use (BOOST or CREATOR_ENGAGEMENT)
     * @param choices Array of choice names to fund
     * @param amounts Array of amounts for each choice
     */
    function adminBoostPrediction(
        uint256 predictionId,
        VaultType vaultType,
        string[] memory choices,
        uint256[] memory amounts
    )
        external
        onlyAdmin
    {
        require(choices.length == amounts.length, "Arrays length mismatch");
        require(choices.length > 0, "Must provide at least one choice");
        require(!deployments[predictionId].returned || deployments[predictionId].totalAmount == 0, "Already deployed");

        // Calculate total amount
        uint256 totalAmount = 0;
        for (uint i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Amount must be positive");
            totalAmount += amounts[i];
        }

        // Check max deployment limit (20% of total LP staked)
        uint256 maxDeployment = (totalLPStaked * MAX_DEPLOYMENT_PER_PREDICTION) / 100;
        require(totalAmount <= maxDeployment, "Exceeds max deployment");

        // Deduct from selected vault
        if (vaultType == VaultType.BOOST) {
            require(totalAmount <= boostVaultBalance, "Insufficient boost vault balance");
            boostVaultBalance -= totalAmount;
        } else {
            require(totalAmount <= creatorEngagementVaultBalance, "Insufficient creator vault balance");
            creatorEngagementVaultBalance -= totalAmount;
        }

        // Record deployment
        deployments[predictionId] = LPDeployment({
            predictionId: predictionId,
            vaultType: vaultType,
            totalAmount: totalAmount,
            returned: false,
            deployedAt: block.timestamp,
            returnedAt: 0
        });

        activePredictionIds.push(predictionId);

        // Set boost type in FeeDistributor
        if (feeDistributor != address(0)) {
            IFeeDistributor.BoostType boostType = vaultType == VaultType.BOOST
                ? IFeeDistributor.BoostType.BOOST_VAULT
                : IFeeDistributor.BoostType.CREATOR_VAULT;
            IFeeDistributor(feeDistributor).setBoostType(predictionId, boostType);
        }

        // Call PredictionFactory to add LP liquidity
        // Note: No BNB is transferred - LP is virtual/attention liquidity
        IPredictionFactory(predictionFactory).addLPLiquidity(
            predictionId,
            choices,
            amounts
        );

        emit BoostApplied(predictionId, vaultType, totalAmount);
    }

    /**
     * @dev Return liquidity from a prediction (called by PredictionFactory after resolution)
     * @param predictionId The prediction that resolved
     */
    function returnLiquidity(uint256 predictionId)
        external
        onlyPredictionFactory
    {
        LPDeployment storage deployment = deployments[predictionId];
        require(deployment.totalAmount > 0, "No deployment found");
        require(!deployment.returned, "Already returned");

        // Return to the vault it came from
        if (deployment.vaultType == VaultType.BOOST) {
            boostVaultBalance += deployment.totalAmount;
        } else {
            creatorEngagementVaultBalance += deployment.totalAmount;
        }

        deployment.returned = true;
        deployment.returnedAt = block.timestamp;

        // Remove from active predictions
        _removeFromActivePredictions(predictionId);

        emit LiquidityReturned(predictionId, deployment.totalAmount);
    }

    /**
     * @dev Record yield from KAIDO boost markets (30% of 1% KAIDO fee)
     * Called by FeeDistributor or PredictionFactory
     */
    function recordBoostYield(uint256 amount) external payable {
        require(msg.value == amount, "Amount mismatch");

        uint256 lpShare = (amount * 30) / 100; // 30% to LP
        lpBoostYield += lpShare;
        totalLPYield += lpShare;

        // Return remaining 70% to treasury
        uint256 treasuryShare = amount - lpShare;
        if (treasuryShare > 0) {
            (bool success, ) = owner.call{value: treasuryShare}("");
            require(success, "Treasury transfer failed");
        }

        emit LPYieldRecorded("kaido_boost", lpShare);
    }

    /**
     * @dev Record yield from creator partnerships (30% of affiliate + KAIDO fees)
     * Called by FeeDistributor
     */
    function recordCreatorYield(uint256 affiliateFee, uint256 kaidoFee) external payable {
        require(msg.value == affiliateFee + kaidoFee, "Amount mismatch");

        uint256 lpShare = ((affiliateFee + kaidoFee) * 30) / 100; // 30% to LP
        lpCreatorYield += lpShare;
        totalLPYield += lpShare;

        // Return remaining 70% to treasury
        uint256 treasuryShare = (affiliateFee + kaidoFee) - lpShare;
        if (treasuryShare > 0) {
            (bool success, ) = owner.call{value: treasuryShare}("");
            require(success, "Treasury transfer failed");
        }

        emit LPYieldRecorded("creator_backing", lpShare);
    }

    /**
     * @dev Record yield from engagement campaigns (configurable %)
     * Called by FeeDistributor or campaign contracts
     */
    function recordEngagementYield(uint256 feeAmount) external payable {
        require(msg.value == feeAmount, "Amount mismatch");

        uint256 lpShare = (feeAmount * engagementYieldPercentage) / 100;
        lpEngagementYield += lpShare;
        totalLPYield += lpShare;

        // Return remaining to treasury
        uint256 treasuryShare = feeAmount - lpShare;
        if (treasuryShare > 0) {
            (bool success, ) = owner.call{value: treasuryShare}("");
            require(success, "Treasury transfer failed");
        }

        emit LPYieldRecorded("engagement_boost", lpShare);
    }

    /**
     * @dev Claim LP rewards - Users claim proportional share of total yield
     */
    function claimRewards() external {
        require(userLPBalance[msg.sender] > 0, "No LP balance");

        // Calculate user's share: (userBalance / totalStaked) * totalYield - alreadyClaimed
        uint256 userShare = (userLPBalance[msg.sender] * 1e18) / totalLPStaked;
        uint256 claimable = (totalLPYield * userShare / 1e18) - lpClaimed[msg.sender];

        require(claimable > 0, "No rewards to claim");
        require(address(this).balance >= claimable, "Insufficient contract balance");

        lpClaimed[msg.sender] += claimable;

        // Transfer rewards
        (bool success, ) = msg.sender.call{value: claimable}("");
        require(success, "Claim transfer failed");

        emit LPRewardsClaimed(msg.sender, claimable);
    }

    /**
     * @dev Get user's LP balance
     */
    function getUserLPBalance(address user) external view returns (uint256) {
        return userLPBalance[user];
    }

    /**
     * @dev Get user's claimable rewards
     */
    function getClaimableRewards(address user) external view returns (uint256) {
        if (userLPBalance[user] == 0 || totalLPStaked == 0) return 0;

        uint256 userShare = (userLPBalance[user] * 1e18) / totalLPStaked;
        uint256 totalClaimable = (totalLPYield * userShare / 1e18);

        if (totalClaimable <= lpClaimed[user]) return 0;
        return totalClaimable - lpClaimed[user];
    }

    /**
     * @dev Get vault TVL (Total Value Locked)
     */
    function getTVL() external view returns (uint256) {
        return totalLPStaked;
    }

    /**
     * @dev Get vault balances breakdown
     */
    function getVaultBalances() external view returns (
        uint256 totalStaked,
        uint256 boostVault,
        uint256 creatorVault,
        uint256 totalYield
    ) {
        return (
            totalLPStaked,
            boostVaultBalance,
            creatorEngagementVaultBalance,
            totalLPYield
        );
    }

    /**
     * @dev Get yield breakdown by source
     */
    function getYieldBreakdown() external view returns (
        uint256 boostYield,
        uint256 creatorYield,
        uint256 engagementYield,
        uint256 total
    ) {
        return (
            lpBoostYield,
            lpCreatorYield,
            lpEngagementYield,
            totalLPYield
        );
    }

    /**
     * @dev Get deployment info
     */
    function getDeployment(uint256 predictionId)
        external
        view
        returns (
            uint256 totalAmount,
            VaultType vaultType,
            bool returned,
            uint256 deployedAt,
            uint256 returnedAt
        )
    {
        LPDeployment storage deployment = deployments[predictionId];
        return (
            deployment.totalAmount,
            deployment.vaultType,
            deployment.returned,
            deployment.deployedAt,
            deployment.returnedAt
        );
    }

    /**
     * @dev Get all active prediction IDs with LP
     */
    function getActivePredictions() external view returns (uint256[] memory) {
        return activePredictionIds;
    }

    /**
     * @dev Set prediction factory address (owner only)
     */
    function setPredictionFactory(address _predictionFactory) external onlyOwner {
        predictionFactory = _predictionFactory;
    }

    /**
     * @dev Set fee distributor address (owner only)
     */
    function setFeeDistributor(address _feeDistributor) external onlyOwner {
        feeDistributor = _feeDistributor;
    }

    /**
     * @dev Set admin address (owner only)
     */
    function setAdmin(address _admin) external onlyOwner {
        address oldAdmin = admin;
        admin = _admin;
        emit AdminChanged(oldAdmin, _admin);
    }

    /**
     * @dev Set engagement yield percentage (owner only)
     * @param percentage New percentage (0-100)
     */
    function setEngagementYieldPercentage(uint256 percentage) external onlyOwner {
        require(percentage <= 100, "Invalid percentage");
        engagementYieldPercentage = percentage;
    }

    /**
     * @dev Remove prediction from active list
     */
    function _removeFromActivePredictions(uint256 predictionId) internal {
        for (uint i = 0; i < activePredictionIds.length; i++) {
            if (activePredictionIds[i] == predictionId) {
                activePredictionIds[i] = activePredictionIds[activePredictionIds.length - 1];
                activePredictionIds.pop();
                break;
            }
        }
    }

    /**
     * @dev Emergency withdraw (owner only, for emergencies)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Emergency withdraw failed");
    }

    /**
     * @dev Receive function to accept BNB
     */
    receive() external payable {}
}

