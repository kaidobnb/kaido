import React, { useState, useRef, useEffect } from 'react';
import { Send, CloudLightning as Lightning } from 'lucide-react';
import { KaidoMessage } from '../../types';
import { ChatContext, ChatPredictionParams, PredictionCreationState } from '../../types/chat';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card, { CardContent, CardFooter } from '../ui/Card';
import ChatPredictionFlow from './ChatPredictionFlow';
import { useWallet, refreshWalletBalances } from '../../contexts/WalletContext';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useToast } from '../../hooks/useToast';
import { useNavigation } from '../../hooks/useNavigation';
import {
  sendChatMessage,
  detectPredictionIntent,
  processPredictionStep,
  getCryptoPriceInfo,
  generatePredictionFlowPrompt,
  detectSportsPredictionIntent,
  detectCryptoPredictionIntent,
  getSportsCompetitions,
  getSportsMatches
} from '../../services/chatService';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { createPrediction, createChatSportsPrediction } from '../../services/api';
import { createBnbTransaction, createKaidoTransaction, checkTransactionStatus, ADMIN_WALLET_ADDRESS } from '../../utils/transactionUtils';
import { useCreatePrediction } from '../../hooks/useContracts';

// Local storage key for embedded chat history
const EMBEDDED_CHAT_HISTORY_KEY = 'kaido_embedded_chat_history';

