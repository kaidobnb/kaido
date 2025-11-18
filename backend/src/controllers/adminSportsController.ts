import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Prediction from '../models/Prediction';
import sportradarService from '../services/sportradarService';
import unifiedSportsService, { SportsApiProvider } from '../services/unifiedSportsService';
import { IUser } from '../models/User';

// @desc    Get all available competitions/leagues
// @route   GET /api/admin/sports/competitions
// @access  Admin only
export const getCompetitions = async (req: Request, res: Response) => {
  try {
    console.log('Admin requesting competitions list');

    const competitions = await unifiedSportsService.getCompetitions();
    
    // Filter and sort competitions for better UX
    const filteredCompetitions = competitions
      .filter(comp => comp.name && (comp.category?.name || comp.country?.name))
      .sort((a, b) => {
        // Prioritize major leagues
        const majorLeagues = ['Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1', 'UEFA Champions League'];
        const aIsMajor = majorLeagues.some(league => a.name.includes(league));
        const bIsMajor = majorLeagues.some(league => b.name.includes(league));

        if (aIsMajor && !bIsMajor) return -1;
        if (!aIsMajor && bIsMajor) return 1;

        // Then sort by category/country and name
        const aLocation = a.country?.name || a.category?.name || '';
        const bLocation = b.country?.name || b.category?.name || '';

        if (aLocation !== bLocation) {
          return aLocation.localeCompare(bLocation);
        }
        return a.name.localeCompare(b.name);
      });

    res.status(200).json({
      success: true,
      competitions: filteredCompetitions,
      total: filteredCompetitions.length
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch competitions'
    });
  }
};

// @desc    Get upcoming matches for a specific competition
// @route   GET /api/admin/sports/competitions/:competitionId/matches
// @access  Admin only
export const getMatchesByCompetition = async (req: Request, res: Response) => {
  try {
    const { competitionId } = req.params;
    const { days = '30' } = req.query;
    
    console.log(`Admin requesting matches for competition: ${competitionId}`);
    
    if (!competitionId) {
      return res.status(400).json({
        success: false,
        message: 'Competition ID is required'
      });
    }

    const matches = await unifiedSportsService.getMatchesByCompetition(
      competitionId,
      parseInt(days as string)
    );

    // Check which matches already have predictions
    const matchIds = matches.map(match => match.id);
    const existingPredictions = await Prediction.find({
      'sportsData.matchId': { $in: matchIds },
      category: 'sports'
    }).select('sportsData.matchId title');

    const existingMatchIds = new Set(
      existingPredictions.map(pred => pred.sportsData?.matchId).filter(Boolean)
    );

    // Add prediction status to matches
    const matchesWithStatus = matches.map(match => ({
      ...match,
      hasPrediction: existingMatchIds.has(match.id),
      validForPrediction: unifiedSportsService.validateMatchForPrediction(match)
    }));

    res.status(200).json({
      success: true,
      matches: matchesWithStatus,
      total: matchesWithStatus.length,
      existingPredictions: existingPredictions.length
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch matches'
    });
  }
};

// @desc    Get detailed information about a specific match
// @route   GET /api/admin/sports/matches/:matchId
// @access  Admin only
export const getMatchDetails = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    
    console.log(`Admin requesting match details for: ${matchId}`);
    
    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }

    const match = await sportradarService.getMatchDetails(matchId);
    
    // Check if prediction already exists for this match
    const existingPrediction = await Prediction.findOne({
      'sportsData.matchId': matchId,
      category: 'sports'
    });

    const validation = sportradarService.validateMatchForPrediction(match);

    res.status(200).json({
      success: true,
      match,
      hasPrediction: !!existingPrediction,
      existingPrediction: existingPrediction ? {
        id: existingPrediction._id,
        title: existingPrediction.title,
        status: existingPrediction.status
      } : null,
      validation
    });
  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch match details'
    });
  }
};

