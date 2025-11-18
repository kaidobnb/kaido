import React, { useState, useRef, useEffect } from 'react';
import { Send, CloudLightning as Lightning, Plus, ChevronDown } from 'lucide-react';
import { KaidoMessage } from '../../types';
import { chatHistory } from '../../data/mockData';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card, { CardHeader, CardContent, CardFooter } from '../ui/Card';

const KaidoChat: React.FC = () => {
  const [messages, setMessages] = useState<KaidoMessage[]>(chatHistory);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    const userMessage: SolyMessage = {
      id: `msg-${messages.length + 1}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    setIsThinking(true);
    
    // Simulate AI response after delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsThinking(false);
    }, 2000);
  };
  
  const generateAIResponse = (userInput: string): SolyMessage => {
    let responseContent = '';
    
    if (userInput.toLowerCase().includes('create') || userInput.toLowerCase().includes('make')) {
      responseContent = 'I can help you create a prediction market. What specific event or price would you like to create a market for?';
    } else if (userInput.toLowerCase().includes('price') || userInput.toLowerCase().includes('predict')) {
      if (userInput.toLowerCase().includes('bitcoin') || userInput.toLowerCase().includes('btc')) {
        responseContent = 'Based on current market sentiment and historical patterns, Bitcoin seems likely to reach between $85,000 and $90,000 by the end of April. Would you like me to create a prediction market for this?';
      } else if (userInput.toLowerCase().includes('ethereum') || userInput.toLowerCase().includes('eth')) {
        responseContent = 'Ethereum is showing strong momentum after the recent upgrade. I can set up a multi-choice prediction market for ETH price ranges at the end of April. Would you like me to create this?';
      } else {
        responseContent = 'I can help create a prediction market for the price of that asset. Would you prefer a binary Yes/No market or a multi-choice price range market?';
      }
    } else {
      responseContent = 'I can help you create or participate in prediction markets. Would you like to create a new prediction or browse existing markets?';
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
            <span className="text-white font-bold">S</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Soly AI Assistant</h3>
            <p className="text-xs text-slate-400">Your prediction market guide</p>
          </div>
        </div>
        <div className="relative">
          <Button
            variant="tertiary"
            size="sm"
            rightIcon={<ChevronDown className="h-4 w-4" />}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            Options
          </Button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 z-10">
              <button className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
                New Conversation
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
                Preferences
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
                Export Chat
              </button>
              <hr className="border-slate-700 my-1" />
              <button className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700">
                Clear History
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-purple-600/20 ml-4' 
                  : 'bg-slate-700/50 mr-4'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.role === 'assistant' && (
                  <Avatar 
                    src="" 
                    alt="Soly" 
                    size="xs"
                    className="mr-2 bg-gradient-to-br from-purple-500 to-blue-500"
                  />
                )}
                <span className="text-xs text-slate-400">
                  {message.role === 'user' ? 'You' : 'Soly'} • {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <p className="text-slate-200">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 rounded-lg p-3 max-w-[80%] mr-4">
              <div className="flex items-center mb-1">
                <Avatar 
                  src="" 
                  alt="Soly" 
                  size="xs"
                  className="mr-2 bg-gradient-to-br from-purple-500 to-blue-500"
                />
                <span className="text-xs text-slate-400">
                  Soly • {formatTimestamp(new Date().toISOString())}
                </span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>
      
      <CardFooter className="border-t border-slate-700">
        <div className="flex items-center w-full">
          <Button
            variant="tertiary"
            size="sm"
            className="mr-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <div className="flex-grow relative">
            <Input
              placeholder="Ask Kaido about predictions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full"
            />
          </div>
          
          <Button
            variant="tertiary"
            size="sm"
            className="ml-2 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20"
            onClick={handleSendMessage}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
          
          <Button
            variant="tertiary"
            size="sm"
            className="ml-2 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
          >
            <Lightning className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-full transition-colors">
            Will BTC reach $100k this month?
          </button>
          <button className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-full transition-colors">
            Create ETH price prediction
          </button>
          <button className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-full transition-colors">
            Solana above $300 in April?
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default KaidoChat;