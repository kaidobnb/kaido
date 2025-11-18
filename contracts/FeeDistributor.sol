// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FeeDistributor
 * @dev Handles fee distribution for KAIDO platform
 *
 * NEW DISTRIBUTION MODEL:
 * - On participation: Immediately distribute Loss-Edge Pool (2%) and Treasury (2%)
 * - On resolution: Distribute Creator fee (1%) to prediction creator
 * - Affiliate fee (1%) goes to Treasury for now (TODO: implement referral system)
 */
contract FeeDistributor {

    address public owner;
    address public predictionFactory;

    // Fee wallets
    address public lossEdgePool;
    address public treasury;

    // Fee percentages (out of total fees received)
    uint256 public constant LOSS_EDGE_PERCENTAGE = 40; // 40% of fees = 2% of pool
    uint256 public constant CREATOR_PERCENTAGE = 20;   // 20% of fees = 1% of pool
    uint256 public constant AFFILIATE_PERCENTAGE = 20; // 20% of fees = 1% of pool
    uint256 public constant TREASURY_PERCENTAGE = 20;  // 20% of fees = 1% of pool

    // Tracking
    mapping(uint256 => uint256) public creatorFeesHeld; // predictionId => creator fees held
    mapping(uint256 => uint256) public lossEdgeFeesCollected; // predictionId => loss-edge fees collected
    mapping(uint256 => address) public predictionCreators; // predictionId => creator
    mapping(uint256 => bool) public creatorFeesPaid; // predictionId => creator fees paid

    // Events
    event ImmediateFeesDistributed(
        uint256 indexed predictionId,
        uint256 lossEdgeFee,
        uint256 treasuryFee
    );
    event CreatorFeePaid(
        uint256 indexed predictionId,
        address indexed creator,
        uint256 amount
    );
    event CreatorRegistered(uint256 indexed predictionId, address creator);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyPredictionFactory() {
        require(msg.sender == predictionFactory, "Only prediction factory");
        _;
    }
    
    constructor(address _lossEdgePool, address _treasury) {
        owner = msg.sender;
        lossEdgePool = _lossEdgePool;
        treasury = _treasury;
    }
    
    /**
     * @dev Register prediction creator (called by PredictionFactory)
     */
    function registerCreator(uint256 predictionId, address creator) external onlyPredictionFactory {
        predictionCreators[predictionId] = creator;
        emit CreatorRegistered(predictionId, creator);
    }

    /**
     * @dev Process fees immediately on participation
     * Distributes Loss-Edge Pool (2%) and Treasury (2%) immediately
     * Holds Creator fee (1%) until resolution
     */
    function processFees(uint256 predictionId, uint256 amount) external payable onlyPredictionFactory {
        require(msg.value == amount, "Incorrect fee amount sent");

        // Calculate fee splits
        uint256 lossEdgeFee = (amount * LOSS_EDGE_PERCENTAGE) / 100;      // 40% of fees = 2% of pool
        uint256 creatorFee = (amount * CREATOR_PERCENTAGE) / 100;         // 20% of fees = 1% of pool
        uint256 affiliateFee = (amount * AFFILIATE_PERCENTAGE) / 100;     // 20% of fees = 1% of pool
        uint256 treasuryFee = (amount * TREASURY_PERCENTAGE) / 100;       // 20% of fees = 1% of pool

        // IMMEDIATE DISTRIBUTION: Loss-Edge Pool and Treasury
        (bool success1, ) = lossEdgePool.call{value: lossEdgeFee}("");
        require(success1, "Loss-Edge transfer failed");

        // Track loss-edge fees for this prediction (for loser compensation)
        lossEdgeFeesCollected[predictionId] += lossEdgeFee;

        // Treasury gets its share + affiliate fee (TODO: implement referral system)
        treasuryFee += affiliateFee;
        (bool success2, ) = treasury.call{value: treasuryFee}("");
        require(success2, "Treasury transfer failed");

        // HOLD creator fee until resolution
        creatorFeesHeld[predictionId] += creatorFee;

        emit ImmediateFeesDistributed(predictionId, lossEdgeFee, treasuryFee);
    }

    /**
     * @dev Pay creator fee when prediction is resolved
     * Called by PredictionFactory when prediction is resolved
     */
    function payCreatorFee(uint256 predictionId) external onlyPredictionFactory {
        require(!creatorFeesPaid[predictionId], "Creator fee already paid");
        require(creatorFeesHeld[predictionId] > 0, "No creator fees to pay");

        uint256 creatorFee = creatorFeesHeld[predictionId];
        address creator = predictionCreators[predictionId];

        require(creator != address(0), "No creator registered");

        // Mark as paid
        creatorFeesPaid[predictionId] = true;

        // Transfer creator fee
        (bool success, ) = creator.call{value: creatorFee}("");
        require(success, "Creator fee transfer failed");

        emit CreatorFeePaid(predictionId, creator, creatorFee);
    }
    
    /**
     * @dev Set prediction factory address
     */
    function setPredictionFactory(address _predictionFactory) external onlyOwner {
        predictionFactory = _predictionFactory;
    }
    
    /**
     * @dev Update Loss-Edge Pool address
     */
    function setLossEdgePool(address _lossEdgePool) external onlyOwner {
        lossEdgePool = _lossEdgePool;
    }
    
    /**
     * @dev Update Treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
    
    /**
     * @dev Get creator fee info for a prediction
     */
    function getCreatorFeeInfo(uint256 predictionId)
        external
        view
        returns (
            address creator,
            uint256 feeHeld,
            bool paid
        )
    {
        creator = predictionCreators[predictionId];
        feeHeld = creatorFeesHeld[predictionId];
        paid = creatorFeesPaid[predictionId];
    }

    /**
     * @dev Get loss-edge fees collected for a prediction
     */
    function getLossEdgeFeesForPrediction(uint256 predictionId) external view returns (uint256) {
        return lossEdgeFeesCollected[predictionId];
    }

    /**
     * @dev Get loss-edge pool address
     */
    function getLossEdgePoolAddress() external view returns (address) {
        return lossEdgePool;
    }

    /**
     * @dev Receive function to accept fees
     */
    receive() external payable {
        // Accept BNB - fees are processed via processFees()
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        // Accept BNB
    }
}

