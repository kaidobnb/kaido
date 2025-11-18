import React from 'react';
import Card, { CardContent } from '../components/ui/Card';
import KaidoChat from '../components/chat/KaidoChat';

const ChatPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <KaidoChat />
        </div>
        
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl text-white font-medium mb-4">Ask Kaido About</h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                  <h3 className="text-white font-medium mb-1">Create Predictions</h3>
                  <p className="text-white text-sm">Ask Kaido to create binary or multi-choice prediction markets</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                  <h3 className="text-white font-medium mb-1">Market Analysis</h3>
                  <p className="text-white text-sm">Get Kaido's insights on cryptocurrency price trends</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                  <h3 className="text-white font-medium mb-1">Trading Strategies</h3>
                  <p className="text-slate-400 text-sm">Learn how to maximize your profits in prediction markets</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer">
                  <h3 className="text-white font-medium mb-1">Platform Features</h3>
                  <p className="text-white text-sm">Ask Kaido about fees, rewards, and platform mechanics</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl text-white font-medium mb-4">Example Prompts</h2>
              <div className="space-y-2">
                <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer">
                  "Will BTC hit $100k by the end of May?"
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer">
                  "Create a prediction for ETH price on April 30th"
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer">
                  "What's the likely range for BNB price next month?"
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer">
                  "Which coin has the best upside potential this quarter?"
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer">
                  "How do I reduce fees when trading on Kaido?"
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;