// @desc    Create a new sports prediction
// @route   POST /api/admin/sports/predictions
// @access  Admin only
export const createSportsPrediction = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    const {
      matchId,
      title,
      description,
      type,
      options,
      endTime,
      autoResolve,
      resolutionCriteria
    } = req.body;

    console.log(`Admin ${user._id} creating sports prediction for match: ${matchId}`);

    // Validate required fields
    if (!matchId || !title || !description || !type || !options || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Find match in our cached competition data instead of fetching details
    // This avoids the 404 error from Sportradar's match details endpoint
    let match = null;

    // Try to find the match in our cached data by searching through a limited set of popular competitions
    try {
      // Get all competitions to find the match
      const competitions = await unifiedSportsService.getCompetitions();

      // Search through only the first 50 competitions to avoid rate limiting
      // This should cover most major leagues (Premier League, La Liga, Serie A, etc.)
      const limitedCompetitions = competitions.slice(0, 50);
      console.log(`Searching through ${limitedCompetitions.length} competitions for match ${matchId}`);

      // Search through competitions to find the match
      for (const competition of limitedCompetitions) {
        try {
          const matches = await unifiedSportsService.getMatchesByCompetition(competition.id, 7); // Reduced to 7 days
          const foundMatch = matches.find(m => m.id === matchId);
          if (foundMatch) {
            match = foundMatch;
            console.log(`Found match in competition: ${competition.name}`);
            break;
          }
        } catch (error) {
          // Continue searching if this competition fails
          console.log(`Failed to search competition ${competition.name}:`, error);
          continue;
        }
      }

      if (!match) {
        return res.status(404).json({
          success: false,
          message: 'Match not found in available competitions'
        });
      }

      // Validate match for prediction creation
      const validation = unifiedSportsService.validateMatchForPrediction(match);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: `Match not valid for prediction: ${validation.reason}`
        });
      }
    } catch (error) {
      console.error('Error finding match:', error);
      return res.status(500).json({
        success: false,
        message: 'Error finding match data'
      });
    }

    // Additional check to ensure we have both teams (TypeScript safety)
    if (!match.home || !match.away) {
      return res.status(400).json({
        success: false,
        message: 'Match must have both home and away teams'
      });
    }

    // Check if prediction already exists for this match
    const existingPrediction = await Prediction.findOne({
      'sportsData.matchId': matchId,
      category: 'sports'
    });

    if (existingPrediction) {
      return res.status(400).json({
        success: false,
        message: 'A prediction already exists for this match'
      });
    }

    // Convert options to choices format
    const choices = options.map((option: any, index: number) => ({
      id: `option_${index + 1}`,
      label: option.text,
      price: 0, // Will be calculated based on participation
      percentage: 0 // Will be calculated based on participation
    }));

    // Create the sports prediction as a regular user-funded prediction
    const prediction = await Prediction.create({
      title,
      description,
      type: type === 'multiple' ? 'multiple' : 'binary', // Sports predictions are regular predictions, not agent
      category: 'sports',
      tokenType: 'BNB', // Sports predictions use BNB
      creator: user._id,
      endDate: new Date(endTime),
      volume: 0, // Starts at 0, grows with user participation
      participants: 0, // Starts at 0, grows with user participation
      choices,
      resolveDetails: `Sports prediction for ${match.home.name} vs ${match.away.name}`,
      status: 'active',
      asset: `${match.home.name} vs ${match.away.name}`,
      stakeAmount: 0.01, // Minimum BNB stake amount
      sportsData: {
        matchId: match.id,
        competitionId: match.competition.id,
        competitionName: match.competition.name,
        homeTeam: {
          id: match.home.id,
          name: match.home.name,
          country: match.home.country?.name || 'Unknown'
        },
        awayTeam: {
          id: match.away.id,
          name: match.away.name,
          country: match.away.country?.name || 'Unknown'
        },
        scheduledDate: new Date(match.scheduled),
        sport: 'soccer',
        autoResolve: autoResolve !== false, // Default to true
        resolutionCriteria: resolutionCriteria || 'full_time_result'
      }
    });

    console.log(`Sports prediction created successfully: ${prediction._id}`);

    res.status(201).json({
      success: true,
      message: 'Sports prediction created successfully',
      prediction: {
        id: prediction._id,
        title: prediction.title,
        type: prediction.type,
        category: prediction.category,
        status: prediction.status,
        sportsData: prediction.sportsData
      }
    });
  } catch (error) {
    console.error('Error creating sports prediction:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create sports prediction'
    });
  }
};

