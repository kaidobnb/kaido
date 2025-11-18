import React, { useState, useRef, useEffect } from 'react';
import { Send, CloudLightning as Lightning, Plus, X, MessageCircle, Home, MessageSquare, HelpCircle, BookOpen, DollarSign, Wallet, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KaidoMessage } from '../../types';
import { PredictionCreationState, ChatPredictionParams, ChatContext } from '../../types/chat';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card, { CardHeader, CardContent, CardFooter } from '../ui/Card';
import PredictionCreationFlow, { PredictionData } from './PredictionCreationFlow';
import ChatPredictionFlow from './ChatPredictionFlow';
import PriceRangeSelector from './PriceRangeSelector';
import { useWallet, refreshWalletBalances } from '../../contexts/WalletContext';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useToast } from '../../hooks/useToast';
import { useNavigation } from '../../hooks/useNavigation';
import {
  sendChatMessage,
  detectPredictionIntent,
  getCryptoPriceInfo,
  processPredictionStep,
  generatePredictionFlowPrompt,
  detectSportsPredictionIntent,
  detectCryptoPredictionIntent,
  getSportsCompetitions,
  getSportsMatches
} from '../../services/chatService';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { createPrediction, createChatSportsPrediction } from '../../services/api';
import { createBnbTransaction, createKaidoTransaction, checkTransactionStatus, ADMIN_WALLET_ADDRESS } from '../../utils/transactionUtils';
import { useCreatePrediction } from '../../hooks/useContracts';

// Local storage key for chat history
const CHAT_HISTORY_KEY = 'kaido_chat_history';

