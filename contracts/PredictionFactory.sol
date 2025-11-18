// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IFeeDistributor {
    function registerCreator(uint256 predictionId, address creator) external;
    function processFees(uint256 predictionId, uint256 amount) external payable;
    function payCreatorFee(uint256 predictionId) external;
    function getLossEdgePoolAddress() external view returns (address);
    function getLossEdgeFeesForPrediction(uint256 predictionId) external view returns (uint256);
}

interface ILossEdgeVault {
    function initializePool(uint256 predictionId, uint256 totalFees, uint256 totalLosingVolume) external;
    function claimLossEdge(uint256 predictionId, address user, uint256 userLoss) external returns (uint256);
    function hasUserClaimed(uint256 predictionId, address user) external view returns (bool);
    function calculateCompensation(uint256 predictionId, uint256 userLoss) external view returns (uint256);
}

/**
 * @title PredictionFactory
 * @dev Core contract for creating and managing predictions on KAIDO platform
 * Implements lock mechanism, exit functionality, and oracle-based resolution
 */
contract PredictionFactory {
    
    // Enums
    enum PredictionType { BINARY, MULTIPLE }
    enum PredictionCategory { CRYPTO, SPORTS }
    enum PredictionStatus { ACTIVE, LOCKED, RESOLVED, CANCELLED }
    
    // Structs
    struct Prediction {
        uint256 id;
        address creator;
        string title;
        string description;
        PredictionType predType;
        PredictionCategory category;
        string asset;
        uint256 targetPrice; // For binary predictions (in USD with 8 decimals)
        uint256 endDate;
        uint256 lockTime;
        uint256 totalPool;
        PredictionStatus status;
        string resolvedChoice;
        uint256 resolvedAt;
        uint256 createdAt;
        string[] choices;
        mapping(string => uint256) choiceVolumes;
        mapping(address => Participation) participations;
        address[] participants;
    }
    
    struct Participation {
        address user;
        string choice;
        uint256 amount;
        uint256 timestamp;
        bool exited;
        bool claimed;
    }
    
    // State variables
    address public owner;
    address public oracleAddress;
    address public feeDistributor;
    
    uint256 public predictionCount;
    uint256 public constant ENTRY_FEE_PERCENTAGE = 5; // 5% entry fee
    uint256 public constant LOCK_TIME_CRYPTO = 12 hours; // 12 hours before end for crypto
    
    mapping(uint256 => Prediction) public predictions;
    uint256[] public activePredictionIds;
    
    // Events
    event PredictionCreated(
        uint256 indexed predictionId,
        address indexed creator,
        string title,
        PredictionType predType,
        PredictionCategory category,
        uint256 endDate,
        uint256 lockTime
    );
    
    event ParticipationAdded(
        uint256 indexed predictionId,
        address indexed user,
        string choice,
        uint256 amount,
        uint256 entryFee
    );
    
    event ParticipationExited(
        uint256 indexed predictionId,
        address indexed user,
        uint256 refundAmount
    );
    
    event PredictionLocked(
        uint256 indexed predictionId,
        uint256 lockedAt
    );
    
    event PredictionResolved(
        uint256 indexed predictionId,
        string winningChoice,
        uint256 finalPrice,
        uint256 resolvedAt
    );
    
    event WinningsClaimed(
        uint256 indexed predictionId,
        address indexed user,
        uint256 amount
    );

    event LossEdgeClaimed(
        uint256 indexed predictionId,
        address indexed user,
        uint256 lossAmount,
        uint256 compensation
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only oracle");
        _;
    }
    
    modifier predictionExists(uint256 predictionId) {
        require(predictionId < predictionCount, "Prediction does not exist");
        _;
    }
    
    modifier beforeLock(uint256 predictionId) {
        require(block.timestamp < predictions[predictionId].lockTime, "Prediction is locked");
        require(predictions[predictionId].status == PredictionStatus.ACTIVE, "Prediction not active");
        _;
    }
    
    constructor(address _oracleAddress, address _feeDistributor) {
        owner = msg.sender;
        oracleAddress = _oracleAddress;
        feeDistributor = _feeDistributor;
    }
    
    /**
     * @dev Create a new prediction
     */
    function createPrediction(
        string memory _title,
        string memory _description,
        PredictionType _predType,
        PredictionCategory _category,
        string memory _asset,
        uint256 _targetPrice,
        uint256 _endDate,
        string[] memory _choices
    ) external payable returns (uint256) {
        require(_endDate > block.timestamp, "End date must be in future");
        require(_choices.length >= 2, "At least 2 choices required");
        require(msg.value > 0, "Must stake some BNB");
        
        uint256 predictionId = predictionCount++;
        Prediction storage pred = predictions[predictionId];
        
        pred.id = predictionId;
        pred.creator = msg.sender;
        pred.title = _title;
        pred.description = _description;
        pred.predType = _predType;
        pred.category = _category;
        pred.asset = _asset;
        pred.targetPrice = _targetPrice;
        pred.endDate = _endDate;
        pred.createdAt = block.timestamp;
        pred.status = PredictionStatus.ACTIVE;
        pred.choices = _choices;
        
        // Calculate lock time based on category
        if (_category == PredictionCategory.CRYPTO) {
            // Lock 12 hours before end date, or immediately if less than 12 hours
            if (_endDate - block.timestamp > LOCK_TIME_CRYPTO) {
                pred.lockTime = _endDate - LOCK_TIME_CRYPTO;
            } else {
                pred.lockTime = block.timestamp; // Lock immediately
            }
        } else {
            // For sports, lock at end date (will be updated by oracle at kickoff)
            pred.lockTime = _endDate;
        }
        
        // Deduct entry fee (5%)
        uint256 entryFee = (msg.value * ENTRY_FEE_PERCENTAGE) / 100;
        uint256 stakeAmount = msg.value - entryFee;
        
        // Add creator as first participant
        pred.participations[msg.sender] = Participation({
            user: msg.sender,
            choice: _choices[0], // Creator picks first choice by default
            amount: stakeAmount,
            timestamp: block.timestamp,
            exited: false,
            claimed: false
        });
        
        pred.participants.push(msg.sender);
        pred.choiceVolumes[_choices[0]] = stakeAmount;
        pred.totalPool = stakeAmount;

        activePredictionIds.push(predictionId);

        // Register creator with fee distributor
        IFeeDistributor(feeDistributor).registerCreator(predictionId, msg.sender);

        // Process fees immediately (distributes Loss-Edge + Treasury, holds Creator fee)
        IFeeDistributor(feeDistributor).processFees{value: entryFee}(predictionId, entryFee);

        emit PredictionCreated(
            predictionId,
            msg.sender,
            _title,
            _predType,
            _category,
            _endDate,
            pred.lockTime
        );
        
        emit ParticipationAdded(predictionId, msg.sender, _choices[0], stakeAmount, entryFee);
        
        return predictionId;
    }
    
    /**
     * @dev Participate in a prediction
     */
    function participate(
        uint256 predictionId,
        string memory choice
    ) external payable predictionExists(predictionId) beforeLock(predictionId) {
        require(msg.value > 0, "Must stake some BNB");
        
        Prediction storage pred = predictions[predictionId];
        require(!pred.participations[msg.sender].exited, "Already participated");
        require(pred.participations[msg.sender].amount == 0, "Already participated");
        
        // Verify choice exists
        bool validChoice = false;
        for (uint i = 0; i < pred.choices.length; i++) {
            if (keccak256(bytes(pred.choices[i])) == keccak256(bytes(choice))) {
                validChoice = true;
                break;
            }
        }
        require(validChoice, "Invalid choice");
        
        // Deduct entry fee (5%)
        uint256 entryFee = (msg.value * ENTRY_FEE_PERCENTAGE) / 100;
        uint256 stakeAmount = msg.value - entryFee;
        
        // Add participation
        pred.participations[msg.sender] = Participation({
            user: msg.sender,
            choice: choice,
            amount: stakeAmount,
            timestamp: block.timestamp,
            exited: false,
            claimed: false
        });
        
        pred.participants.push(msg.sender);
        pred.choiceVolumes[choice] += stakeAmount;
        pred.totalPool += stakeAmount;

        // Process fees immediately (distributes Loss-Edge + Treasury, holds Creator fee)
        IFeeDistributor(feeDistributor).processFees{value: entryFee}(predictionId, entryFee);

        emit ParticipationAdded(predictionId, msg.sender, choice, stakeAmount, entryFee);
    }
    
    /**
     * @dev Exit a prediction before lock (fee is non-refundable)
     */
    function exitPrediction(
        uint256 predictionId
    ) external predictionExists(predictionId) beforeLock(predictionId) {
        Prediction storage pred = predictions[predictionId];
        Participation storage participation = pred.participations[msg.sender];
        
        require(participation.amount > 0, "No participation found");
        require(!participation.exited, "Already exited");
        require(!participation.claimed, "Already claimed");
        
        uint256 refundAmount = participation.amount;
        
        // Mark as exited
        participation.exited = true;
        participation.amount = 0;
        
        // Update pool
        pred.choiceVolumes[participation.choice] -= refundAmount;
        pred.totalPool -= refundAmount;
        
        // Refund stake (entry fee was already sent to fee distributor, non-refundable)
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");
        
        emit ParticipationExited(predictionId, msg.sender, refundAmount);
    }

    /**
     * @dev Lock a prediction (called by oracle at kickoff for sports)
     */
    function lockPrediction(
        uint256 predictionId
    ) external onlyOracle predictionExists(predictionId) {
        Prediction storage pred = predictions[predictionId];
        require(pred.status == PredictionStatus.ACTIVE, "Prediction not active");

        pred.status = PredictionStatus.LOCKED;

        emit PredictionLocked(predictionId, block.timestamp);
    }

    /**
     * @dev Resolve a prediction (called by oracle)
     */
    function resolvePrediction(
        uint256 predictionId,
        string memory winningChoice,
        uint256 finalPrice
    ) external onlyOracle predictionExists(predictionId) {
        Prediction storage pred = predictions[predictionId];
        require(
            pred.status == PredictionStatus.ACTIVE || pred.status == PredictionStatus.LOCKED,
            "Prediction not active or locked"
        );
        require(block.timestamp >= pred.endDate, "Prediction not expired");

        // Verify winning choice exists
        bool validChoice = false;
        for (uint i = 0; i < pred.choices.length; i++) {
            if (keccak256(bytes(pred.choices[i])) == keccak256(bytes(winningChoice))) {
                validChoice = true;
                break;
            }
        }
        require(validChoice, "Invalid winning choice");

        pred.status = PredictionStatus.RESOLVED;
        pred.resolvedChoice = winningChoice;
        pred.resolvedAt = block.timestamp;

        // Pay creator fee (1% of pool) - held in FeeDistributor since creation
        IFeeDistributor(feeDistributor).payCreatorFee(predictionId);

        // Initialize Loss-Edge Pool for loser compensation
        _initializeLossEdgePool(predictionId, winningChoice);

        // Winners get 100% of the pool (95% after entry fees)
        // Loss-Edge Pool and Treasury already received their shares during participation

        // Remove from active predictions
        _removeFromActivePredictions(predictionId);

        emit PredictionResolved(predictionId, winningChoice, finalPrice, block.timestamp);
    }

    /**
     * @dev Claim winnings for a resolved prediction
     */
    function claimWinnings(
        uint256 predictionId
    ) external predictionExists(predictionId) {
        Prediction storage pred = predictions[predictionId];
        require(pred.status == PredictionStatus.RESOLVED, "Prediction not resolved");

        Participation storage participation = pred.participations[msg.sender];
        require(participation.amount > 0, "No participation found");
        require(!participation.exited, "Already exited");
        require(!participation.claimed, "Already claimed");

        // Check if user won
        require(
            keccak256(bytes(participation.choice)) == keccak256(bytes(pred.resolvedChoice)),
            "Not a winner"
        );

        // Calculate reward - winners get proportional share of total pool
        uint256 winningVolume = pred.choiceVolumes[pred.resolvedChoice];

        require(winningVolume > 0, "No winning volume");

        uint256 reward = (participation.amount * pred.totalPool) / winningVolume;

        // Mark as claimed
        participation.claimed = true;

        // Transfer reward
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Reward transfer failed");

        emit WinningsClaimed(predictionId, msg.sender, reward);
    }

    /**
     * @dev Claim Loss-Edge compensation for losing position
     * Losers get proportional share of the 2% Loss-Edge Pool
     */
    function claimLossEdge(uint256 predictionId) external predictionExists(predictionId) {
        Prediction storage pred = predictions[predictionId];
        require(pred.status == PredictionStatus.RESOLVED, "Prediction not resolved");

        Participation storage participation = pred.participations[msg.sender];
        require(participation.amount > 0, "No participation found");
        require(!participation.exited, "Already exited");
        require(!participation.claimed, "Already claimed");

        // Check if user lost
        require(
            keccak256(bytes(participation.choice)) != keccak256(bytes(pred.resolvedChoice)),
            "Winners cannot claim loss-edge"
        );

        // Mark as claimed (prevents double claiming)
        participation.claimed = true;

        // Get Loss-Edge Vault address from FeeDistributor
        address lossEdgeVault = IFeeDistributor(feeDistributor).getLossEdgePoolAddress();

        // Claim from Loss-Edge Vault
        uint256 compensation = ILossEdgeVault(lossEdgeVault).claimLossEdge(
            predictionId,
            msg.sender,
            participation.amount
        );

        emit LossEdgeClaimed(predictionId, msg.sender, participation.amount, compensation);
    }

    /**
     * @dev Get prediction details
     */
    function getPrediction(uint256 predictionId)
        external
        view
        predictionExists(predictionId)
        returns (
            address creator,
            string memory title,
            string memory description,
            PredictionType predType,
            PredictionCategory category,
            string memory asset,
            uint256 targetPrice,
            uint256 endDate,
            uint256 lockTime,
            uint256 totalPool,
            PredictionStatus status,
            string memory resolvedChoice,
            uint256 resolvedAt,
            uint256 createdAt,
            string[] memory choices
        )
    {
        Prediction storage pred = predictions[predictionId];
        return (
            pred.creator,
            pred.title,
            pred.description,
            pred.predType,
            pred.category,
            pred.asset,
            pred.targetPrice,
            pred.endDate,
            pred.lockTime,
            pred.totalPool,
            pred.status,
            pred.resolvedChoice,
            pred.resolvedAt,
            pred.createdAt,
            pred.choices
        );
    }

    /**
     * @dev Get participation details
     */
    function getParticipation(uint256 predictionId, address user)
        external
        view
        predictionExists(predictionId)
        returns (
            string memory choice,
            uint256 amount,
            uint256 timestamp,
            bool exited,
            bool claimed
        )
    {
        Participation storage participation = predictions[predictionId].participations[user];
        return (
            participation.choice,
            participation.amount,
            participation.timestamp,
            participation.exited,
            participation.claimed
        );
    }

    /**
     * @dev Get all active prediction IDs
     */
    function getActivePredictions() external view returns (uint256[] memory) {
        return activePredictionIds;
    }

    /**
     * @dev Get expired predictions (for oracle)
     */
    function getExpiredPredictions() external view returns (uint256[] memory) {
        uint256 count = 0;

        // Count expired predictions
        for (uint i = 0; i < activePredictionIds.length; i++) {
            uint256 predId = activePredictionIds[i];
            if (block.timestamp >= predictions[predId].endDate) {
                count++;
            }
        }

        // Create array of expired prediction IDs
        uint256[] memory expired = new uint256[](count);
        uint256 index = 0;

        for (uint i = 0; i < activePredictionIds.length; i++) {
            uint256 predId = activePredictionIds[i];
            if (block.timestamp >= predictions[predId].endDate) {
                expired[index] = predId;
                index++;
            }
        }

        return expired;
    }

    /**
     * @dev Get choice volume
     */
    function getChoiceVolume(uint256 predictionId, string memory choice)
        external
        view
        predictionExists(predictionId)
        returns (uint256)
    {
        return predictions[predictionId].choiceVolumes[choice];
    }

    /**
     * @dev Get all participants
     */
    function getParticipants(uint256 predictionId)
        external
        view
        predictionExists(predictionId)
        returns (address[] memory)
    {
        return predictions[predictionId].participants;
    }

    /**
     * @dev Update oracle address
     */
    function setOracleAddress(address _oracleAddress) external onlyOwner {
        oracleAddress = _oracleAddress;
    }

    /**
     * @dev Update fee distributor address
     */
    function setFeeDistributor(address _feeDistributor) external onlyOwner {
        feeDistributor = _feeDistributor;
    }

    /**
     * @dev Internal function to remove prediction from active list
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
     * @dev Internal function to initialize Loss-Edge Pool for losers
     * Called when prediction is resolved
     */
    function _initializeLossEdgePool(uint256 predictionId, string memory winningChoice) internal {
        Prediction storage pred = predictions[predictionId];

        // Calculate total losing volume
        uint256 totalLosingVolume = 0;
        for (uint i = 0; i < pred.choices.length; i++) {
            if (keccak256(bytes(pred.choices[i])) != keccak256(bytes(winningChoice))) {
                totalLosingVolume += pred.choiceVolumes[pred.choices[i]];
            }
        }

        // Only initialize if there are losers
        if (totalLosingVolume > 0) {
            // Get total Loss-Edge fees collected for this prediction
            uint256 lossEdgeFees = IFeeDistributor(feeDistributor).getLossEdgeFeesForPrediction(predictionId);

            // Get Loss-Edge Vault address
            address lossEdgeVault = IFeeDistributor(feeDistributor).getLossEdgePoolAddress();

            // Initialize pool in Loss-Edge Vault
            ILossEdgeVault(lossEdgeVault).initializePool(predictionId, lossEdgeFees, totalLosingVolume);
        }
    }

    /**
     * @dev Receive function to accept BNB
     */
    receive() external payable {}
}
