import { Request, Response } from 'express';
import * as lpVaultService from '../services/lpVaultService';

/**
 * Get total LP staked in the vault
 * GET /api/lp-vault/total-staked
 */
export async function getTotalStaked(req: Request, res: Response) {
  try {
    const totalStaked = await lpVaultService.getTotalLPStaked();
    
    res.json({
      success: true,
      data: {
        totalStaked,
      },
    });
  } catch (error: any) {
    console.error('Error getting total staked:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get total staked',
      error: error.message,
    });
  }
}

/**
 * Get vault balances (Boost 70% + Creator 30%)
 * GET /api/lp-vault/balances
 */
export async function getVaultBalances(req: Request, res: Response) {
  try {
    const balances = await lpVaultService.getVaultBalances();
    
    res.json({
      success: true,
      data: balances,
    });
  } catch (error: any) {
    console.error('Error getting vault balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vault balances',
      error: error.message,
    });
  }
}

/**
 * Get user LP balance and claimable rewards
 * GET /api/lp-vault/user/:address
 */
export async function getUserInfo(req: Request, res: Response): Promise<void> {
  try {
    const { address } = req.params;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      res.status(400).json({
        success: false,
        message: 'Invalid wallet address',
      });
      return;
    }

    const userInfo = await lpVaultService.getUserLPInfo(address);

    res.json({
      success: true,
      data: userInfo,
    });
  } catch (error: any) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user info',
      error: error.message,
    });
  }
}

/**
 * Get yield breakdown by source
 * GET /api/lp-vault/yield-breakdown
 */
export async function getYieldBreakdown(req: Request, res: Response) {
  try {
    const yieldBreakdown = await lpVaultService.getYieldBreakdown();
    
    res.json({
      success: true,
      data: yieldBreakdown,
    });
  } catch (error: any) {
    console.error('Error getting yield breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get yield breakdown',
      error: error.message,
    });
  }
}

/**
 * Get LP deployment info for a prediction
 * GET /api/lp-vault/prediction/:predictionId
 */
export async function getPredictionLPInfo(req: Request, res: Response): Promise<void> {
  try {
    const { predictionId } = req.params;
    const id = parseInt(predictionId);

    if (isNaN(id) || id < 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid prediction ID',
      });
      return;
    }

    const lpInfo = await lpVaultService.getLPDeploymentInfo(id);

    res.json({
      success: true,
      data: lpInfo,
    });
  } catch (error: any) {
    console.error('Error getting prediction LP info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prediction LP info',
      error: error.message,
    });
  }
}

/**
 * Get complete LP vault stats
 * GET /api/lp-vault/stats
 */
export async function getVaultStats(req: Request, res: Response) {
  try {
    const [balances, yieldBreakdown, totalStakers] = await Promise.all([
      lpVaultService.getVaultBalances(),
      lpVaultService.getYieldBreakdown(),
      lpVaultService.getTotalStakers(),
    ]);

    res.json({
      success: true,
      data: {
        balances,
        yieldBreakdown,
        totalStakers,
      },
    });
  } catch (error: any) {
    console.error('Error getting vault stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vault stats',
      error: error.message,
    });
  }
}

/**
 * Get user activity events
 * GET /api/lp-vault/activity/:address
 */
export async function getUserActivity(req: Request, res: Response): Promise<void> {
  try {
    const { address } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({
        success: false,
        message: 'Invalid address',
      });
      return;
    }

    const activities = await lpVaultService.getUserActivity(address, limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error: any) {
    console.error('Error getting user activity:', error);
    // Return empty array instead of error for better UX
    res.json({
      success: true,
      data: [],
    });
  }
}

