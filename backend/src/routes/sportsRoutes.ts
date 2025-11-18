import express, { RequestHandler } from 'express';
import unifiedSportsService from '../services/unifiedSportsService';
import Prediction from '../models/Prediction';

const router = express.Router();

// @desc    Get all available competitions/leagues (public)
// @route   GET /api/sports/competitions
// @access  Public
const getCompetitions: RequestHandler = async (req, res) => {
  try {
    console.log('Public request for sports competitions');

    const competitions = await unifiedSportsService.getCompetitions();

    // Limit to top 20 competitions for public display
    const limitedCompetitions = competitions.slice(0, 20);

    res.status(200).json({
      success: true,
      competitions: limitedCompetitions,
      total: limitedCompetitions.length
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sports competitions'
    });
  }
};

router.get('/competitions', getCompetitions);

// @desc    Get upcoming matches for a specific competition (public)
// @route   GET /api/sports/competitions/:competitionId/matches
// @access  Public
const getMatches: RequestHandler = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { days = '7' } = req.query;

    console.log(`Public request for matches in competition: ${competitionId}`);

    if (!competitionId) {
      res.status(400).json({
        success: false,
        message: 'Competition ID is required'
      });
      return;
    }

    const matches = await unifiedSportsService.getMatchesByCompetition(
      competitionId,
      Number(days)
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
      hasPrediction: existingMatchIds.has(match.id)
    }));

    res.status(200).json({
      success: true,
      matches: matchesWithStatus,
      total: matchesWithStatus.length
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sports matches'
    });
  }
};

router.get('/competitions/:competitionId/matches', getMatches);

// @desc    Get featured/upcoming matches (public)
// @route   GET /api/sports/featured
// @access  Public
const getFeaturedMatches: RequestHandler = async (req, res) => {
  try {
    console.log('Public request for featured sports matches');

    const competitions = await unifiedSportsService.getCompetitions();
    
    // Get featured competitions
    const featuredCompetitionIds = [
      'sr:competition:17', // Premier League
      'sr:competition:34', // La Liga
      'sr:competition:23', // Serie A
      'sr:competition:35', // Bundesliga
      'sr:competition:238' // Ligue 1
    ];

    const allMatches: any[] = [];

    // Fetch matches from featured competitions
    for (const competitionId of featuredCompetitionIds) {
      try {
        const matches = await unifiedSportsService.getMatchesByCompetition(competitionId, 7);
        allMatches.push(...matches.slice(0, 3)); // Get top 3 matches from each competition
      } catch (error) {
        console.error(`Error fetching matches for competition ${competitionId}:`, error);
      }
    }

    // Check which matches already have predictions
    const matchIds = allMatches.map(match => match.id);
    const existingPredictions = await Prediction.find({
      'sportsData.matchId': { $in: matchIds },
      category: 'sports'
    }).select('sportsData.matchId title');

    const existingMatchIds = new Set(
      existingPredictions.map(pred => pred.sportsData?.matchId).filter(Boolean)
    );

    // Add prediction status and sort by date
    const matchesWithStatus = allMatches
      .map(match => ({
        ...match,
        hasPrediction: existingMatchIds.has(match.id)
      }))
      .sort((a, b) => new Date(a.scheduled).getTime() - new Date(b.scheduled).getTime())
      .slice(0, 10); // Limit to 10 matches

    res.status(200).json({
      success: true,
      matches: matchesWithStatus,
      total: matchesWithStatus.length
    });
  } catch (error) {
    console.error('Error fetching featured matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured sports matches'
    });
  }
};

router.get('/featured', getFeaturedMatches);

export default router;