const loadChatHistory = (): KaidoMessage[] => {
  try {
    const savedHistory = localStorage.getItem(EMBEDDED_CHAT_HISTORY_KEY);
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [];
};

const saveChatHistory = (messages: KaidoMessage[]) => {
  try {
    localStorage.setItem(EMBEDDED_CHAT_HISTORY_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

// Helper function to parse message content and extract actionable buttons
interface MessageButton {
  text: string;
  action: string;
  type: 'cta' | 'numbered' | 'quick-reply';
}

const parseMessageButtons = (content: string): { text: string; buttons: MessageButton[] } => {
  const buttons: MessageButton[] = [];
  let processedContent = content;

  // Pattern 1: Extract CTA buttons like "⚽ **Football Predictions**" or "₿ **Crypto Predictions**"
  const ctaPattern = /[⚽₿📈🏆💰]\s*\*\*([^*]+)\*\*/g;
  let match;
  while ((match = ctaPattern.exec(content)) !== null) {
    const buttonText = match[1].trim();
    let action = '';

    if (buttonText.toLowerCase().includes('football') || buttonText.toLowerCase().includes('soccer')) {
      action = 'football';
    } else if (buttonText.toLowerCase().includes('crypto')) {
      action = 'crypto';
    } else if (buttonText.toLowerCase().includes('bitcoin') || buttonText.toLowerCase().includes('btc')) {
      action = 'bitcoin';
    } else if (buttonText.toLowerCase().includes('ethereum') || buttonText.toLowerCase().includes('eth')) {
      action = 'ethereum';
    }

    if (action) {
      buttons.push({ text: buttonText, action, type: 'cta' });
    }
  }

  // Pattern 2: Extract numbered options like "1. Premier League" or "**1.** Premier League"
  const numberedPattern = /(?:^|\n)\s*\*?\*?(\d+)\.?\*?\*?\s+([^\n]+)/gm;
  while ((match = numberedPattern.exec(content)) !== null) {
    const number = match[1];
    const optionText = match[2].trim().replace(/\*\*/g, ''); // Remove markdown bold
    buttons.push({
      text: optionText,
      action: number,
      type: 'numbered'
    });
  }

  // Pattern 3: Extract quick reply suggestions like "Type 'football' or 'yes'"
  const quickReplyPattern = /Type\s+['"]([^'"]+)['"](?:\s+or\s+['"]([^'"]+)['"])?/gi;
  while ((match = quickReplyPattern.exec(content)) !== null) {
    if (match[1]) {
      buttons.push({ text: match[1], action: match[1].toLowerCase(), type: 'quick-reply' });
    }
    if (match[2]) {
      buttons.push({ text: match[2], action: match[2].toLowerCase(), type: 'quick-reply' });
    }
  }

  return { text: processedContent, buttons };
};

const EmbeddedChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<KaidoMessage[]>(loadChatHistory());
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [showPredictionFlow, setShowPredictionFlow] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext>({
    creatingPrediction: false,
    predictionState: 'idle',
    predictionParams: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sportsCompetitions, setSportsCompetitions] = useState<any[]>([]);
  const [sportsMatches, setSportsMatches] = useState<any[]>([]);
  const [loadingSportsData, setLoadingSportsData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);

  const { wallet, userProfile } = useWallet();
  const { address, isConnected } = useAccount();
  const { address: appkitAddress } = useAppKitAccount();
  const { sendTransaction, isPending: isSendingTransaction, error: sendTransactionError } = useSendTransaction();
  const { showToast } = useToast();
  const { navigateTo } = useNavigation();

  // On-chain contract hooks
  const { createPrediction: createOnChainPrediction, isPending: isCreatingOnChain, error: createError } = useCreatePrediction();

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Save chat history
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const scrollToBottom = () => {
    // Scroll only within the chat container, not the entire page
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle wallet funding for sports predictions
  const handleSportsPredictionFunding = async (params: any) => {
    try {
      setIsSubmitting(true);

      // Check wallet connection
      if (!address || !isConnected) {
        const errorMessage: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: '🔗 **Wallet Not Connected**\n\nPlease connect your wallet to proceed with the prediction.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
        setChatContext({
          creatingPrediction: false,
          predictionState: 'idle',
          predictionParams: {}
        });
        return;
      }

      // Add processing message
      const processingMessage: KaidoMessage = {
        id: `msg-${messages.length + 2}`,
        role: 'assistant',
        content: `🔄 **Processing Transaction**\n\nPlease approve the transaction in your wallet to fund your prediction with ${params.stakeAmount} BNB.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, processingMessage]);

      // Create BNB transaction
      const transaction = await createBnbTransaction(address as any, params.stakeAmount);

      // Send transaction using wagmi
      const txHash = await new Promise<string>((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (hash) => {
            console.log('Sports prediction transaction sent:', hash);
            resolve(hash);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            reject(error);
          }
        });
      });

      // Add transaction success message
      const txSuccessMessage: KaidoMessage = {
        id: `msg-${messages.length + 3}`,
        role: 'assistant',
        content: `✅ **Transaction Confirmed!**\n\nHash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\n🔄 Creating your prediction...`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, txSuccessMessage]);

      // Create the sports prediction with transaction hash
      const predictionData = {
        matchId: params.matchId,
        title: `${params.homeTeam} vs ${params.awayTeam} - Match Winner`,
        description: `Predict the winner of the ${params.competitionName} match between ${params.homeTeam} and ${params.awayTeam}`,
        type: 'multiple',
        options: [
          { text: `${params.homeTeam} wins` },
          { text: 'Draw' },
          { text: `${params.awayTeam} wins` }
        ],
        creatorChoice: params.predictionChoice, // Add the creator's prediction choice
        endTime: new Date(new Date(params.scheduledDate!).getTime() - 30 * 60 * 1000).toISOString(),
        stakeAmount: params.stakeAmount,
        transactionHash: txHash
      };

      const response = await createChatSportsPrediction(predictionData);

      if (response.success) {
        const successMessage: KaidoMessage = {
          id: `msg-${messages.length + 4}`,
          role: 'assistant',
          content: `🎉 **Prediction Created Successfully!**\n\n✅ **"${predictionData.title}"** is now live!\n\n📊 **Prediction Details:**\n• 🎯 Type: Match Winner\n• 🔮 Your Prediction: ${params.predictionChoice}\n• 💰 Stake: ${params.stakeAmount} BNB\n• ⏰ Closes 30 minutes before kickoff\n\n🚀 **What's Next?**\n• Users can now participate with BNB\n• Winners share the prize pool\n• Results auto-resolve after the match\n\nGood luck with your prediction! 🏆`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, successMessage]);

        // Reset chat context
        setChatContext({
          creatingPrediction: false,
          predictionState: 'idle',
          predictionParams: {}
        });
      } else {
        const errorMessage: KaidoMessage = {
          id: `msg-${messages.length + 4}`,
          role: 'assistant',
          content: `❌ **Creation Failed**\n\n${response.message || 'Unable to create sports prediction'}\n\n🔍 **Common Issues:**\n• Prediction already exists for this match\n• Match has already started\n• API connection problems\n\n🔄 Try selecting a different match or try again later.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error creating sports prediction:', error);
      const errorMessage: KaidoMessage = {
        id: `msg-${messages.length + 3}`,
        role: 'assistant',
        content: '❌ **Technical Error**\n\nSomething went wrong while creating your prediction. Please try again or contact support if the issue persists.\n\n🔄 **Quick Fix:** Try refreshing and starting over.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle crypto prediction submission (wallet transaction)
  const handleSubmitPrediction = async (predictionData: any) => {
    console.log('[EMBEDDED CHAT] handleSubmitPrediction called with:', predictionData);
    try {
      setIsSubmitting(true);

      // Check if wallet is connected
      if (!wallet.connected || !wallet.address) {
        showToast({
          type: 'error',
          title: 'Wallet Not Connected',
          message: 'Please connect your wallet to create a prediction'
        });
        setIsSubmitting(false);
        return;
      }

      // Check if wallet is connected via wagmi
      if (!address || !isConnected) {
        showToast({
          type: 'error',
          title: 'Connection Error',
          message: 'Please connect your wallet to BNB Smart Chain'
        });
        setIsSubmitting(false);
        return;
      }

      // Parse the expiry date
      const expiryDate = new Date(predictionData.expiryDate);

      // Validate the date
      if (isNaN(expiryDate.getTime())) {
        throw new Error(`Invalid expiry date: ${predictionData.expiryDate}`);
      }

      // Add processing message to chat
      const processingMessage: KaidoMessage = {
        id: `msg-${messages.length + 1}`,
        role: 'assistant',
        content: `🔄 Creating on-chain prediction... Please approve the transaction in your wallet.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, processingMessage]);

      // Calculate lock time
      const lockTime = Math.floor(expiryDate.getTime() / 1000);

      // Prepare prediction parameters
      const predictionTitle = `Will ${predictionData.asset} ${predictionData.type === 'binary' ?
        `reach $${predictionData.targetPrice}` :
        `fall within a price range`} by ${expiryDate.toLocaleDateString()}?`;

      const predictionDescription = `Prediction about ${predictionData.asset} price`;
      const targetPriceNumber = parseFloat(predictionData.targetPrice || '0');

      // Create prediction on smart contract
      const txHash = await createOnChainPrediction({
        title: predictionTitle,
        description: predictionDescription,
        predictionType: predictionData.type === 'binary' ? 0 : 1,
        category: 0, // CRYPTO
        asset: predictionData.asset,
        targetPrice: targetPriceNumber,
        endDate: lockTime,
        choices: predictionData.type === 'binary' ? ['Yes', 'No'] : (predictionData.priceRanges || []),
        creatorStake: predictionData.stakeAmount
      });

      if (!txHash) {
        throw new Error('Failed to create on-chain prediction');
      }

      // Add success message
      const successMessage: KaidoMessage = {
        id: `msg-${messages.length + 2}`,
        role: 'assistant',
        content: `✅ On-chain prediction created! Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\nWaiting for blockchain confirmation...`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, successMessage]);

      // Save to database
      const apiData = {
        title: predictionTitle,
        description: predictionDescription,
        type: predictionData.type === 'binary' ? 'binary' : 'multiple',
        tokenType: 'BNB',
        endDate: predictionData.expiryDate,
        duration: predictionData.duration,
        asset: predictionData.asset,
        targetPrice: predictionData.type === 'binary' ? targetPriceNumber : undefined,
        priceRanges: predictionData.type === 'multi-choice' ? predictionData.priceRanges : undefined,
        stakeAmount: predictionData.stakeAmount,
        resolveDetails: `This prediction will be resolved based on the ${predictionData.asset} price.`,
        useAI: true,
        walletAddress: wallet.address,
        onChainId: 0,
        transactionHash: txHash,
        transactionVerified: false,
        bypassBalanceCheck: true,
        onChain: true
      };

      const response = await createPrediction(apiData);

      if (response.success) {
        const predictionId = response.prediction?._id || response.prediction?.id;
        const predictionLink = `/prediction/${predictionId}`;

        const finalMessage: KaidoMessage = {
          id: `msg-${messages.length + 3}`,
          role: 'assistant',
          content: `🎉 **Prediction Created Successfully!**\n\n✅ Your prediction is now live on the blockchain!\n\n📊 [View Your Prediction](${predictionLink})\n\nOthers can now participate and stake on this prediction. Good luck! 🚀`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, finalMessage]);

        // Reset chat context
        setChatContext({
          creatingPrediction: false,
          predictionState: 'idle',
          predictionParams: {}
        });

        // Navigate to prediction page after a delay
        setTimeout(() => {
          navigateTo(predictionLink);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating prediction:', error);
      const errorMessage: KaidoMessage = {
        id: `msg-${messages.length + 3}`,
        role: 'assistant',
        content: `❌ **Error:** ${error.message || 'Failed to create prediction'}\n\nPlease try again or contact support if the issue persists.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);

      // Reset chat context
      setChatContext({
        creatingPrediction: false,
        predictionState: 'idle',
        predictionParams: {}
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sports prediction flow steps with optimized UI
  const handleSportsPredictionStep = async (userInput: string) => {
    const lowerInput = userInput.toLowerCase().trim();
    const currentState = chatContext.predictionState;
    const currentParams = chatContext.predictionParams;

    switch (currentState) {
      case 'sports_competition':
        // Find selected competition with better validation
        let selectedCompetition = null;
        const competitionNumber = parseInt(lowerInput);

        if (!isNaN(competitionNumber) && competitionNumber > 0 && competitionNumber <= Math.min(8, sportsCompetitions.length)) {
          selectedCompetition = sportsCompetitions[competitionNumber - 1];
        } else {
          // Try to find by name with fuzzy matching
          selectedCompetition = sportsCompetitions.find(comp =>
            comp.name.toLowerCase().includes(lowerInput) ||
            lowerInput.includes(comp.name.toLowerCase()) ||
            comp.name.toLowerCase().replace(/\s+/g, '').includes(lowerInput.replace(/\s+/g, ''))
          );
        }

        if (selectedCompetition) {
          setLoadingSportsData(true);
          try {
            const matches = await getSportsMatches(selectedCompetition.id);
            setSportsMatches(matches);

            if (matches.length === 0) {
              const noMatchesMessage: KaidoMessage = {
                id: `msg-${messages.length + 2}`,
                role: 'assistant',
                content: `📅 **No Upcoming Matches**\n\n${selectedCompetition.name} doesn't have any upcoming matches available for predictions right now.\n\n🔄 Try selecting another competition or check back later!`,
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, noMatchesMessage]);
              setChatContext({
                creatingPrediction: true,
                predictionState: 'sports_competition',
                predictionParams: currentParams
              });
            } else {
              // Enhanced match display with better formatting
              const matchesList = matches.slice(0, 6).map((match: any, index: number) => {
                const matchDate = new Date(match.scheduled);
                const dateStr = matchDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short'
                });
                const timeStr = matchDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                return `${index + 1}. ⚽ **${match.home.name}** vs **${match.away.name}**\n   📅 ${dateStr} at ${timeStr}`;
              }).join('\n\n');

              const matchesMessage: KaidoMessage = {
                id: `msg-${messages.length + 2}`,
                role: 'assistant',
                content: `🏆 **${selectedCompetition.name}**\n\n${matchesList}\n\n💡 **Select a match:** Type the number (1-${Math.min(6, matches.length)}) to create your prediction!`,
                timestamp: new Date().toISOString()
              };

              setMessages(prev => [...prev, matchesMessage]);
              setChatContext({
                creatingPrediction: true,
                predictionState: 'sports_match',
                predictionParams: {
                  ...currentParams,
                  competitionId: selectedCompetition.id,
                  competitionName: selectedCompetition.name
                }
              });
            }
          } catch (error) {
            console.error('Error fetching matches:', error);
            const errorMessage: KaidoMessage = {
              id: `msg-${messages.length + 2}`,
              role: 'assistant',
              content: '❌ **Failed to Load Matches**\n\nI couldn\'t fetch the matches for this competition. This could be due to:\n• API rate limits\n• Temporary service issues\n\n🔄 Please try again or select a different competition.',
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
          } finally {
            setLoadingSportsData(false);
          }
        } else {
          const availableOptions = sportsCompetitions.slice(0, 8).map((comp: any, index: number) =>
            `${index + 1}. ${comp.name}`
          ).join('\n');

          const invalidMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `❌ **Invalid Selection**\n\nI couldn't find that competition. Please choose from:\n\n${availableOptions}\n\n💡 **Tip:** Just type the number (1-8)!`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, invalidMessage]);
        }
        break;

      case 'sports_match':
        // Find selected match with better validation
        let selectedMatch = null;
        const matchNumber = parseInt(lowerInput);

        if (!isNaN(matchNumber) && matchNumber > 0 && matchNumber <= Math.min(6, sportsMatches.length)) {
          selectedMatch = sportsMatches[matchNumber - 1];
        }

        if (selectedMatch) {
          const matchDate = new Date(selectedMatch.scheduled);
          const dateStr = matchDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const predictionOptionsMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `⚽ **Match Selected**\n\n🏟️ **${selectedMatch.home.name}** vs **${selectedMatch.away.name}**\n📅 ${dateStr}\n\n🎯 **Prediction Types Available:**\n\n1. 🏆 **Match Winner** (Most Popular)\n   • ${selectedMatch.home.name} wins\n   • Draw\n   • ${selectedMatch.away.name} wins\n\n2. 🔧 **Custom Prediction** (Coming Soon)\n\n💡 Type **"1"** to create a Match Winner prediction!`,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, predictionOptionsMessage]);
          setChatContext({
            creatingPrediction: true,
            predictionState: 'sports_prediction_type',
            predictionParams: {
              ...currentParams,
              matchId: selectedMatch.id,
              matchTitle: `${selectedMatch.home.name} vs ${selectedMatch.away.name}`,
              homeTeam: selectedMatch.home.name,
              awayTeam: selectedMatch.away.name,
              scheduledDate: selectedMatch.scheduled
            }
          });
        } else {
          const availableMatches = sportsMatches.slice(0, 6).map((match: any, index: number) =>
            `${index + 1}. ${match.home.name} vs ${match.away.name}`
          ).join('\n');

          const invalidMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `❌ **Invalid Match Selection**\n\nPlease choose from these available matches:\n\n${availableMatches}\n\n💡 **Tip:** Type the number (1-${Math.min(6, sportsMatches.length)})!`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, invalidMessage]);
        }
        break;

      case 'sports_prediction_type':
        if (lowerInput === '1' || lowerInput.includes('winner') || lowerInput.includes('match winner') || lowerInput === 'yes') {
          // Move to stake amount selection
          const stakeMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `💰 **Enter Your Stake Amount**\n\n⚽ ${currentParams.homeTeam} vs ${currentParams.awayTeam}\n🎯 Match Winner Prediction\n\n**Minimum:** 0.01 BNB\n**Recommended:** 0.1 - 1 BNB\n\n💡 **Tip:** Type the amount in BNB (e.g., "0.1" or "1")`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, stakeMessage]);
          setChatContext({
            creatingPrediction: true,
            predictionState: 'sports_stake_amount',
            predictionParams: {
              ...currentParams,
              category: 'sports',
              predictionType: 'match_winner'
            }
          });
        } else {
          const notImplementedMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: '🔧 **Custom Predictions Coming Soon!**\n\nFor now, I can only create Match Winner predictions. These are the most popular type anyway!\n\n💡 Type **"1"** to create a Match Winner prediction, or **"cancel"** to start over.',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, notImplementedMessage]);
        }
        break;

      case 'sports_stake_amount':
        const stakeAmountInput = parseFloat(lowerInput);
        if (isNaN(stakeAmountInput) || stakeAmountInput <= 0) {
          const invalidStakeMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: '❌ **Invalid Amount**\n\nPlease enter a valid number greater than 0.\n\n**Minimum:** 0.01 BNB\n**Recommended:** 0.1 - 1 BNB\n\n💡 Example: Type "0.5" or "1"',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, invalidStakeMessage]);
        } else if (stakeAmountInput < 0.01) {
          const minimumStakeMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: '⚠️ **Minimum Stake Required**\n\nThe minimum stake is **0.01 BNB**.\n\nPlease enter an amount of 0.01 BNB or higher.',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, minimumStakeMessage]);
        } else {
          // Move to prediction choice selection
          const choiceMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `✅ **Stake Amount Confirmed: ${stakeAmountInput} BNB**\n\n🎯 **Which outcome do you predict?**\n\n⚽ ${currentParams.homeTeam} vs ${currentParams.awayTeam}\n\n**Select your prediction:**\n1. 🏠 ${currentParams.homeTeam} wins\n2. 🤝 Draw\n3. ✈️ ${currentParams.awayTeam} wins\n\n💡 **Tip:** Type the number (1, 2, or 3) to select your prediction!`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, choiceMessage]);

          setChatContext({
            creatingPrediction: true,
            predictionState: 'sports_prediction_choice',
            predictionParams: {
              ...currentParams,
              category: 'sports',
              stakeAmount: stakeAmountInput
            }
          });
        }
        break;

      case 'sports_prediction_choice':
        let selectedChoice = '';
        const choiceNumber = parseInt(lowerInput);

        if (choiceNumber === 1 || lowerInput.includes(currentParams.homeTeam?.toLowerCase() || '')) {
          selectedChoice = `${currentParams.homeTeam} wins`;
        } else if (choiceNumber === 2 || lowerInput.includes('draw')) {
          selectedChoice = 'Draw';
        } else if (choiceNumber === 3 || lowerInput.includes(currentParams.awayTeam?.toLowerCase() || '')) {
          selectedChoice = `${currentParams.awayTeam} wins`;
        }

        if (selectedChoice) {
          const confirmationMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `📋 **Prediction Summary**\n\n⚽ **Match:** ${currentParams.homeTeam} vs ${currentParams.awayTeam}\n🎯 **Your Prediction:** ${selectedChoice}\n💰 **Stake:** ${currentParams.stakeAmount} BNB\n🏆 **Competition:** ${currentParams.competitionName}\n\n✅ **Approve the transaction in your wallet to create this prediction!**`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, confirmationMessage]);

          setChatContext({
            creatingPrediction: true,
            predictionState: 'sports_wallet_funding',
            predictionParams: {
              ...currentParams,
              category: 'sports',
              predictionChoice: selectedChoice
            }
          });

          // Trigger wallet funding after a short delay
          setTimeout(() => {
            handleSportsPredictionFunding({
              ...currentParams,
              predictionChoice: selectedChoice
            });
          }, 500);
        } else {
          const invalidChoiceMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `❌ **Invalid Selection**\n\nPlease choose one of the following:\n\n1. 🏠 ${currentParams.homeTeam} wins\n2. 🤝 Draw\n3. ✈️ ${currentParams.awayTeam} wins\n\n💡 **Tip:** Type the number (1, 2, or 3)!`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, invalidChoiceMessage]);
        }
        break;

      case 'sports_wallet_funding':
        // Wallet funding is triggered automatically from sports_prediction_choice
        // This case is here to prevent the default handler from running
        break;

      default:
        // Handle cancel command
        if (lowerInput.includes('cancel') || lowerInput.includes('exit') || lowerInput.includes('stop')) {
          const cancelMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: '❌ **Sports Prediction Cancelled**\n\nNo problem! You can start a new prediction anytime.\n\n💡 **Quick Start:**\n• Type "football" for sports predictions\n• Type "bitcoin" for crypto predictions\n• Or just ask me anything!',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, cancelMessage]);

          // Reset chat context
          setChatContext({
            creatingPrediction: false,
            predictionState: 'idle',
            predictionParams: {}
          });
        } else {
          const defaultMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: '🤔 **I didn\'t understand that**\n\nLet me help you with sports predictions! Here\'s what you can do:\n\n• Type the **number** from the list above\n• Type **"cancel"** to start over\n• Type **"help"** for more options\n\nWhat would you like to do?',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, defaultMessage]);
          setChatContext({
            creatingPrediction: false,
            predictionState: 'idle',
            predictionParams: {}
          });
        }
        break;
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    // Check if wallet is connected before allowing chat
    if (!isConnected) {
      showToast({
        type: 'warning',
        title: 'Wallet Required',
        message: 'Please connect your wallet to use the chat feature'
      });
      return;
    }

    const userMessage: KaidoMessage = {
      id: `msg-${messages.length + 1}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsThinking(true);
    setShowMenu(false);

    // If we're in the middle of creating a prediction, process the user's response
    if (chatContext.creatingPrediction && chatContext.predictionState !== 'idle') {
      try {
        // Handle sports prediction states first
        if (chatContext.predictionParams.category === 'sports') {
          await handleSportsPredictionStep(textToSend);
          setIsThinking(false);
          return;
        }

        // Process the user's response based on the current state (for crypto predictions)
        const { nextState, updatedParams, validResponse, responseMessage } = await processPredictionStep(
          textToSend,
          chatContext.predictionState,
          chatContext.predictionParams
        );

        // Update the chat context with the new state and parameters
        setChatContext({
          creatingPrediction: nextState !== 'idle',
          predictionState: nextState,
          predictionParams: updatedParams
        });

        // Add the AI response to the chat
        if (responseMessage) {
          const aiResponse: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: responseMessage,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, aiResponse]);
        }

        // If we've reached the payment state, trigger the wallet transaction
        if (nextState === 'payment') {
          console.log('[EMBEDDED CHAT] Payment state reached! Preparing to trigger wallet...');
          // Convert the chat prediction params to the format expected by the payment flow
          const paymentData = {
            asset: updatedParams.asset || 'BNB',
            type: updatedParams.type === 'multi-choice' ? 'multi-choice' : 'binary',
            targetPrice: updatedParams.targetPrice || '',
            priceRanges: updatedParams.priceRanges || [],
            expiryDate: updatedParams.expiryDate || '',
            duration: updatedParams.duration || undefined,
            stakeAmount: updatedParams.stakeAmount || 1,
            stakeToken: updatedParams.stakeToken || 'BNB'
          };

          console.log('[EMBEDDED CHAT] Payment data prepared:', paymentData);

          // Trigger the payment flow after a short delay to let the message render
          setTimeout(() => {
            console.log('[EMBEDDED CHAT] Calling handleSubmitPrediction...');
            handleSubmitPrediction(paymentData);
          }, 500);
        }
      } catch (error) {
        console.error('Error processing prediction step:', error);

        // Add error message to chat
        const errorMessage: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: 'I had trouble processing your response. Let me ask a different way: what target price would you like to set?',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, errorMessage]);
        setIsThinking(false);
        return;
      }

      setIsThinking(false);
      return;
    }

    // Check for simple greetings first - including when followed by "kaido", "there", etc.
    const isSimpleGreeting = /^(hi|hello|hey|sup|yo|what's up|greetings)(\s+(there|kaido|kaidoai|ai))?[.!?]?$/i.test(textToSend.trim());

    if (isSimpleGreeting) {
      // For simple greetings, just use the local response generator
      const greetingResponse: KaidoMessage = {
        id: `msg-${messages.length + 2}`,
        role: 'assistant',
        content: "Hi there! 👋 KAIDO here - your AI prediction market wizard on BNB Smart Chain! I run this whole DApp myself - no middlemen, just pure blockchain magic. What can I help you with today?\n\n⚽ **Football Predictions** - Create markets for Premier League, La Liga, Champions League, and more!\n₿ **Crypto Predictions** - Set up price predictions for BNB, BTC, ETH, and other tokens!\n\nJust tell me what you'd like to predict and I'll help you set it up in seconds! 🔮💰",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, greetingResponse]);
      setIsThinking(false);
      return;
    }

    // Check for sports prediction intent FIRST (before crypto detection)
    const lowerInput = textToSend.toLowerCase();
    const sportsIntent = detectSportsPredictionIntent(textToSend);
    if (sportsIntent.hasSportsIntent) {
      // Check if user is asking for non-football sports (basketball, NBA, etc.)
      const nonFootballKeywords = ['basketball', 'nba', 'baseball', 'mlb', 'hockey', 'nhl', 'tennis', 'cricket', 'rugby'];
      const isNonFootball = nonFootballKeywords.some(keyword => lowerInput.includes(keyword));

      if (isNonFootball) {
        const notAvailableMessage: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: `⚽ **Football/Soccer Only (For Now!)**\n\nCurrently, I only support **football/soccer** predictions from major leagues worldwide. Other sports like basketball, baseball, etc. are coming soon!\n\n🏆 **Available Football Leagues:**\n• Premier League (England)\n• La Liga (Spain)\n• Bundesliga (Germany)\n• Serie A (Italy)\n• Champions League\n• Ligue 1 (France)\n• And many more!\n\n💡 **Want to create a football prediction?** Type **"football"** or **"soccer"** to get started!`,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, notAvailableMessage]);
        setIsThinking(false);
        return;
      }

      // Start sports prediction flow (football only) - directly load competitions
      setLoadingSportsData(true);
      try {
        const competitions = await getSportsCompetitions();
        setSportsCompetitions(competitions);

        // Create a more visual competition list with emojis and better formatting
        const topCompetitions = competitions.slice(0, 8);
        const competitionsList = topCompetitions.map((comp: any, index: number) => {
          const flag = comp.country.name === 'England' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿' :
                      comp.country.name === 'Spain' ? '🇪🇸' :
                      comp.country.name === 'Germany' ? '🇩🇪' :
                      comp.country.name === 'Italy' ? '🇮🇹' :
                      comp.country.name === 'France' ? '🇫🇷' : '⚽';
          return `${index + 1}. ${flag} ${comp.name}`;
        }).join('\n');

        const competitionsMessage: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: `⚽ **Football Predictions Available!**\n\nI can help you create predictions for football/soccer matches from major leagues worldwide!\n\n🏆 **Available Competitions:**\n\n${competitionsList}\n\n💡 **Quick tip:** Just type the number (1-8) to select a competition!`,
          timestamp: new Date().toISOString(),
          isHtml: true
        };

        setMessages(prev => [...prev, competitionsMessage]);
        setChatContext({
          creatingPrediction: true,
          predictionState: 'sports_competition',
          predictionParams: {
            category: 'sports'
          }
        });
      } catch (error) {
        console.error('Error fetching competitions:', error);
        const errorMessage: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: '❌ **Connection Error**\n\nI couldn\'t load the competitions right now. This might be because:\n• The sports API is temporarily unavailable\n• Network connection issues\n\n🔄 Please try again in a moment!',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoadingSportsData(false);
      }
      setIsThinking(false);
      return;
    }

    // Check for crypto prediction intent (before general prediction detection)
    const cryptoIntent = detectCryptoPredictionIntent(textToSend);
    if (cryptoIntent.hasCryptoIntent) {
      // Start crypto prediction flow
      const initialState: PredictionCreationState = cryptoIntent.asset ? 'type_selection' : 'asset_selection';

      const initialParams: ChatPredictionParams = {
        asset: cryptoIntent.asset,
        category: 'crypto'
      };

      setChatContext({
        creatingPrediction: true,
        predictionState: initialState,
        predictionParams: initialParams
      });

      // Generate the appropriate prompt based on the initial state
      try {
        const promptMessage = await generatePredictionFlowPrompt(initialState, initialParams);

        const aiResponse: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: promptMessage,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsThinking(false);
        return;
      } catch (error) {
        console.error('Error generating crypto prediction prompt:', error);

        const fallbackResponse: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: `Let's create a crypto prediction! ${initialParams.asset ? `${initialParams.asset} it is!` : 'Which crypto asset would you like to predict?'}`,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, fallbackResponse]);
        setIsThinking(false);
        return;
      }
    }

    // Check if the message is about creating a prediction (legacy detection)
    const predictionIntent = detectPredictionIntent(textToSend);

    if (predictionIntent.hasPredictionIntent) {
      // Start the step-by-step prediction flow
      const initialState: PredictionCreationState = predictionIntent.asset ? 'type_selection' : 'asset_selection';

      // Initialize the prediction parameters
      const initialParams: ChatPredictionParams = {
        asset: predictionIntent.asset,
        type: predictionIntent.type
      };

      // Update the chat context
      setChatContext({
        creatingPrediction: true,
        predictionState: initialState,
        predictionParams: initialParams
      });

      // Generate the appropriate prompt based on the initial state
      try {
        const promptMessage = await generatePredictionFlowPrompt(initialState, initialParams);

        // Add the AI response to the chat
        const aiResponse: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: promptMessage,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsThinking(false);
        return;
      } catch (error) {
        console.error('Error generating prediction prompt:', error);

        // Fallback to a generic message
        const fallbackResponse: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: `Let's create a prediction for ${initialParams.asset || 'crypto'}. What would you like to predict?`,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, fallbackResponse]);
        setIsThinking(false);
        return;
      }
    }

    // Check if the message is asking about crypto prices
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'DOGE', 'XRP', 'DOT', 'AVAX', 'LINK', 'MATIC', 'LTC', 'UNI', 'AAVE', 'SHIB', 'ATOM', 'FIL', 'NEAR', 'APE', 'PEPE'];

    const isPriceQuery = lowerInput.includes('price') ||
                         lowerInput.includes('worth') ||
                         lowerInput.includes('value') ||
                         lowerInput.includes('cost') ||
                         lowerInput.includes('how much') ||
                         (lowerInput.includes('what') && lowerInput.includes('current')) ||
                         (lowerInput.includes('what') && lowerInput.includes('is') &&
                          cryptoSymbols.some(symbol =>
                            lowerInput.includes(symbol.toLowerCase()) ||
                            (symbol === 'BTC' && lowerInput.includes('bitcoin')) ||
                            (symbol === 'ETH' && lowerInput.includes('ethereum')) ||
                            (symbol === 'BNB' && lowerInput.includes('binance')) ||
                            (symbol === 'LTC' && lowerInput.includes('litecoin')) ||
                            (symbol === 'XRP' && lowerInput.includes('ripple')) ||
                            (symbol === 'DOGE' && lowerInput.includes('dogecoin'))
                          ));

    let cryptoSymbol = '';
    if (isPriceQuery) {
      if (lowerInput.includes('bitcoin') || lowerInput.includes('btc')) cryptoSymbol = 'BTC';
      else if (lowerInput.includes('ethereum') || lowerInput.includes('eth')) cryptoSymbol = 'ETH';
      else if (lowerInput.includes('binance') || lowerInput.includes('bnb')) cryptoSymbol = 'BNB';
      else if (lowerInput.includes('cardano') || lowerInput.includes('ada')) cryptoSymbol = 'ADA';
      else if (lowerInput.includes('dogecoin') || lowerInput.includes('doge')) cryptoSymbol = 'DOGE';
      else if (lowerInput.includes('ripple') || lowerInput.includes('xrp')) cryptoSymbol = 'XRP';
      else if (lowerInput.includes('polkadot') || lowerInput.includes('dot')) cryptoSymbol = 'DOT';
      else if (lowerInput.includes('avalanche') || lowerInput.includes('avax')) cryptoSymbol = 'AVAX';
      else if (lowerInput.includes('chainlink') || lowerInput.includes('link')) cryptoSymbol = 'LINK';
      else if (lowerInput.includes('polygon') || lowerInput.includes('matic')) cryptoSymbol = 'MATIC';
      else if (lowerInput.includes('litecoin') || lowerInput.includes('ltc')) cryptoSymbol = 'LTC';
      else if (lowerInput.includes('uniswap') || lowerInput.includes('uni')) cryptoSymbol = 'UNI';
      else if (lowerInput.includes('aave')) cryptoSymbol = 'AAVE';
      else if (lowerInput.includes('shiba') || lowerInput.includes('shib')) cryptoSymbol = 'SHIB';
      else if (lowerInput.includes('cosmos') || lowerInput.includes('atom')) cryptoSymbol = 'ATOM';
      else if (lowerInput.includes('filecoin') || lowerInput.includes('fil')) cryptoSymbol = 'FIL';
      else if (lowerInput.includes('near')) cryptoSymbol = 'NEAR';
      else if (lowerInput.includes('apecoin') || lowerInput.includes('ape')) cryptoSymbol = 'APE';
      else if (lowerInput.includes('pepe')) cryptoSymbol = 'PEPE';
    }

    try {
      // If it's a price query and we identified a crypto symbol, get the price info
      if (isPriceQuery && cryptoSymbol) {
        const priceInfo = await getCryptoPriceInfo(cryptoSymbol);

        const priceMessage: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: priceInfo + "\n\nWould you like to create a prediction about " + cryptoSymbol + "?",
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, priceMessage]);
        setIsThinking(false);
        return;
      }

      // Otherwise, send the message to the AI service
      const aiResponse = await sendChatMessage(textToSend);
      setMessages(prev => [...prev, aiResponse]);

      // Check if the AI response suggests creating a prediction
      const aiResponseIntent = detectPredictionIntent(aiResponse.content);

      // Only proceed with follow-up if the AI response contains a prediction intent
      const needsFollowUp = aiResponseIntent.hasPredictionIntent &&
                           !aiResponse.content.includes("Binary (Yes/No)") &&
                           !aiResponse.content.includes("Multi-choice") &&
                           !aiResponse.content.includes("price range");

      if (needsFollowUp) {
        // Start the step-by-step prediction flow based on the AI's suggestion
        const initialState: PredictionCreationState = aiResponseIntent.asset ? 'type_selection' : 'asset_selection';

        // Initialize the prediction parameters
        const initialParams: ChatPredictionParams = {
          asset: aiResponseIntent.asset,
          type: aiResponseIntent.type
        };

        // Update the chat context
        setChatContext({
          creatingPrediction: true,
          predictionState: initialState,
          predictionParams: initialParams
        });

        // Add a follow-up message to start the flow
        try {
          const promptContent = await generatePredictionFlowPrompt(initialState, initialParams);

          const followupMessage: KaidoMessage = {
            id: `msg-${messages.length + 3}`,
            role: 'assistant',
            content: promptContent,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, followupMessage]);
        } catch (error) {
          console.error('Error generating prediction prompt:', error);

          // Fallback to a generic message
          const fallbackMessage: KaidoMessage = {
            id: `msg-${messages.length + 3}`,
            role: 'assistant',
            content: `Let's create a prediction for ${initialParams.asset || 'crypto'}. What would you like to predict?`,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, fallbackMessage]);
        }
      } else if (aiResponseIntent.hasPredictionIntent) {
        // If there's a prediction intent but we don't need a follow-up,
        // still update the chat context so we can handle user responses properly
        const initialState: PredictionCreationState = aiResponseIntent.asset ? 'type_selection' : 'asset_selection';

        setChatContext({
          creatingPrediction: true,
          predictionState: initialState,
          predictionParams: {
            asset: aiResponseIntent.asset,
            type: aiResponseIntent.type
          }
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Fallback to local response generation
      const fallbackResponse: KaidoMessage = {
        id: `msg-${messages.length + 2}`,
        role: 'assistant',
        content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRestartChat = () => {
    setMessages([]);
    setInput('');
    setShowMenu(true);
    setChatContext({
      creatingPrediction: false,
      predictionState: 'idle',
      predictionParams: {}
    });
    // Clear chat history from localStorage
    localStorage.removeItem(EMBEDDED_CHAT_HISTORY_KEY);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden relative" data-glow-color="#F3BA2F">
      {/* Enhanced Background with multiple layers */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient - rich dark with burgundy undertones */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>

        {/* Subtle diagonal pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
        }}></div>

        {/* Decorative corner accent - top left */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>

        {/* Decorative corner accent - bottom right */}
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }}></div>

        {/* Border accent */}
        <div className="absolute inset-0 border border-yellow-500/20 rounded-lg"></div>
      </div>

      <CardContent ref={chatContentRef} className="flex-grow overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 chat-content max-h-[calc(100%-60px)] relative z-10">
        {showMenu && messages.length === 0 ? (
          <div className="flex flex-col space-y-2 sm:space-y-4 h-full justify-center px-1 sm:px-2">
            <div className="text-left">
              <h2 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 mb-2 sm:mb-4">
                Hi There 👋
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-4 leading-relaxed">KAIDO here - your AI prediction market wizard on BNB Smart Chain! I handle everything here from prediction markets creation & settlements to rewards. What would you like to predict today?</p>
              <div className="space-y-1 sm:space-y-2 text-left bg-gradient-to-br from-amber-950/30 to-orange-950/20 border border-yellow-500/20 rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-white/70 font-semibold mb-1 sm:mb-2">Try these examples:</p>
                <ul className="text-[10px] sm:text-xs text-white/70 space-y-1 sm:space-y-1.5">
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-1 sm:mr-2 flex-shrink-0">₿</span>
                    <span><span className="text-yellow-300 font-medium">BNB price</span> — "Will BNB reach $1550 this week?"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-1 sm:mr-2 flex-shrink-0">⚽</span>
                    <span><span className="text-yellow-300 font-medium">Premier League matches</span> — "Create prediction for Man City vs Arsenal"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-1 sm:mr-2 flex-shrink-0">⚽</span>
                    <span><span className="text-yellow-300 font-medium">La Liga matches</span> — "Real Madrid vs Barcelona prediction"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-1 sm:mr-2 flex-shrink-0">💰</span>
                    <span><span className="text-yellow-300 font-medium">Bitcoin price</span> — "BTC above $100k by year end?"</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2 sm:p-3 text-xs sm:text-sm backdrop-blur-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 border border-yellow-500/40 ml-2 sm:ml-4 shadow-lg shadow-yellow-500/10'
                      : 'bg-gradient-to-br from-amber-950/40 to-orange-950/30 border border-yellow-500/20 mr-2 sm:mr-4 shadow-lg shadow-orange-500/5'
                  }`}
                >
                  <div className="flex items-center mb-0.5 sm:mb-1">
                    {message.role === 'assistant' && (
                      <Avatar
                        src="/kaido.png"
                        alt="Kaido"
                        size="xs"
                        className="mr-1 sm:mr-2"
                      />
                    )}
                    <span className="text-[10px] sm:text-xs text-white/60">
                      {message.role === 'user' ? 'You' : 'KAIDO'} • {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  {message.role === 'assistant' && message.content.includes('<price-range') ? (
                    <div className="text-white font-medium text-xs sm:text-sm leading-relaxed">
                      {/* Extract and display the text before price ranges, removing the raw HTML tags */}
                      {message.content.split('<price-range')[0]}
                      {/* Hide the raw price-range tags - they're just for parsing */}
                    </div>
                  ) : (
                    <>
                      <p className="text-white font-medium whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                        {message.content}
                      </p>

                      {/* Render interactive buttons for assistant messages */}
                      {message.role === 'assistant' && (() => {
                        const { buttons } = parseMessageButtons(message.content);
                        if (buttons.length > 0) {
                          return (
                            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                              {buttons.map((button, index) => (
                                <button
                                  key={`${message.id}-btn-${index}`}
                                  onClick={() => {
                                    // Directly send the action as a message
                                    handleSendMessage(button.action);
                                  }}
                                  className={`
                                    px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all
                                    ${button.type === 'cta'
                                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-md hover:shadow-lg'
                                      : button.type === 'numbered'
                                      ? 'bg-amber-900/60 hover:bg-amber-800/60 text-white border border-yellow-500/40'
                                      : 'bg-amber-950/50 hover:bg-amber-900/50 text-white/90 border border-yellow-500/30'
                                    }
                                  `}
                                >
                                  {button.type === 'numbered' && `${button.action}. `}
                                  {button.text}
                                </button>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-amber-950/40 to-orange-950/30 border border-yellow-500/20 rounded-lg p-3 max-w-[85%] mr-4 shadow-lg shadow-orange-500/5 backdrop-blur-sm">
                  <div className="flex items-center mb-1">
                    <Avatar
                      src="/kaido.png"
                      alt="Kaido"
                      size="xs"
                      className="mr-2"
                    />
                    <span className="text-xs text-white/60">
                      KAIDO • {formatTimestamp(new Date().toISOString())}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <CardFooter className="border-t border-yellow-500/15 py-2 sm:py-3 chat-footer bg-gradient-to-r from-amber-950/30 to-orange-950/20 relative z-10">
        <div className="flex items-center w-full gap-1.5 sm:gap-2">
          <div className="flex-grow relative">
            <Input
              placeholder="Ask KAIDO..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-xs sm:text-sm bg-gradient-to-r from-amber-950/40 to-orange-950/30 border border-yellow-500/30 hover:border-yellow-500/50 focus:border-yellow-500/70 text-white placeholder-white/50 backdrop-blur-sm py-1.5 sm:py-2"
              disabled={isThinking || showPredictionFlow}
            />
          </div>

          <Button
            variant="tertiary"
            size="sm"
            className="text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 flex-shrink-0 shadow-lg shadow-yellow-500/30 transition-all hover:shadow-yellow-500/50 px-2 sm:px-3 py-1.5 sm:py-2"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isThinking || showPredictionFlow}
          >
            {isThinking ? (
              <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>

        {messages.length > 0 && (
          <div className="mt-1.5 sm:mt-2 flex gap-1 flex-wrap">
            <button
              type="button"
              className="text-[10px] sm:text-xs bg-gradient-to-r from-red-600/80 to-red-700/70 hover:from-red-500 hover:to-red-600 text-white hover:text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 border-2 border-red-500/60 hover:border-red-400 backdrop-blur-sm font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 active:scale-95 hover:scale-105"
              onClick={handleRestartChat}
              aria-label="Clear chat history"
              title="Clear all chat messages and start fresh"
            >
              🗑️ Clear Chat
            </button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default EmbeddedChatWidget;

