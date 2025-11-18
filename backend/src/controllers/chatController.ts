import { Request, Response } from 'express';
import Message from '../models/Message';
import { IUser } from '../models/User';
import Prediction from '../models/Prediction';
import { generateChatResponse } from '../services/aiService';
import unifiedSportsService from '../services/unifiedSportsService';
import mongoose from 'mongoose';

// @desc    Send a message to Soly AI
// @route   POST /api/chat/message
// @access  Private
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Please provide message content' });
    }

    // Save user message
    const userMessage = await Message.create({
      user: user._id,
      role: 'user',
      content
    });

    // Get previous messages for context (last 10 messages)
    const previousMessages = await Message.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Format messages for the AI service
    const chatHistory = previousMessages
      .reverse()
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    // Generate AI response using Groq API
    let aiResponseContent;
    try {
      aiResponseContent = await generateChatResponse(content, chatHistory);
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback to simple response if AI service fails
      aiResponseContent = generateAIResponse(content);
    }

    // Save AI response
    const assistantMessage = await Message.create({
      user: user._id,
      role: 'assistant',
      content: aiResponseContent
    });

    res.status(200).json({
      success: true,
      content: aiResponseContent,
      messages: [
        {
          id: userMessage._id,
          role: userMessage.role,
          content: userMessage.content,
          timestamp: userMessage.createdAt
        },
        {
          id: assistantMessage._id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          timestamp: assistantMessage.createdAt
        }
      ]
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get chat history
// @route   GET /api/chat/history
// @access  Private
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { limit = 50 } = req.query;

    // Get messages for user
    const messages = await Message.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message._id,
      role: message.role,
      content: message.content,
      timestamp: message.createdAt
    }));

    res.status(200).json({
      success: true,
      messages: formattedMessages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to generate AI responses
const generateAIResponse = (userMessage: string): string => {
  // Simple keyword-based response system
  // In a real implementation, this would call an AI service like OpenAI

  const lowerCaseMessage = userMessage.toLowerCase();

  if (lowerCaseMessage.includes('create prediction') || lowerCaseMessage.includes('new prediction')) {
    return "Let's get this prediction party started! 🎯 What crypto are you feeling bullish on? BTC? ETH? SOL? Or something more degen? Tell me what you want to predict and we'll set it up!";
  }

  if (lowerCaseMessage.includes('btc') || lowerCaseMessage.includes('bitcoin')) {
    if (lowerCaseMessage.includes('price')) {
      return "Bitcoin looking spicy lately! 🔥 Wanna create a prediction on where BTC is headed? I can set you up with either a simple yes/no bet or multiple price ranges. What's your take on BTC?";
    }
    return "Ah, the OG crypto! 🏆 Bitcoin's always a solid choice for predictions. Want to put your BTC price prediction skills to the test? I can help you set that up in seconds!";
  }

  if (lowerCaseMessage.includes('eth') || lowerCaseMessage.includes('ethereum')) {
    if (lowerCaseMessage.includes('price')) {
      return "ETH's been on a wild ride! 🎢 Want to create a prediction on where Ethereum's price is headed? I can help you set up a market and potentially earn some sweet rewards if you're right!";
    }
    return "Ethereum, the big brain blockchain! 🧠 Want to create a prediction about ETH's future? Just tell me what you're thinking and we'll get it set up!";
  }

  if (lowerCaseMessage.includes('sol') || lowerCaseMessage.includes('solana')) {
    if (lowerCaseMessage.includes('price')) {
      return "Solana's been making moves! ⚡ Want to create a prediction on where SOL's price is headed? I run on Solana myself, so I'm extra fast at setting these up! What's your prediction?";
    }
    return "Solana - speed demon of blockchains! ⚡ Want to create a prediction about SOL? As a Solana-native AI, I'd be happy to help you set that up!";
  }

  if (lowerCaseMessage.includes('help')) {
    return "Yo! I'm SOLY, the AI that runs this prediction market DApp on Solana. I handle everything - creating markets, managing funds, distributing rewards. What can I help you with today? Ready to make some predictions? 🚀";
  }

  if (lowerCaseMessage.includes('how') && lowerCaseMessage.includes('work')) {
    return "My prediction DApp lets you bet on crypto price movements using SOL or SOLY tokens. You stake your tokens on what you think will happen, and if you're right - BOOM! 💰 You get rewarded from the pool. I handle all the escrow and payouts automatically. Wanna try making a prediction?";
  }

  // Default response for greetings like "hi"
  if (lowerCaseMessage.match(/^(hi|hello|hey|sup|yo|what's up|greetings)(\s+there)?[.!?]?$/i)) {
    return "Hi there! 👋 SOLY here - your AI prediction market wizard on Solana! I run this whole DApp myself - no middlemen, just pure blockchain magic. What can I help you with today? Are you interested in creating a prediction or would you like some market insights? I've got the latest crypto trends and can help you set up predictions in seconds! 🔮💰";
  }

  // Default response
  return "Hey there! I'm SOLY, the AI that powers this prediction market DApp on Solana. I can help you create predictions on any crypto asset, provide market insights, manage your stakes, and distribute rewards when you win! Would you like to create a prediction or get some market analysis? Let me know what you're interested in! 🚀";
};

// @desc    Get sports competitions for chat widget
// @route   GET /api/chat/sports/competitions
// @access  Private
export const getSportsCompetitions = async (req: Request, res: Response) => {
  try {
    console.log('Chat widget requesting sports competitions');

    const competitions = await unifiedSportsService.getCompetitions();

    // Limit to top 20 competitions for chat widget to avoid overwhelming the user
    const limitedCompetitions = competitions.slice(0, 20);

    res.status(200).json({
      success: true,
      competitions: limitedCompetitions,
      total: limitedCompetitions.length
    });
  } catch (error) {
    console.error('Error fetching competitions for chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sports competitions'
    });
  }
};

// @desc    Get sports matches for a competition (for chat widget)
// @route   GET /api/chat/sports/competitions/:competitionId/matches
// @access  Private
export const getSportsMatches = async (req: Request, res: Response) => {
  try {
    const { competitionId } = req.params;
    const { days = 7 } = req.query;

    console.log(`Chat widget requesting matches for competition: ${competitionId}`);

    if (!competitionId) {
      return res.status(400).json({
        success: false,
        message: 'Competition ID is required'
      });
    }

    const matches = await unifiedSportsService.getMatchesByCompetition(competitionId, Number(days));

    // Check which matches already have predictions
    const matchIds = matches.map(match => match.id);
    const existingPredictions = await Prediction.find({
      'sportsData.matchId': { $in: matchIds },
      category: 'sports'
    }).select('sportsData.matchId title');

    const existingMatchIds = new Set(
      existingPredictions.map(pred => pred.sportsData?.matchId).filter(Boolean)
    );

    // Add prediction status to matches and filter out matches that already have predictions
    const availableMatches = matches
      .filter(match => !existingMatchIds.has(match.id))
      .filter(match => unifiedSportsService.validateMatchForPrediction(match).valid)
      .slice(0, 10); // Limit to 10 matches for chat widget

    res.status(200).json({
      success: true,
      matches: availableMatches,
      total: availableMatches.length,
      totalWithPredictions: existingMatchIds.size
    });
  } catch (error) {
    console.error('Error fetching matches for chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sports matches'
    });
  }
};

// @desc    Create a sports prediction from chat widget
// @route   POST /api/chat/sports/predictions
// @access  Private
export const createSportsPredictionFromChat = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    const {
      matchId,
      title,
      description,
      type = 'binary',
      options,
      endTime,
      stakeAmount = 0.01,
      transactionHash
    } = req.body;

    console.log(`User ${user._id} creating sports prediction via chat for match: ${matchId}`);
    console.log(`Stake amount: ${stakeAmount}, Transaction hash: ${transactionHash}`);

    // Validate required fields
    if (!matchId || !title || !description || !options || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: matchId, title, description, options, endTime'
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
        message: 'A prediction already exists for this match',
        existingPrediction: {
          id: existingPrediction._id,
          title: existingPrediction.title,
          creator: existingPrediction.creator
        }
      });
    }

    // Find match data
    let match = null;
    try {
      const competitions = await unifiedSportsService.getCompetitions();
      const limitedCompetitions = competitions.slice(0, 50);

      for (const competition of limitedCompetitions) {
        try {
          const matches = await unifiedSportsService.getMatchesByCompetition(competition.id, 7);
          const foundMatch = matches.find(m => m.id === matchId);
          if (foundMatch) {
            match = foundMatch;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!match) {
        return res.status(404).json({
          success: false,
          message: 'Match not found'
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

    // Convert options to choices format
    const choices = options.map((option: any, index: number) => ({
      id: `option_${index + 1}`,
      label: option.text || option.label,
      price: 0,
      percentage: 0
    }));

    // Create the sports prediction
    const prediction = await Prediction.create({
      title,
      description,
      type: type === 'multiple' ? 'multiple' : 'binary',
      category: 'sports',
      tokenType: 'BNB',
      creator: user._id,
      endDate: new Date(endTime),
      volume: stakeAmount, // Set initial volume to the creator's stake
      participants: 1, // Creator is the first participant
      choices,
      resolveDetails: `Sports prediction for ${match.home?.name || 'Home Team'} vs ${match.away?.name || 'Away Team'}`,
      status: 'active',
      asset: `${match.home?.name || 'Home Team'} vs ${match.away?.name || 'Away Team'}`,
      stakeAmount: stakeAmount,
      transactionHash: transactionHash, // Store the transaction hash for verification
      sportsData: {
        matchId: match.id,
        competitionId: match.competition.id,
        competitionName: match.competition.name,
        homeTeam: {
          id: match.home?.id || 'home-team',
          name: match.home?.name || 'Home Team',
          country: match.home?.country?.name || 'Unknown'
        },
        awayTeam: {
          id: match.away?.id || 'away-team',
          name: match.away?.name || 'Away Team',
          country: match.away?.country?.name || 'Unknown'
        },
        scheduledDate: new Date(match.scheduled),
        sport: 'soccer',
        autoResolve: true,
        resolutionCriteria: 'full_time_result'
      }
    });

    console.log(`Sports prediction created via chat: ${prediction._id}`);

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
    console.error('Error creating sports prediction from chat:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create sports prediction'
    });
  }
};
