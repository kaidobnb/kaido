// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FeeDistributor
 * @dev Handles fee distribution for KAIDO platform
 *
 * THREE FEE SCENARIOS:
 *
 * 1. STANDARD (No LP Boost):
 *    - Loss-Edge: 2%, Treasury: 1%, Creator: 1%, Affiliate: 1%
 *    - No LP yield
 *
 * 2. BOOST VAULT LP (KAIDO/User predictions boosted):
 *    - Loss-Edge: 2%, Treasury: 0.7%, Creator: 1%, Affiliate: 1%
 *    - LP Boost Yield: 0.3% (30% of treasury's 1%)
 *
 * 3. CREATOR/ENGAGEMENT VAULT LP (Creator partnerships):
 *    - Loss-Edge: 2%, Treasury: 1%, Creator: 0.7%, Affiliate: 0.7%
 *    - LP Creator Yield: 0.6% (30% of creator's 1% + 30% of affiliate's 1%)
 */
contract FeeDistributor {

    // Boost Type enum
    enum BoostType { NONE, BOOST_VAULT, CREATOR_VAULT }

    address public owner;
    address public predictionFactory;

    // Fee wallets
    address public lossEdgePool;
    address public treasury;
    address public lpVault; // LP Vault for yield distribution

    // Fee percentages (out of total fees received)
    uint256 public constant LOSS_EDGE_PERCENTAGE = 40; // 40% of fees = 2% of pool
    uint256 public constant CREATOR_PERCENTAGE = 20;   // 20% of fees = 1% of pool
    uint256 public constant AFFILIATE_PERCENTAGE = 20; // 20% of fees = 1% of pool
    uint256 public constant TREASURY_PERCENTAGE = 20;  // 20% of fees = 1% of pool
    uint256 public constant LP_YIELD_PERCENTAGE = 30;  // 30% of applicable fees go to LP

    // Tracking
    mapping(uint256 => uint256) public creatorFeesHeld; // predictionId => creator fees held
    mapping(uint256 => uint256) public affiliateFeesHeld; // predictionId => affiliate fees held
    mapping(uint256 => uint256) public lossEdgeFeesCollected; // predictionId => loss-edge fees collected
    mapping(uint256 => address) public predictionCreators; // predictionId => creator
    mapping(uint256 => BoostType) public predictionBoostType; // predictionId => boost type
    mapping(uint256 => bool) public creatorFeesPaid; // predictionId => creator fees paid

    // Events
    event FeesProcessed(
        uint256 indexed predictionId,
        BoostType boostType,
        uint256 lossEdgeFee,
        uint256 treasuryFee,
        uint256 creatorFee,
        uint256 affiliateFee,
        uint256 lpYield
    );
    event CreatorFeePaid(
        uint256 indexed predictionId,
        address indexed creator,
        uint256 amount
    );
    event AffiliateFeePaid(
        uint256 indexed predictionId,
        address indexed affiliate,
        uint256 amount
    );
    event CreatorRegistered(uint256 indexed predictionId, address creator);
    event BoostTypeSet(uint256 indexed predictionId, BoostType boostType);
    event LPVaultUpdated(address indexed oldVault, address indexed newVault);
    
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
     * @dev Set boost type for a prediction (called by PredictionFactory or LPVault)
     * Must be called BEFORE processing any fees for the prediction
     */
    function setBoostType(uint256 predictionId, BoostType boostType) external {
        require(msg.sender == predictionFactory || msg.sender == lpVault, "Only factory or LP vault");
        predictionBoostType[predictionId] = boostType;
        emit BoostTypeSet(predictionId, boostType);
    }

    /**
     * @dev Process fees based on boost type
     *
     * SCENARIO 1 (NONE): Loss-Edge 2%, Treasury 1%, Creator 1%, Affiliate 1%
     * SCENARIO 2 (BOOST_VAULT): Loss-Edge 2%, Treasury 0.7%, Creator 1%, Affiliate 1%, LP Boost Yield 0.3%
     * SCENARIO 3 (CREATOR_VAULT): Loss-Edge 2%, Treasury 1%, Creator 0.7%, Affiliate 0.7%, LP Creator Yield 0.6%
     */
    function processFees(uint256 predictionId, uint256 amount) external payable onlyPredictionFactory {
        require(msg.value == amount, "Incorrect fee amount sent");

        BoostType boostType = predictionBoostType[predictionId];

        // Base fees (same for all scenarios)
        uint256 lossEdgeFee = (amount * LOSS_EDGE_PERCENTAGE) / 100;   // 2% of pool
        uint256 creatorFee = (amount * CREATOR_PERCENTAGE) / 100;      // 1% of pool (base)
        uint256 affiliateFee = (amount * AFFILIATE_PERCENTAGE) / 100;  // 1% of pool (base)
        uint256 treasuryFee = (amount * TREASURY_PERCENTAGE) / 100;    // 1% of pool (base)
        uint256 lpYield = 0;

        // Adjust fees based on boost type
        if (boostType == BoostType.BOOST_VAULT) {
            // SCENARIO 2: 30% of treasury goes to LP Boost Yield
            lpYield = (treasuryFee * LP_YIELD_PERCENTAGE) / 100;  // 0.3% of pool
            treasuryFee -= lpYield;  // Treasury gets 0.7%

        } else if (boostType == BoostType.CREATOR_VAULT) {
            // SCENARIO 3: 30% of creator + 30% of affiliate goes to LP Creator Yield
            uint256 creatorToLP = (creatorFee * LP_YIELD_PERCENTAGE) / 100;  // 0.3% of pool
            uint256 affiliateToLP = (affiliateFee * LP_YIELD_PERCENTAGE) / 100;  // 0.3% of pool
            lpYield = creatorToLP + affiliateToLP;  // 0.6% total
            creatorFee -= creatorToLP;  // Creator gets 0.7%
            affiliateFee -= affiliateToLP;  // Affiliate gets 0.7%
        }
        // SCENARIO 1 (NONE): No adjustments, standard fees

        // IMMEDIATE DISTRIBUTION: Loss-Edge Pool (always 2%)
        (bool success1, ) = lossEdgePool.call{value: lossEdgeFee}("");
        require(success1, "Loss-Edge transfer failed");
        lossEdgeFeesCollected[predictionId] += lossEdgeFee;

        // IMMEDIATE DISTRIBUTION: Treasury
        (bool success2, ) = treasury.call{value: treasuryFee}("");
        require(success2, "Treasury transfer failed");

        // IMMEDIATE DISTRIBUTION: LP Yield (if applicable)
        if (lpYield > 0 && lpVault != address(0)) {
            if (boostType == BoostType.BOOST_VAULT) {
                // Call recordBoostYield
                (bool success3, ) = lpVault.call{value: lpYield}(
                    abi.encodeWithSignature("recordBoostYield(uint256)", lpYield)
                );
                require(success3, "LP Boost Yield transfer failed");

            } else if (boostType == BoostType.CREATOR_VAULT) {
                // Call recordCreatorYield
                uint256 creatorToLP = (creatorFee * LP_YIELD_PERCENTAGE) / (100 - LP_YIELD_PERCENTAGE);
                uint256 affiliateToLP = (affiliateFee * LP_YIELD_PERCENTAGE) / (100 - LP_YIELD_PERCENTAGE);
                (bool success3, ) = lpVault.call{value: lpYield}(
                    abi.encodeWithSignature("recordCreatorYield(uint256,uint256)", affiliateToLP, creatorToLP)
                );
                require(success3, "LP Creator Yield transfer failed");
            }
        }

        // HOLD creator and affiliate fees until resolution
        creatorFeesHeld[predictionId] += creatorFee;
        affiliateFeesHeld[predictionId] += affiliateFee;

        emit FeesProcessed(predictionId, boostType, lossEdgeFee, treasuryFee, creatorFee, affiliateFee, lpYield);
    }

    /**
     * @dev Pay creator and affiliate fees when prediction is resolved
     * Called by PredictionFactory when prediction is resolved
     */
    function payCreatorFee(uint256 predictionId) external onlyPredictionFactory {
        require(!creatorFeesPaid[predictionId], "Fees already paid");

        uint256 creatorFee = creatorFeesHeld[predictionId];
        uint256 affiliateFee = affiliateFeesHeld[predictionId];
        address creator = predictionCreators[predictionId];

        require(creator != address(0), "No creator registered");

        // Mark as paid
        creatorFeesPaid[predictionId] = true;

        // Transfer creator fee
        if (creatorFee > 0) {
            (bool success1, ) = creator.call{value: creatorFee}("");
            require(success1, "Creator fee transfer failed");
            emit CreatorFeePaid(predictionId, creator, creatorFee);
        }

        // Transfer affiliate fee
        // TODO: Implement referral system - for now send to treasury
        if (affiliateFee > 0) {
            (bool success2, ) = treasury.call{value: affiliateFee}("");
            require(success2, "Affiliate fee transfer failed");
            emit AffiliateFeePaid(predictionId, treasury, affiliateFee);
        }
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
     * @dev Update LP Vault address
     */
    function setLPVault(address _lpVault) external onlyOwner {
        address oldVault = lpVault;
        lpVault = _lpVault;
        emit LPVaultUpdated(oldVault, _lpVault);
    }
    
    /**
     * @dev Get fee info for a prediction
     */
    function getFeeInfo(uint256 predictionId)
        external
        view
        returns (
            address creator,
            uint256 creatorFeeHeld,
            uint256 affiliateFeeHeld,
            BoostType boostType,
            bool paid
        )
    {
        creator = predictionCreators[predictionId];
        creatorFeeHeld = creatorFeesHeld[predictionId];
        affiliateFeeHeld = affiliateFeesHeld[predictionId];
        boostType = predictionBoostType[predictionId];
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

