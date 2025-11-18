// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LossEdgeVault
 * @dev Vault for Loss-Edge Pool - receives 2% of fees and distributes to losers
 *
 * LOSS-EDGE POOL DISTRIBUTION:
 * - Receives 2% of all entry fees
 * - When prediction resolves, losers can claim proportional share
 * - Distribution = (loser's stake / total losing volume) * pool for that prediction
 */
contract LossEdgeVault {

    address public owner;
    address public predictionFactory;

    // Tracking per prediction
    struct PredictionPool {
        uint256 totalFees;           // Total fees allocated for this prediction
        uint256 totalLosingVolume;   // Total volume on losing side
        bool initialized;            // Whether pool is initialized
    }

    mapping(uint256 => PredictionPool) public predictionPools;
    mapping(uint256 => mapping(address => bool)) public hasClaimed; // predictionId => user => claimed

    // Events
    event FeesReceived(uint256 indexed predictionId, uint256 amount);
    event LossEdgeClaimed(
        uint256 indexed predictionId,
        address indexed user,
        uint256 userLoss,
        uint256 compensation
    );
    event PoolInitialized(uint256 indexed predictionId, uint256 totalFees, uint256 totalLosingVolume);
    event Withdrawal(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyPredictionFactory() {
        require(msg.sender == predictionFactory, "Only prediction factory");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Set prediction factory address
     */
    function setPredictionFactory(address _predictionFactory) external onlyOwner {
        predictionFactory = _predictionFactory;
    }

    /**
     * @dev Initialize pool for a resolved prediction
     * Called by PredictionFactory when prediction is resolved
     */
    function initializePool(
        uint256 predictionId,
        uint256 totalFees,
        uint256 totalLosingVolume
    ) external onlyPredictionFactory {
        require(!predictionPools[predictionId].initialized, "Pool already initialized");
        require(totalLosingVolume > 0, "No losing volume");

        predictionPools[predictionId] = PredictionPool({
            totalFees: totalFees,
            totalLosingVolume: totalLosingVolume,
            initialized: true
        });

        emit PoolInitialized(predictionId, totalFees, totalLosingVolume);
    }

    /**
     * @dev Claim Loss-Edge compensation for a losing position
     * Called by users who lost a prediction
     */
    function claimLossEdge(
        uint256 predictionId,
        address user,
        uint256 userLoss
    ) external onlyPredictionFactory returns (uint256) {
        require(predictionPools[predictionId].initialized, "Pool not initialized");
        require(!hasClaimed[predictionId][user], "Already claimed");
        require(userLoss > 0, "No loss to compensate");

        PredictionPool storage pool = predictionPools[predictionId];

        // Calculate proportional compensation
        // compensation = (user's loss / total losing volume) * pool fees
        uint256 compensation = (userLoss * pool.totalFees) / pool.totalLosingVolume;

        require(compensation > 0, "No compensation available");
        require(address(this).balance >= compensation, "Insufficient vault balance");

        // Mark as claimed
        hasClaimed[predictionId][user] = true;

        // Transfer compensation
        (bool success, ) = user.call{value: compensation}("");
        require(success, "Compensation transfer failed");

        emit LossEdgeClaimed(predictionId, user, userLoss, compensation);

        return compensation;
    }

    /**
     * @dev Get pool info for a prediction
     */
    function getPoolInfo(uint256 predictionId)
        external
        view
        returns (
            uint256 totalFees,
            uint256 totalLosingVolume,
            bool initialized
        )
    {
        PredictionPool storage pool = predictionPools[predictionId];
        return (pool.totalFees, pool.totalLosingVolume, pool.initialized);
    }

    /**
     * @dev Check if user has claimed for a prediction
     */
    function hasUserClaimed(uint256 predictionId, address user) external view returns (bool) {
        return hasClaimed[predictionId][user];
    }

    /**
     * @dev Calculate potential compensation for a user
     */
    function calculateCompensation(
        uint256 predictionId,
        uint256 userLoss
    ) external view returns (uint256) {
        if (!predictionPools[predictionId].initialized || userLoss == 0) {
            return 0;
        }

        PredictionPool storage pool = predictionPools[predictionId];
        return (userLoss * pool.totalFees) / pool.totalLosingVolume;
    }

    /**
     * @dev Get current balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Withdraw funds (owner only - for emergency)
     */
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(to, amount);
    }

    /**
     * @dev Receive function to accept BNB
     */
    receive() external payable {
        emit FeesReceived(0, msg.value);
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        emit FeesReceived(0, msg.value);
    }
}

