import express from 'express';
import * as lpVaultController from '../controllers/lpVaultController';

const router = express.Router();

/**
 * @route   GET /api/lp-vault/total-staked
 * @desc    Get total LP staked in the vault
 * @access  Public
 */
router.get('/total-staked', lpVaultController.getTotalStaked);

/**
 * @route   GET /api/lp-vault/balances
 * @desc    Get vault balances (Boost 70% + Creator 30%)
 * @access  Public
 */
router.get('/balances', lpVaultController.getVaultBalances);

/**
 * @route   GET /api/lp-vault/user/:address
 * @desc    Get user LP balance and claimable rewards
 * @access  Public
 */
router.get('/user/:address', lpVaultController.getUserInfo);

/**
 * @route   GET /api/lp-vault/yield-breakdown
 * @desc    Get yield breakdown by source (Boost, Creator, Engagement)
 * @access  Public
 */
router.get('/yield-breakdown', lpVaultController.getYieldBreakdown);

/**
 * @route   GET /api/lp-vault/prediction/:predictionId
 * @desc    Get LP deployment info for a prediction
 * @access  Public
 */
router.get('/prediction/:predictionId', lpVaultController.getPredictionLPInfo);

/**
 * @route   GET /api/lp-vault/stats
 * @desc    Get complete LP vault stats (balances + yield breakdown)
 * @access  Public
 */
router.get('/stats', lpVaultController.getVaultStats);

/**
 * @route   GET /api/lp-vault/activity/:address
 * @desc    Get user activity events (stake, unstake, claim)
 * @access  Public
 */
router.get('/activity/:address', lpVaultController.getUserActivity);

export default router;