// Function to load chat history from localStorage
const loadChatHistory = (): KaidoMessage[] => {
  try {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [];
};

// Function to save chat history to localStorage
const saveChatHistory = (messages: KaidoMessage[]) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
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

const KaidoChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<KaidoMessage[]>(loadChatHistory());
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'messages'>('home');
  const [showPredictionFlow, setShowPredictionFlow] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [predictionContext, setPredictionContext] = useState<{
    asset?: string;
    type?: 'binary' | 'multi-choice';
  }>({});

  // Price range selector state
  const [showPriceRangeSelector, setShowPriceRangeSelector] = useState(false);
  const [priceRanges, setPriceRanges] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [userStakeRange, setUserStakeRange] = useState<string | null>(null);

  // Chat prediction flow state
  const [chatContext, setChatContext] = useState<ChatContext>({
    creatingPrediction: false,
    predictionState: 'idle',
    predictionParams: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sports prediction state
  const [sportsCompetitions, setSportsCompetitions] = useState<any[]>([]);
  const [sportsMatches, setSportsMatches] = useState<any[]>([]);
  const [loadingSportsData, setLoadingSportsData] = useState(false);

  // Get wallet, userProfile and connection from contexts
  const { wallet, userProfile } = useWallet();
  const { address, isConnected } = useAccount();
  const { address: appkitAddress } = useAppKitAccount();
  const { sendTransaction, isPending: isSendingTransaction, error: sendTransactionError } = useSendTransaction();
  const { showToast } = useToast();
  const { navigateTo } = useNavigation();

  // On-chain contract hooks
  const { createPrediction: createOnChainPrediction, isPending: isCreatingOnChain, error: createError } = useCreatePrediction();

  // Admin wallet address is imported from transactionUtils

  // Scroll to bottom when messages change or chat is opened
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  // Auto-collapse chat after period of inactivity
  useEffect(() => {
    if (!isThinking && isExpanded) {
      const inactivityTimer = setTimeout(() => {
        setIsExpanded(false);
      }, 30000); // 30 seconds of inactivity

      return () => clearTimeout(inactivityTimer);
    }
  }, [isThinking, isExpanded, messages]);

  // Add event listener for 'kaido:open' event to open the chat widget
  useEffect(() => {
    const handleKaidoOpen = () => {
      if (!isOpen) {
        toggleChat();
      }
    };

    document.addEventListener('kaido:open', handleKaidoOpen);

    return () => {
      document.removeEventListener('kaido:open', handleKaidoOpen);
    };
  }, [isOpen]);

  // Periodically update wallet balance when chat is open
  useEffect(() => {
    if (!isOpen || !wallet.connected) return;

    // Update balance immediately
    const updateBalance = async () => {
      if (!address) return;

      try {
        // Balance updates are handled by wagmi hooks automatically
        console.log('Balance update triggered for address:', address);
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    };

    // Call once immediately
    updateBalance();

    // Then set up interval
    const intervalId = setInterval(updateBalance, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);
  }, [isOpen, wallet.connected, address]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle sports prediction wallet funding and creation
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
      const transaction = await createBnbTransaction(address as Address, params.stakeAmount);

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
          content: `🎉 **Prediction Created Successfully!**\n\n✅ **"${predictionData.title}"** is now live!\n\n📊 **Prediction Details:**\n• 🎯 Type: Match Winner\n• 🔮 Your Prediction: ${params.predictionChoice}\n• 💰 Your Stake: ${params.stakeAmount} BNB\n• ⏰ Closes 30 minutes before kickoff\n\n🚀 **What's Next?**\n• Other users can now participate\n• Winners share the prize pool\n• Results auto-resolve after the match\n\nGood luck with your prediction! 🏆`,
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
          content: `❌ **Creation Failed**\n\n${response.message || 'Unable to create sports prediction'}\n\n🔍 **Note:** Your transaction was successful, but the prediction creation failed. Please contact support.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error('Error in sports prediction funding:', error);

      let errorContent = '❌ **Transaction Failed**\n\n';
      if (error.message?.includes('User rejected')) {
        errorContent += 'You rejected the transaction in your wallet.\n\n💡 Try again when you\'re ready!';
      } else if (error.message?.includes('insufficient')) {
        errorContent += 'Insufficient balance for this transaction.\n\n💡 Check your wallet balance and try again.';
      } else {
        errorContent += `${error.message || 'An unexpected error occurred'}\n\n🔄 Please try again or contact support.`;
      }

      const errorMessage: KaidoMessage = {
        id: `msg-${messages.length + 3}`,
        role: 'assistant',
        content: errorContent,
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
                  category: 'sports',
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
              category: 'sports',
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
        // Parse stake amount
        const stakeAmount = parseFloat(lowerInput);

        if (isNaN(stakeAmount) || stakeAmount <= 0) {
          const invalidAmountMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `❌ **Invalid Amount**\n\nPlease enter a valid number greater than 0.\n\n**Minimum:** 0.01 BNB\n**Recommended:** 0.1 - 1 BNB\n\n💡 **Example:** Type "0.5" for 0.5 BNB`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, invalidAmountMessage]);
        } else if (stakeAmount < 0.01) {
          const minimumMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `⚠️ **Below Minimum**\n\nThe minimum stake is **0.01 BNB**.\n\nYou entered: ${stakeAmount} BNB\n\n💡 Please enter at least 0.01 BNB`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, minimumMessage]);
        } else {
          // Move to prediction choice selection
          const choiceMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `✅ **Stake Amount Confirmed: ${stakeAmount} BNB**\n\n🎯 **Which outcome do you predict?**\n\n⚽ ${currentParams.homeTeam} vs ${currentParams.awayTeam}\n\n**Select your prediction:**\n1. 🏠 ${currentParams.homeTeam} wins\n2. 🤝 Draw\n3. ✈️ ${currentParams.awayTeam} wins\n\n💡 **Tip:** Type the number (1, 2, or 3) to select your prediction!`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, choiceMessage]);

          setChatContext({
            creatingPrediction: true,
            predictionState: 'sports_prediction_choice',
            predictionParams: {
              ...currentParams,
              category: 'sports',
              stakeAmount: stakeAmount
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
          // Check wallet connection and balance before proceeding
          if (!address || !isConnected) {
            const walletMessage: KaidoMessage = {
              id: `msg-${messages.length + 2}`,
              role: 'assistant',
              content: `🔗 **Connect Your Wallet**\n\nTo create a sports prediction with a stake of ${currentParams.stakeAmount} BNB, you need to connect your wallet first.\n\n💡 **Next Step:** Click the wallet icon in the top-right corner to connect!`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, walletMessage]);
          } else {
            // Check balance
            const bnbBalance = wallet?.balance?.bnb || 0;
            if (bnbBalance < currentParams.stakeAmount) {
              const insufficientMessage: KaidoMessage = {
                id: `msg-${messages.length + 2}`,
                role: 'assistant',
                content: `💰 **Insufficient Balance**\n\nYou need ${currentParams.stakeAmount} BNB but only have ${bnbBalance.toFixed(4)} BNB.\n\n**Options:**\n• Go back and enter a smaller amount\n• Add more BNB to your wallet\n• Type "cancel" to exit`,
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, insufficientMessage]);
            } else {
              // Show summary and proceed to wallet funding
              const confirmationMessage: KaidoMessage = {
                id: `msg-${messages.length + 2}`,
                role: 'assistant',
                content: `📋 **Prediction Summary**\n\n⚽ **Match:** ${currentParams.homeTeam} vs ${currentParams.awayTeam}\n🎯 **Your Prediction:** ${selectedChoice}\n💰 **Stake:** ${currentParams.stakeAmount} BNB\n🏆 **Competition:** ${currentParams.competitionName}\n\n✅ **Approve the transaction in your wallet to create this prediction!**`,
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, confirmationMessage]);

              const updatedParams = {
                ...currentParams,
                category: 'sports',
                predictionChoice: selectedChoice
              };

              setChatContext({
                creatingPrediction: true,
                predictionState: 'sports_wallet_funding',
                predictionParams: updatedParams
              });

              // Trigger wallet funding after a short delay
              setTimeout(() => {
                handleSportsPredictionFunding(updatedParams);
              }, 500);
            }
          }
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

    const userMessage: KaidoMessage = {
      id: `msg-${messages.length + 1}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsThinking(true);

    // Automatically expand the chat when user sends a message
    setIsExpanded(true);

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

        console.log('Prediction step processed:', {
          currentState: chatContext.predictionState,
          nextState,
          validResponse,
          responseMessage
        });

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

      // If we've reached the payment state, show the payment UI
      if (chatContext.predictionState === 'payment') {
        // Convert the chat prediction params to the format expected by the payment flow
        const paymentData: PredictionData = {
          asset: chatContext.predictionParams.asset || 'BNB',
          type: chatContext.predictionParams.type === 'multi-choice' ? 'multi-choice' : 'binary',
          targetPrice: chatContext.predictionParams.targetPrice || '',
          priceRanges: chatContext.predictionParams.priceRanges || [],
          expiryDate: chatContext.predictionParams.expiryDate || '',
          duration: chatContext.predictionParams.duration || undefined,
          stakeAmount: chatContext.predictionParams.stakeAmount || 1,
          stakeToken: chatContext.predictionParams.stakeToken || 'BNB'
        };

        // Trigger the payment flow
        setTimeout(() => {
          handleSubmitPrediction(paymentData);
        }, 1000);
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

    // We already handled simple greetings above, so we don't need to check again
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
      else if (lowerInput.includes('binance') || lowerInput.includes('bnb')) cryptoSymbol = 'BNB';
    }

    // Check if this is an affirmative response to a previous price query
    // Include all variations of "yes" including informal ones like "Yea", "Yh", "Ye"
    const isAffirmativeResponse = /^(yes|yeah|yep|sure|ok|okay|yup|y|yea|yh|ye|let'?s do it|i will|i'?ll do it|let'?s go|yes i will|sounds good|go ahead|proceed|continue)(\s+.*)?$/i.test(textToSend.trim());

    // Check if the last message was a price query
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const wasLastMessagePriceQuery = lastMessage &&
                                    lastMessage.role === 'assistant' &&
                                    (lastMessage.content.includes("Would you like to create a prediction about") ||
                                     lastMessage.content.includes("Current") &&
                                     lastMessage.content.includes("price:") &&
                                     lastMessage.content.includes("Would you like to create a prediction"));

    // Extract the asset from the last message if it was a price query
    let lastQueryAsset = '';
    if (wasLastMessagePriceQuery) {
      // Try different regex patterns to extract the asset
      let assetMatch = lastMessage.content.match(/create a prediction about (\w+)\?/i);

      // If that doesn't work, try another pattern
      if (!assetMatch || !assetMatch[1]) {
        assetMatch = lastMessage.content.match(/Current (\w+) price:/i);
      }

      if (assetMatch && assetMatch[1]) {
        lastQueryAsset = assetMatch[1];
      }
    }

    // If this is an affirmative response to a price query, start the prediction flow for that asset
    if (isAffirmativeResponse && wasLastMessagePriceQuery && lastQueryAsset) {
      // Start the prediction flow for the asset from the previous query
      setChatContext({
        creatingPrediction: true,
        predictionState: 'type_selection',
        predictionParams: {
          asset: lastQueryAsset
        }
      });

      // Generate the appropriate prompt for type selection
      try {
        const promptMessage = await generatePredictionFlowPrompt('type_selection', { asset: lastQueryAsset });

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
          content: `Let's create a prediction for ${lastQueryAsset}. Would you like to create a binary (yes/no) prediction or a multi-choice prediction?`,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, fallbackResponse]);
        setIsThinking(false);
        return;
      }
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
      // Skip API call for simple greetings (we already handled them above)
      if (!isSimpleGreeting) {
        // Only make API call for non-greeting messages
        const aiResponse = await sendChatMessage(textToSend);
        setMessages(prev => [...prev, aiResponse]);

        // Check if the AI response suggests creating a prediction
        const aiResponseIntent = detectPredictionIntent(aiResponse.content);

        // Only proceed with follow-up if the AI response contains a prediction intent
        // AND doesn't already contain specific instructions about prediction type
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
      }
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Fallback to local response generation
      const fallbackResponse = generateAIResponse(input);
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  const generateAIResponse = (userInput: string): KaidoMessage => {
    const lowerInput = userInput.toLowerCase().trim();
    let responseContent = '';
    let shouldTriggerPredictionFlow = false;
    let asset: string | undefined;
    let predictionType: 'binary' | 'multi-choice' | undefined;

    // We handle simple greetings in the main handleSendMessage function now
    // This is just a fallback in case something goes wrong

    // Check if this is a greeting message that somehow made it here
    if (/^(hi|hello|hey|sup|yo|what's up|greetings)(\s+(there|kaido|kaidoai|ai))?[.!?]?$/i.test(lowerInput)) {
      return {
        id: `msg-${messages.length + 2}`,
        role: 'assistant',
        content: "Hi there! 👋 KAIDO here - your AI prediction market wizard on BNB Smart Chain! I run this whole DApp myself - no middlemen, just pure blockchain magic. What can I help you with today?\n\n⚽ **Football Predictions** - Create markets for Premier League, La Liga, Champions League, and more!\n₿ **Crypto Predictions** - Set up price predictions for BNB, BTC, ETH, and other tokens!\n\nJust tell me what you'd like to predict and I'll help you set it up in seconds! 🔮💰",
        timestamp: new Date().toISOString()
      };
    }

    // Check for direct prediction creation commands
    if (lowerInput.includes('start prediction') ||
        lowerInput.includes('launch prediction') ||
        lowerInput.includes('open prediction flow')) {

      // Determine if we have enough context to start the flow directly
      if (lowerInput.includes('bitcoin') || lowerInput.includes('btc')) {
        asset = 'BTC';
      } else if (lowerInput.includes('ethereum') || lowerInput.includes('eth')) {
        asset = 'ETH';
      } else if (lowerInput.includes('binance') || lowerInput.includes('bnb')) {
        asset = 'BNB';
      } else if (lowerInput.includes('litecoin') || lowerInput.includes('ltc')) {
        asset = 'LTC';
      }

      if (lowerInput.includes('binary') || lowerInput.includes('yes/no')) {
        predictionType = 'binary';
      } else if (lowerInput.includes('multi') || lowerInput.includes('range')) {
        predictionType = 'multi-choice';
      }

      // If we have enough context, trigger the flow directly
      if (asset || predictionType) {
        shouldTriggerPredictionFlow = true;
        responseContent = `I'll help you create a ${predictionType || ''} prediction for ${asset || 'crypto'}. Opening the prediction creation flow now...`;
      }
    }
    // Regular chat flow
    else if (lowerInput.includes('create') || lowerInput.includes('make')) {
      if (lowerInput.includes('bitcoin') || lowerInput.includes('btc')) {
        asset = 'BTC';
        responseContent = 'I can help you create a Bitcoin price prediction. Please select the type of prediction:\n\n**1. Binary prediction** (Yes/No): Will BTC reach a specific price?\n**2. Multi-choice prediction**: What price range will BTC be in?\n\nOr click the button below to start creating your prediction right away.';
        shouldTriggerPredictionFlow = true;
      } else if (lowerInput.includes('ethereum') || lowerInput.includes('eth')) {
        asset = 'ETH';
        responseContent = 'I can help you create an Ethereum price prediction. Please select the type of prediction:\n\n**1. Binary prediction** (Yes/No): Will ETH reach a specific price?\n**2. Multi-choice prediction**: What price range will ETH be in?\n\nOr click the button below to start creating your prediction right away.';
        shouldTriggerPredictionFlow = true;
      } else if (lowerInput.includes('binance') || lowerInput.includes('bnb')) {
        asset = 'BNB';
        responseContent = 'I can help you create a BNB price prediction. Please select the type of prediction:\n\n**1. Binary prediction** (Yes/No): Will BNB reach a specific price?\n**2. Multi-choice prediction**: What price range will BNB be in?\n\nOr click the button below to start creating your prediction right away.';
        shouldTriggerPredictionFlow = true;
      } else if (lowerInput.includes('litecoin') || lowerInput.includes('ltc')) {
        asset = 'LTC';
        responseContent = 'I can help you create a Litecoin price prediction. Please select the type of prediction:\n\n**1. Binary prediction** (Yes/No): Will LTC reach a specific price?\n**2. Multi-choice prediction**: What price range will LTC be in?\n\nOr click the button below to start creating your prediction right away.';
        shouldTriggerPredictionFlow = true;
      } else {
        responseContent = 'I can help you create a prediction market. What specific event or crypto asset would you like to create a prediction for? For example:\n\n- Bitcoin (BTC) price prediction\n- Ethereum (ETH) price prediction\n- BNB price prediction\n- Litecoin (LTC) price prediction\n- Other market events';
      }
    } else if (lowerInput.includes('binary') || lowerInput.includes('yes/no')) {
      predictionType = 'binary';
      responseContent = 'Great! Let\'s set up a binary (Yes/No) prediction market. Click the button below to start creating your prediction, or tell me more details about what you want to predict.';
      shouldTriggerPredictionFlow = true;
    } else if (lowerInput.includes('multi') || lowerInput.includes('range')) {
      predictionType = 'multi-choice';
      responseContent = 'Great! Let\'s set up a multi-choice price range prediction. Click the button below to start creating your prediction, or tell me more details about what you want to predict.';
      shouldTriggerPredictionFlow = true;
    } else if (lowerInput.includes('price') || lowerInput.includes('predict')) {
      if (lowerInput.includes('bitcoin') || lowerInput.includes('btc')) {
        asset = 'BTC';
        responseContent = 'Based on current market sentiment and historical patterns, Bitcoin seems likely to reach between $85,000 and $90,000 by the end of April.\n\n**Would you like to:**\n1. Create a prediction market for this price target\n2. See existing BTC price predictions\n3. Get more detailed price analysis';
      } else if (lowerInput.includes('ethereum') || lowerInput.includes('eth')) {
        asset = 'ETH';
        responseContent = 'Ethereum is showing strong momentum after the recent upgrade. Price targets range from $6,000 to $7,000 by the end of April.\n\n**Would you like to:**\n1. Create a prediction market for this price target\n2. See existing ETH price predictions\n3. Get more detailed price analysis';
      } else {
        responseContent = 'I can help create a prediction market for the price of that asset.\n\n**Would you like to:**\n1. Create a binary Yes/No prediction (e.g., "Will it reach X price?")\n2. Create a multi-choice prediction with price ranges\n3. See existing predictions for this asset';
      }

    } else if (lowerInput.includes('stake') || lowerInput.includes('pay') || lowerInput.includes('bnb')) {
      responseContent = 'To lead this prediction pool, you\'ll need to stake BNB tokens.\n\nHow much would you like to stake? The minimum is 0.01 BNB.\n\nOnce you stake, your prediction will be listed on the platform and others can participate.\n\nAt the end of a prediction, KAIDO Agent automatically sorts the results and distributes rewards to winners.';
    } else if (lowerInput.includes('expiry') || lowerInput.includes('date')) {
      responseContent = 'Please select an expiry date for your prediction:\n\n• End of this month (April 30th, 2025)\n• End of next month (May 31st, 2025)\n• Custom date (please specify)\n\nThe expiry date is when the prediction will be resolved and rewards distributed to winners.';
    } else if (lowerInput.includes('bitcoin') || lowerInput.includes('btc') ||
             lowerInput.includes('ethereum') || lowerInput.includes('eth') ||
             lowerInput.includes('binance') || lowerInput.includes('bnb') ||
             lowerInput.includes('ripple') || lowerInput.includes('xrp') ||
             lowerInput.includes('dogecoin') || lowerInput.includes('doge') ||
             lowerInput.includes('litecoin') || lowerInput.includes('ltc') ||
             lowerInput.includes('cardano') || lowerInput.includes('ada') ||
             lowerInput.includes('polkadot') || lowerInput.includes('dot') ||
             lowerInput.includes('avalanche') || lowerInput.includes('avax') ||
             lowerInput.includes('chainlink') || lowerInput.includes('link') ||
             lowerInput.includes('polygon') || lowerInput.includes('matic')) {

      // Extract the crypto name from the input
      let cryptoName = '';
      if (lowerInput.includes('bitcoin') || lowerInput.includes('btc')) {
        cryptoName = 'Bitcoin (BTC)';
        asset = 'BTC';
      } else if (lowerInput.includes('ethereum') || lowerInput.includes('eth')) {
        cryptoName = 'Ethereum (ETH)';
        asset = 'ETH';
      } else if (lowerInput.includes('binance') || lowerInput.includes('bnb')) {
        cryptoName = 'BNB';
        asset = 'BNB';
      } else if (lowerInput.includes('ripple') || lowerInput.includes('xrp')) {
        cryptoName = 'Ripple (XRP)';
        asset = 'XRP';
      } else if (lowerInput.includes('dogecoin') || lowerInput.includes('doge')) {
        cryptoName = 'Dogecoin (DOGE)';
        asset = 'DOGE';
      } else if (lowerInput.includes('litecoin') || lowerInput.includes('ltc')) {
        cryptoName = 'Litecoin (LTC)';
        asset = 'LTC';
      } else if (lowerInput.includes('cardano') || lowerInput.includes('ada')) {
        cryptoName = 'Cardano (ADA)';
        asset = 'ADA';
      } else if (lowerInput.includes('polkadot') || lowerInput.includes('dot')) {
        cryptoName = 'Polkadot (DOT)';
        asset = 'DOT';
      } else if (lowerInput.includes('avalanche') || lowerInput.includes('avax')) {
        cryptoName = 'Avalanche (AVAX)';
        asset = 'AVAX';
      } else if (lowerInput.includes('chainlink') || lowerInput.includes('link')) {
        cryptoName = 'Chainlink (LINK)';
        asset = 'LINK';
      } else if (lowerInput.includes('polygon') || lowerInput.includes('matic')) {
        cryptoName = 'Polygon (MATIC)';
        asset = 'MATIC';
      }

      responseContent = `I see you're interested in ${cryptoName}! Would you like to:\n\n1. Create a prediction about ${cryptoName}\n2. See current predictions for ${cryptoName}\n\nJust let me know what you'd like to do!`;
      shouldTriggerPredictionFlow = true;
    } else {
      // Generic response for unclear inputs - doesn't show binary/multiple choice options
      responseContent = 'I can help you create or participate in prediction markets on my DApp. Here\'s what I can do:\n\n• Create **crypto** price predictions with custom parameters 📈\n• Create **sports** predictions for football/soccer matches ⚽\n• Set expiry dates for predictions\n• Help you stake BNB to lead prediction pools\n• List existing predictions you can participate in\n\nWhat would you like to do today? You can ask about:\n• Crypto: BTC, ETH, BNB, LTC, ADA, DOGE, XRP, DOT, AVAX, LINK, MATIC, and more\n• Sports: Type "football" or "sports" to see available matches';
    }

    // If we should trigger the prediction flow directly, do it after a short delay
    if (shouldTriggerPredictionFlow) {
      setTimeout(() => {
        handleStartPredictionFlow(asset, predictionType);
      }, 1000);
    }

    return {
      id: `msg-${messages.length + 2}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString()
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      // When opening the chat, always show the home menu
      setShowMenu(true);
      setActiveTab('home');
    }
  };

  // Function to clear chat history and start fresh
  const handleRestartChat = () => {
    // Clear chat history from localStorage
    localStorage.removeItem(CHAT_HISTORY_KEY);

    // Reset chat state
    const welcomeMessage: KaidoMessage = {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hi there! 👋 KAIDO here - your AI prediction market wizard on BNB Smart Chain! I run this whole DApp myself - no middlemen, just pure blockchain magic. What can I help you with today?\n\n⚽ **Football Predictions** - Create markets for Premier League, La Liga, Champions League, and more!\n₿ **Crypto Predictions** - Set up price predictions for BNB, BTC, ETH, and other tokens!\n\nJust tell me what you'd like to predict and I'll help you set it up in seconds! 🔮💰",
      timestamp: new Date().toISOString()
    };

    setMessages([welcomeMessage]);
    setChatContext({
      creatingPrediction: false,
      predictionState: 'idle',
      predictionParams: {}
    });

    // Reset all prediction-related state
    setPredictionContext({ asset: undefined, type: undefined });
    setShowPredictionFlow(false);
    setInput('');
    setIsThinking(false);

    // Reset price range selector state
    setShowPriceRangeSelector(false);
    setPriceRanges([]);
    setSelectedPriceRanges([]);
    setUserStakeRange(null);

    // Reset any other state variables that might affect the chat flow
    setActiveTab('messages');
    setShowMenu(false);

    console.log('Chat has been completely reset');

    // Show toast notification
    showToast({
      type: 'success',
      title: 'Chat Restarted',
      message: 'Your chat history has been cleared'
    });
  };

  const handleStartPredictionFlow = (asset?: string, type?: 'binary' | 'multi-choice') => {
    setPredictionContext({ asset, type });
    setShowPredictionFlow(true);
  };

  const handleClosePredictionFlow = () => {
    setShowPredictionFlow(false);
  };

  const handleSubmitPrediction = async (predictionData: PredictionData) => {
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

      // Check if wallet is connected
      if (!address || !isConnected) {
        showToast({
          type: 'error',
          title: 'Connection Error',
          message: 'Please connect your wallet to BNB Smart Chain'
        });
        setIsSubmitting(false);
        return;
      }

      // Log the current network for debugging
      console.log('Connected to BNB Smart Chain with address:', address);

      // Parse the expiry date
      const expiryDate = new Date(predictionData.expiryDate);

      // Log the expiry date for debugging
      console.log('Prediction expiry date:', {
        original: predictionData.expiryDate,
        originalType: typeof predictionData.expiryDate,
        parsed: expiryDate.toISOString(),
        parsedTime: expiryDate.getTime(),
        isValid: !isNaN(expiryDate.getTime()),
        localString: expiryDate.toLocaleString()
      });

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

      // Calculate lock time (for sports predictions, lock at kickoff; for crypto, lock at expiry)
      const lockTime = Math.floor(expiryDate.getTime() / 1000);

      // Prepare prediction parameters for smart contract
      const predictionTitle = `Will ${predictionData.asset} ${predictionData.type === 'binary' ?
        `reach $${predictionData.targetPrice}` :
        `fall within a price range`} by ${expiryDate.toLocaleDateString()}?`;

      const predictionDescription = `Prediction about ${predictionData.asset} price`;

      // Parse target price to number
      const targetPriceNumber = parseFloat(predictionData.targetPrice || '0');

      // Create prediction on smart contract
      console.log('Creating on-chain prediction with params:', {
        title: predictionTitle,
        description: predictionDescription,
        predictionType: predictionData.type === 'binary' ? 0 : 1, // 0 = BINARY, 1 = MULTIPLE
        category: 0, // 0 = CRYPTO
        asset: predictionData.asset,
        targetPrice: targetPriceNumber,
        endDate: lockTime,
        choices: predictionData.type === 'binary' ? ['Yes', 'No'] : (predictionData.priceRanges || []),
        creatorStake: predictionData.stakeAmount
      });

      const txHash = await createOnChainPrediction({
        title: predictionTitle,
        description: predictionDescription,
        predictionType: predictionData.type === 'binary' ? 0 : 1, // 0 = BINARY, 1 = MULTIPLE
        category: 0, // 0 = CRYPTO
        asset: predictionData.asset,
        targetPrice: targetPriceNumber,
        endDate: lockTime,
        choices: predictionData.type === 'binary' ? ['Yes', 'No'] : (predictionData.priceRanges || []),
        creatorStake: predictionData.stakeAmount
      });

      if (!txHash) {
        throw new Error('Failed to create on-chain prediction - no transaction hash');
      }

      console.log('On-chain prediction transaction submitted:', txHash);

      // Add success message to chat
      const successMessage: KaidoMessage = {
        id: `msg-${messages.length + 2}`,
        role: 'assistant',
        content: `✅ On-chain prediction created! Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}\n\nWaiting for blockchain confirmation...`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, successMessage]);

      // Now save the prediction to the database with transaction hash
      // Note: onChainId will be 0 for now (placeholder) until we parse the event logs
      try {
        console.log('Saving prediction to database...');

        // Format the data for the API
        const apiData = {
          title: predictionTitle,
          description: predictionDescription,
          type: predictionData.type === 'binary' ? 'binary' : 'multiple',
          tokenType: 'BNB', // On-chain predictions use BNB
          endDate: predictionData.expiryDate,
          duration: predictionData.duration,
          asset: predictionData.asset,
          targetPrice: predictionData.type === 'binary' ? targetPriceNumber : undefined,
          priceRanges: predictionData.type === 'multi-choice' ? predictionData.priceRanges : undefined,
          stakeAmount: predictionData.stakeAmount,
          resolveDetails: `This prediction will be resolved based on the ${predictionData.asset} price on ${expiryDate.toLocaleDateString()} at ${expiryDate.toLocaleTimeString()} (your local time).`,
          useAI: true,
          walletAddress: wallet.address,
          onChainId: 0, // Placeholder - will be updated when we parse event logs
          transactionHash: txHash,
          transactionVerified: false, // Will be verified by backend oracle
          bypassBalanceCheck: true, // Already verified on-chain
          onChain: true // Mark as on-chain prediction
        };

        const response = await createPrediction(apiData);
        console.log('Prediction saved to database:', response);

        if (response.success) {
          // Extract the prediction ID from the response
          const predictionId = response.prediction?._id ||
                              response.prediction?.id ||
                              '680be5543f086ca79d466f793'; // Fallback to the BNB prediction ID

          console.log('Created prediction with ID:', predictionId);

          // Create a link to the prediction page
          const predictionLink = `/prediction/${predictionId}`;

          // Format duration for display
          let durationText = '';
          if (predictionData.duration) {
            if (predictionData.duration < 60) {
              durationText = `${predictionData.duration} minutes`;
            } else if (predictionData.duration < 1440) {
              const hours = Math.floor(predictionData.duration / 60);
              durationText = `${hours} hour${hours > 1 ? 's' : ''}`;
            } else {
              const days = Math.floor(predictionData.duration / 1440);
              durationText = `${days} day${days > 1 ? 's' : ''}`;
            }
          }

          // Add confirmation message to chat with a link to the prediction
          const confirmationMessage: KaidoMessage = {
            id: `msg-${messages.length + 3}`,
            role: 'assistant',
            content: `✅ Your on-chain prediction has been created successfully!\n\n**${predictionData.type === 'binary' ? 'Yes/No' : 'Multi-choice'} Prediction**\n• Asset: ${predictionData.asset}\n• ${predictionData.type === 'binary' ? `Target Price: $${predictionData.targetPrice}` : 'Price Ranges: ' + predictionData.priceRanges?.join(', ')}\n• Duration: ${durationText}\n• Resolves at: ${expiryDate.toLocaleString()} (your local time)\n• Staked: ${predictionData.stakeAmount} BNB\n• Transaction: [View on BSCScan](https://testnet.bscscan.com/tx/${txHash})\n\nYour prediction is now live on the blockchain! [View your prediction](${predictionLink})\n\nOthers can participate in this market until the expiry time.`,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, confirmationMessage]);
          setShowPredictionFlow(false);

          // Open the prediction page in a new tab
          window.open(predictionLink, '_blank');
        } else {
          // Add error message to chat
          const errorMessage: KaidoMessage = {
            id: `msg-${messages.length + 2}`,
            role: 'assistant',
            content: `❌ There was an error creating your prediction: ${response.message || 'Unknown error'}`,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (apiError) {
        console.error('API error:', apiError);

        // Add error message to chat
        const errorMessage: KaidoMessage = {
          id: `msg-${messages.length + 2}`,
          role: 'assistant',
          content: `❌ Error creating prediction: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error creating prediction:', error);

      // Add error message to chat
      const errorMessage: KaidoMessage = {
        id: `msg-${messages.length + 1}`,
        role: 'assistant',
        content: `❌ There was an error creating your prediction. Please try again.`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);

      // Refresh wallet balances after transaction (whether successful or not)
      console.log('Refreshing wallet balances after transaction...');
      try {
        await refreshWalletBalances();
      } catch (refreshError) {
        console.error('Error refreshing wallet balances:', refreshError);
      }
    }
  };

  // Chat bubble when collapsed
  if (!isOpen) {
    return (
      <div className="fixed bottom-[72px] md:bottom-6 right-2 md:right-6 z-40 flex items-center justify-end">
        <div className="flex items-center">
          <div className="mr-3 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
            <span className="text-white text-sm font-medium">Ask KAIDO</span>
          </div>
          <div className="relative">
            <button
              onClick={toggleChat}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label="Open chat with Kaido"
            >
              <img src="/kaido.png" alt="Kaido Logo" className="w-full h-full rounded-full" />
            </button>
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center chat-notification-badge">3</span>
          </div>
        </div>
      </div>
    );
  }

  // Full chat interface when expanded
  return (
    <div
      className={`fixed bottom-[72px] md:bottom-6 left-2 right-2 md:left-auto md:right-6 md:w-[400px] z-40 shadow-2xl rounded-xl overflow-hidden transition-all duration-500 ${
        isExpanded ? 'h-[calc(100vh-88px)] md:h-[800px]' : 'h-[calc(100vh-150px)] md:h-[700px] max-h-[600px]'
      }`}
    >
      {showPredictionFlow ? (
        <PredictionCreationFlow
          onClose={handleClosePredictionFlow}
          onSubmit={handleSubmitPrediction}
          initialAsset={predictionContext.asset}
          initialType={predictionContext.type}
        />
      ) : (
        <Card className="h-full flex flex-col relative">
        {/* Close Button - Positioned at Card level for proper z-index */}
        <Button
          variant="danger"
          size="icon"
          onClick={() => {
            handleRestartChat(); // Reset chat state
            toggleChat(); // Close the chat
          }}
          className="absolute top-2 md:top-4 right-2 md:right-4 text-white hover:text-white rounded-full z-50 w-10 h-10 md:w-10 md:h-10 p-2 md:p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110"
          style={{
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)',
            backgroundColor: 'rgb(220, 38, 38)',
            border: '2px solid rgba(255,255,255,0.9)'
          }}
          aria-label="Close chat"
        >
          <X className="h-5 w-5 md:h-5 md:w-5 stroke-[3]" />
        </Button>

        {/* Profile Header with Background */}
        <div className="relative">
          {/* Background with gradient and grid pattern */}
          <div className="h-20 md:h-32 bg-gradient-to-r from-yellow-900 to-yellow-800 relative overflow-hidden">
            {/* Grid lines overlay */}
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}></div>

            {/* Cityscape silhouette */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-black opacity-20"
                 style={{
                   maskImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'50\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,50 L0,30 L10,30 L10,20 L20,20 L20,35 L30,35 L30,25 L40,25 L40,35 L50,35 L50,15 L60,15 L60,25 L70,25 L70,35 L80,35 L80,25 L90,25 L90,15 L100,15 L100,30 L110,30 L110,20 L120,20 L120,40 L130,40 L130,30 L140,30 L140,20 L150,20 L150,25 L160,25 L160,35 L170,35 L170,25 L180,25 L180,35 L190,35 L190,20 L200,20 L200,30 L210,30 L210,25 L220,25 L220,35 L230,35 L230,30 L240,30 L240,40 L250,40 L250,20 L260,20 L260,30 L270,30 L270,25 L280,25 L280,35 L290,35 L290,25 L300,25 L300,30 L310,30 L310,20 L320,20 L320,35 L330,35 L330,25 L340,25 L340,30 L350,30 L350,15 L360,15 L360,25 L370,25 L370,35 L380,35 L380,30 L390,30 L390,40 L400,40 L400,50 Z\' fill=\'black\'/%3E%3C/svg%3E")',
                   maskSize: 'cover',
                   maskRepeat: 'no-repeat',
                   WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'50\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,50 L0,30 L10,30 L10,20 L20,20 L20,35 L30,35 L30,25 L40,25 L40,35 L50,35 L50,15 L60,15 L60,25 L70,25 L70,35 L80,35 L80,25 L90,25 L90,15 L100,15 L100,30 L110,30 L110,20 L120,20 L120,40 L130,40 L130,30 L140,30 L140,20 L150,20 L150,25 L160,25 L160,35 L170,35 L170,25 L180,25 L180,35 L190,35 L190,20 L200,20 L200,30 L210,30 L210,25 L220,25 L220,35 L230,35 L230,30 L240,30 L240,40 L250,40 L250,20 L260,20 L260,30 L270,30 L270,25 L280,25 L280,35 L290,35 L290,25 L300,25 L300,30 L310,30 L310,20 L320,20 L320,35 L330,35 L330,25 L340,25 L340,30 L350,30 L350,15 L360,15 L360,25 L370,25 L370,35 L380,35 L380,30 L390,30 L390,40 L400,40 L400,50 Z\' fill=\'black\'/%3E%3C/svg%3E")',
                   WebkitMaskSize: 'cover',
                   WebkitMaskRepeat: 'no-repeat'
                 }}></div>

            {/* Logo and Title */}
            <div className="absolute top-2 md:top-4 left-2 md:left-4 flex items-center z-10">
              <div className="flex items-center justify-center mr-2">
                <img src="/kaido.png" alt="Kaido Logo" className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
              </div>
            </div>

            {/* User Balance */}
            <div className="absolute bottom-1 md:bottom-2 right-1 md:right-4 flex items-center space-x-1 md:space-x-2 z-10">
              <div className="flex items-center bg-black/30 rounded-lg px-1.5 md:px-2 py-0.5 md:py-1"
                   style={{ minWidth: '60px', height: '20px', justifyContent: 'center' }}>
                <Wallet className="h-2.5 w-2.5 md:h-3 md:w-3 text-yellow-300 mr-0.5 md:mr-1 flex-shrink-0" />
                <span className="text-[10px] md:text-xs text-white font-medium whitespace-nowrap">
                  {wallet.connected && wallet.balance?.bnb !== undefined ? wallet.balance.bnb.toFixed(4) : '0.0000'} BNB
                </span>
              </div>
              <div className="flex items-center bg-black/30 rounded-lg px-1.5 md:px-2 py-0.5 md:py-1"
                   style={{ minWidth: '60px', height: '20px', justifyContent: 'center' }}>
                <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-purple-400 rounded-full mr-0.5 md:mr-1 flex-shrink-0"></div>
                <span className="text-[10px] md:text-xs text-white font-medium whitespace-nowrap">
                  {wallet.connected && wallet.balance?.kaido !== undefined ? wallet.balance.kaido.toFixed(2) : '0.00'} KAIDO
                </span>
              </div>
            </div>
          </div>
        </div>

        <CardHeader className="border-b border-slate-700 flex justify-between items-center pt-2 pb-2 md:pt-3 md:pb-3 px-2 md:px-4">
          <div>
            <h3 className="text-white font-medium flex items-center">
              <span className="ml-1 md:ml-2 text-xs md:text-sm font-normal text-white">Ask KAIDO</span>
            </h3>
            <p className="text-[10px] md:text-xs text-slate-400 ml-1 md:ml-2">Create & list predictions with AI</p>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            {messages.length > 0 && activeTab === 'messages' && !showMenu && (
              <button
                onClick={handleRestartChat}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors flex items-center"
                title="Restart chat"
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                <span className="text-[10px] md:text-xs hidden md:inline">Restart</span>
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors hidden md:block"
              title={isExpanded ? "Collapse chat" : "Expand chat"}
            >
              {isExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </button>
          </div>
        </CardHeader>

        <CardContent
          className="flex-grow overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-5 chat-content"
          style={{
            minHeight: 'auto',
            maxHeight: 'none',
            transition: 'min-height 0.5s, max-height 0.5s'
          }}>
          {activeTab === 'home' && showMenu ? (
            <div className="flex flex-col space-y-2 md:space-y-5">
              <div className="text-center">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">
                  Hi {wallet.connected ?
                      (userProfile?.username || 'CryptoSage') :
                      'There'} 👋
                </h2>
                <p className="text-sm md:text-xl text-white mb-2 md:mb-4">How can I help?</p>
              </div>

              <div className="bg-white rounded-lg p-3 md:p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  // Check if wallet is connected before allowing access to chat
                  if (!isConnected) {
                    showToast({
                      type: 'warning',
                      title: 'Wallet Required',
                      message: 'Please connect your wallet to use the chat feature'
                    });
                    return;
                  }

                  setActiveTab('messages');
                  setShowMenu(false);
                  const welcomeMessage: KaidoMessage = {
                    id: 'create-prediction-1',
                    role: 'assistant',
                    content: "Hi there! 👋 KAIDO here - your AI prediction market wizard on BNB Smart Chain! I run this whole DApp myself - no middlemen, just pure blockchain magic. What can I help you with today?\n\n⚽ **Football Predictions** - Create markets for Premier League, La Liga, Champions League, and more!\n₿ **Crypto Predictions** - Set up price predictions for BNB, BTC, ETH, and other tokens!\n\nJust tell me what you'd like to predict and I'll help you set it up in seconds! 🔮💰",
                    timestamp: new Date().toISOString()
                  };
                  setMessages([welcomeMessage]);
                }}
              >
                <div className="flex items-center">
                  <div className="mr-2 md:mr-3">
                    <Plus className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base text-gray-800 truncate">Create a prediction</h3>
                    <p className="text-xs md:text-sm text-gray-500 truncate">Start a new prediction market</p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <div className="bg-green-100 rounded-full p-0.5 md:p-1">
                      <Plus className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>



              <div className="bg-white rounded-lg p-3 md:p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  // Check if wallet is connected before allowing access to chat
                  if (!isConnected) {
                    showToast({
                      type: 'warning',
                      title: 'Wallet Required',
                      message: 'Please connect your wallet to use the chat feature'
                    });
                    return;
                  }

                  setActiveTab('messages');
                  setShowMenu(false);
                  const welcomeMessage: KaidoMessage = {
                    id: 'staking-info-1',
                    role: 'assistant',
                    content: "To lead a prediction pool, you'll need to stake BNB tokens.\n\nHow much would you like to stake? The minimum is 0.01 BNB.\n\nOnce you stake, your prediction will be listed on the platform and others can participate.\n\nAt the end of a prediction, KAIDO Agent automatically sorts the results and distributes rewards to winners.",
                    timestamp: new Date().toISOString()
                  };
                  setMessages([welcomeMessage]);
                }}
              >
                <div className="flex items-center">
                  <div className="mr-2 md:mr-3">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base text-gray-800 truncate">Staking information</h3>
                    <p className="text-xs md:text-sm text-gray-500 truncate">Learn about staking BNB</p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <div className="bg-yellow-100 rounded-full p-0.5 md:p-1">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 md:p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  // First close the chat widget
                  toggleChat();

                  // Then navigate to the FAQ page using React Router
                  setTimeout(() => {
                    navigateTo('/faq');
                  }, 100);
                }}
              >
                <div className="flex items-center">
                  <div className="mr-2 md:mr-3">
                    <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base text-gray-800 truncate">Wiki and Guides</h3>
                    <p className="text-xs md:text-sm text-gray-500 truncate">Access helpful documentation</p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <div className="bg-blue-100 rounded-full p-0.5 md:p-1">
                      <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 md:p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  // Check if wallet is connected before allowing access to chat
                  if (!isConnected) {
                    showToast({
                      type: 'warning',
                      title: 'Wallet Required',
                      message: 'Please connect your wallet to use the chat feature'
                    });
                    return;
                  }

                  setActiveTab('messages');
                  setShowMenu(false);
                  const welcomeMessage: KaidoMessage = {
                    id: 'welcome-1',
                    role: 'assistant',
                    content: "Hi there! 👋 KAIDO here - your AI prediction market wizard on BNB Smart Chain! I run this whole DApp myself - no middlemen, just pure blockchain magic. What can I help you with today?\n\n⚽ **Football Predictions** - Create markets for Premier League, La Liga, Champions League, and more!\n₿ **Crypto Predictions** - Set up price predictions for BNB, BTC, ETH, and other tokens!\n\nJust tell me what you'd like to predict and I'll help you set it up in seconds! 🔮💰",
                    timestamp: new Date().toISOString()
                  };
                  setMessages([welcomeMessage]);
                }}
              >
                <div className="flex items-center">
                  <div className="mr-2 md:mr-3">
                    <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base text-gray-800 truncate">Ask a question</h3>
                    <p className="text-xs md:text-sm text-gray-500 truncate">KAIDO AI Agent can help</p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <div className="bg-blue-100 rounded-full p-0.5 md:p-1">
                      <HelpCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'messages' ? (
            <>
              {messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center p-6">
                    <div className="mb-4">
                      <img src="/kaido.png" alt="Kaido" className="w-16 h-16 mx-auto rounded-full" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Welcome to KAIDO Chat!</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      I'm here to help you create predictions, answer questions, and guide you through the platform.
                    </p>
                    <p className="text-slate-300 text-sm">
                      Start by typing a message below or use the quick action buttons.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-yellow-600/20 ml-4'
                        : 'bg-slate-700/50 mr-4'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {message.role === 'assistant' && (
                        <Avatar
                          src="/kaido.png"
                          alt="Kaido"
                          size="xs"
                          className="mr-2"
                        />
                      )}
                      <span className="text-xs text-slate-400">
                        {message.role === 'user' ? 'You' : 'KAIDO'} • {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    {message.role === 'assistant' && message.content.includes('<price-range') ? (
                      <div className="text-slate-200 text-sm leading-relaxed" style={{ minHeight: '20px' }}>
                        {/* Extract and display the text before price ranges */}
                        {message.content.split('<price-range')[0]}

                        {/* Show price range selector if this message contains price ranges */}
                        {!showPriceRangeSelector && (
                          <Button
                            onClick={() => {
                              // Extract price ranges from the message
                              const ranges: string[] = [];
                              const regex = /<price-range id="(\d+)" value="([^"]+)">/g;
                              let match;
                              while ((match = regex.exec(message.content)) !== null) {
                                ranges.push(match[2]);
                              }

                              // Set the price ranges and show the selector
                              setPriceRanges(ranges);
                              setShowPriceRangeSelector(true);
                            }}
                            className="mt-2 w-full"
                          >
                            Select Price Ranges
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-200 whitespace-pre-line text-sm leading-relaxed" style={{ minHeight: '20px' }}>
                          {message.content}
                        </p>

                        {/* Render interactive buttons for assistant messages */}
                        {message.role === 'assistant' && (() => {
                          const { buttons } = parseMessageButtons(message.content);
                          if (buttons.length > 0) {
                            return (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {buttons.map((button, index) => (
                                  <button
                                    key={`${message.id}-btn-${index}`}
                                    onClick={() => {
                                      // Directly send the action as a message
                                      handleSendMessage(button.action);
                                    }}
                                    className={`
                                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                      ${button.type === 'cta'
                                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-md hover:shadow-lg'
                                        : button.type === 'numbered'
                                        ? 'bg-slate-600/80 hover:bg-slate-500/80 text-white border border-slate-500/50'
                                        : 'bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 border border-slate-600/50'
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

                    {/* Removed "Create Prediction Now" button */}
                  </div>
                </div>
              ))
              )}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 rounded-lg p-4 max-w-[85%] mr-4">
                    <div className="flex items-center mb-2">
                      <Avatar
                        src="/kaido.png"
                        alt="Kaido"
                        size="xs"
                        className="mr-2"
                      />
                      <span className="text-xs text-slate-400">
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

              {/* Price Range Selector */}
              {showPriceRangeSelector && (
                <div className="flex justify-start mb-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 max-w-[85%] mr-4 w-full">
                    <PriceRangeSelector
                      ranges={priceRanges}
                      onRangesSelected={(selectedRanges) => {
                        setSelectedPriceRanges(selectedRanges);
                        setShowPriceRangeSelector(false);

                        // Update the chat context with the selected ranges
                        setChatContext(prev => ({
                          ...prev,
                          predictionState: 'expiry_date',
                          predictionParams: {
                            ...prev.predictionParams,
                            priceRanges: selectedRanges
                          }
                        }));

                        // Add a message to continue the flow
                        const nextMessage: KaidoMessage = {
                          id: `msg-${messages.length + 1}`,
                          role: 'assistant',
                          content: `Great! You've selected ${selectedRanges.length} price ranges.\n\nWhen should this prediction expire? Please specify a date (e.g., "June 30, 2025", "tomorrow", "in 2 weeks", or "in 24 hours").`,
                          timestamp: new Date().toISOString()
                        };

                        setMessages(prev => [...prev, nextMessage]);
                      }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          ) : (
            // Fallback: This shouldn't happen, but just in case
            <div className="flex justify-center items-center h-full">
              <div className="text-center p-6">
                <p className="text-slate-400 text-sm">
                  Something went wrong. Please try refreshing the chat.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {activeTab === 'messages' && !showMenu && (
          <CardFooter className="border-t border-slate-700 py-2 chat-footer">
            {/* Chat Prediction Flow */}
            {chatContext.creatingPrediction && chatContext.predictionState === 'confirmation' && (
              <ChatPredictionFlow
                state={chatContext.predictionState}
                params={chatContext.predictionParams}
                onProceedToPayment={() => {
                  // Convert the chat prediction params to the format expected by the payment flow
                  const paymentData: PredictionData = {
                    asset: chatContext.predictionParams.asset || 'BNB',
                    type: chatContext.predictionParams.type === 'multi-choice' ? 'multi-choice' : 'binary',
                    targetPrice: chatContext.predictionParams.targetPrice || '',
                    priceRanges: chatContext.predictionParams.priceRanges || [],
                    // Use the full ISO string for the expiry date to preserve UTC time
                    expiryDate: chatContext.predictionParams.expiryDate || '',
                    duration: chatContext.predictionParams.duration || undefined,
                    stakeAmount: chatContext.predictionParams.stakeAmount || 1,
                    stakeToken: 'BNB'
                  };

                  console.log('Prediction payment data:', {
                    expiryDate: paymentData.expiryDate,
                    duration: paymentData.duration
                  });

                  // Update the chat context to payment state
                  setChatContext({
                    ...chatContext,
                    predictionState: 'payment'
                  });

                  // Trigger the payment flow
                  handleSubmitPrediction(paymentData);
                }}
                onCancel={() => {
                  // Reset the chat context
                  setChatContext({
                    creatingPrediction: false,
                    predictionState: 'idle',
                    predictionParams: {}
                  });

                  // Add a cancellation message
                  const cancelMessage: KaidoMessage = {
                    id: `msg-${messages.length + 1}`,
                    role: 'assistant',
                    content: "I've cancelled the prediction creation process. Let me know if you'd like to start again or if there's anything else I can help with.",
                    timestamp: new Date().toISOString()
                  };

                  setMessages(prev => [...prev, cancelMessage]);
                }}
              />
            )}

            <div className="flex items-center w-full">
              <div className="flex-grow relative">
                <Input
                  placeholder="Ask KAIDO about predictions..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                  disabled={isThinking || showPredictionFlow || chatContext.predictionState === 'payment'}
                />
              </div>

              <Button
                variant="tertiary"
                size="sm"
                className="ml-2 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isThinking || showPredictionFlow || chatContext.predictionState === 'payment'}
              >
                {isThinking ? (
                  <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="tertiary"
                size="sm"
                className="ml-2 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
              >
                <Lightning className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-1 flex flex-wrap gap-1">
              <button
                className="text-[10px] md:text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 md:px-3 py-1 rounded-full transition-colors"
                onClick={() => {
                  setInput("Create a BTC price prediction");
                  handleSendMessage();
                }}
              >
                BTC prediction
              </button>

              <button
                className="text-[10px] md:text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-3 py-1 rounded-full transition-colors"
                onClick={() => {
                  setInput('Create a football prediction');
                  handleSendMessage();
                }}
              >
                ⚽ Sports
              </button>

              <button
                className="text-[10px] md:text-xs bg-green-600 hover:bg-green-700 text-white px-2 md:px-3 py-1 rounded-full transition-colors"
                onClick={() => handleStartPredictionFlow()}
              >
                Manual
              </button>
            </div>
          </CardFooter>
        )}

        <div className="border-t border-slate-700 py-1.5 md:py-2 px-1 md:px-2 flex justify-around chat-nav">
          <button
            className={`flex items-center px-2 md:px-4 py-1.5 md:py-2 rounded-md ${activeTab === 'home' ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 hover:bg-slate-700'}`}
            onClick={() => {
              setActiveTab('home');
              setShowMenu(true);
            }}
          >
            <Home className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
            <span className="text-xs md:text-sm font-medium">Home</span>
          </button>
          <button
            className={`flex items-center px-2 md:px-4 py-1.5 md:py-2 rounded-md ${
              activeTab === 'messages'
                ? 'text-blue-500 bg-blue-500/10'
                : isConnected
                  ? 'text-slate-400 hover:bg-slate-700'
                  : 'text-slate-500 opacity-60 cursor-not-allowed'
            }`}
            onClick={() => {
              // Check if wallet is connected before allowing access to messages
              if (!isConnected) {
                showToast({
                  type: 'warning',
                  title: 'Wallet Required',
                  message: 'Please connect your wallet to use the chat feature'
                });
                return;
              }

              setActiveTab('messages');
              if (messages.length === 0) {
                const welcomeMessage: KaidoMessage = {
                  id: 'welcome-1',
                  role: 'assistant',
                  content: "Hi there! 👋 KAIDO here - your AI prediction market wizard on BNB Smart Chain! I run this whole DApp myself - no middlemen, just pure blockchain magic. What can I help you with today?\n\n⚽ **Football Predictions** - Create markets for Premier League, La Liga, Champions League, and more!\n₿ **Crypto Predictions** - Set up price predictions for BNB, BTC, ETH, and other tokens!\n\nJust tell me what you'd like to predict and I'll help you set it up in seconds! 🔮💰",
                  timestamp: new Date().toISOString()
                };
                setMessages([welcomeMessage]);
              }
              setShowMenu(false);
            }}
          >
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
            <span className="text-xs md:text-sm font-medium">Messages</span>
            {!isConnected && (
              <Wallet className="h-3 w-3 md:h-4 md:w-4 ml-1 text-yellow-500" />
            )}
          </button>
        </div>
      </Card>
      )}
    </div>
  );
};

export default KaidoChatWidget;