// @desc    Get current sports API provider info
// @route   GET /api/admin/sports/provider
// @access  Admin only
export const getSportsApiProvider = async (req: Request, res: Response) => {
  try {
    const providerInfo = unifiedSportsService.getProviderInfo();

    res.json({
      success: true,
      provider: providerInfo
    });
  } catch (error) {
    console.error('Error getting sports API provider info:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get provider info'
    });
  }
};

// @desc    Set sports API provider
// @route   POST /api/admin/sports/provider
// @access  Admin only
export const setSportsApiProvider = async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;

    if (!provider || !['sportradar', 'football-data'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider. Must be "sportradar" or "football-data"'
      });
    }

    const oldProvider = unifiedSportsService.getCurrentProvider();
    unifiedSportsService.setProvider(provider as SportsApiProvider);

    console.log(`Admin switched sports API provider from ${oldProvider} to ${provider}`);

    res.json({
      success: true,
      message: `Sports API provider switched to ${provider}`,
      provider: unifiedSportsService.getProviderInfo()
    });
  } catch (error) {
    console.error('Error setting sports API provider:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to set provider'
    });
  }
};

// @desc    Clear sports API caches
// @route   POST /api/admin/sports/clear-cache
// @access  Admin only
export const clearSportsApiCache = async (req: Request, res: Response) => {
  try {
    unifiedSportsService.clearAllCaches();

    console.log('Admin cleared all sports API caches');

    res.json({
      success: true,
      message: 'All sports API caches cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing sports API cache:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear cache'
    });
  }
};

// @desc    Get all sports predictions (for admin management)
// @route   GET /api/admin/sports/predictions
// @access  Admin only
export const getSportsPredictions = async (req: Request, res: Response) => {
  try {
    const { status, limit = '20', page = '1' } = req.query;
    
    const query: any = { category: 'sports' };
    if (status) {
      query.status = status;
    }

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const predictions = await Prediction.find(query)
      .populate('creator', 'username walletAddress')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Prediction.countDocuments(query);

    res.status(200).json({
      success: true,
      predictions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching sports predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sports predictions'
    });
  }
};

// @desc    Manually resolve a sports prediction
// @route   POST /api/admin/sports/predictions/:predictionId/resolve
// @access  Admin only
export const resolveSportsPrediction = async (req: Request, res: Response) => {
  try {
    const { predictionId } = req.params;
    const { resolvedChoice } = req.body;
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    console.log(`Admin ${user._id} manually resolving sports prediction: ${predictionId}`);

    if (!resolvedChoice) {
      return res.status(400).json({
        success: false,
        message: 'Resolved choice is required'
      });
    }

    const prediction = await Prediction.findById(predictionId);
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    if (prediction.category !== 'sports') {
      return res.status(400).json({
        success: false,
        message: 'This is not a sports prediction'
      });
    }

    if (prediction.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Prediction is not active'
      });
    }

    // Validate that the resolved choice exists
    const validChoice = prediction.choices.find(choice => choice.id === resolvedChoice);
    if (!validChoice) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resolved choice'
      });
    }

    // Update prediction
    prediction.status = 'resolved';
    prediction.resolvedChoice = resolvedChoice;
    prediction.resolvedAt = new Date();
    prediction.resolvedBy = 'admin';
    await prediction.save();

    console.log(`Sports prediction ${predictionId} resolved manually by admin`);

    res.status(200).json({
      success: true,
      message: 'Sports prediction resolved successfully',
      prediction: {
        id: prediction._id,
        status: prediction.status,
        resolvedChoice: prediction.resolvedChoice,
        resolvedAt: prediction.resolvedAt
      }
    });
  } catch (error) {
    console.error('Error resolving sports prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve sports prediction'
    });
  }
};
