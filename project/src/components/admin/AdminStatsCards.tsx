import React from 'react';
import { Users, TrendingUp, BarChart3, Clock, CheckCircle, DollarSign } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    userCount: number;
    predictionCount: number;
    activeCount: number;
    resolvedCount: number;
    transactionCount: number;
    totalVolume: number;
    feeTotals: {
      SOL?: number;
      SOLY?: number;
    };
  };
}

const AdminStatsCards: React.FC<AdminStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-500/20 text-blue-400 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Users</p>
            <h3 className="text-2xl font-bold text-white">{stats.userCount.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-500/20 text-purple-400 mr-4">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Predictions</p>
            <h3 className="text-2xl font-bold text-white">{stats.predictionCount.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-500/20 text-green-400 mr-4">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Active Predictions</p>
            <h3 className="text-2xl font-bold text-white">{stats.activeCount.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-amber-500/20 text-amber-400 mr-4">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Resolved Predictions</p>
            <h3 className="text-2xl font-bold text-white">{stats.resolvedCount.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-pink-500/20 text-pink-400 mr-4">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Transactions</p>
            <h3 className="text-2xl font-bold text-white">{stats.transactionCount.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400 mr-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Volume</p>
            <h3 className="text-2xl font-bold text-white">{stats.totalVolume.toLocaleString()} SOL</h3>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 mr-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Fees (SOL)</p>
            <h3 className="text-2xl font-bold text-white">{(stats.feeTotals.SOL || 0).toLocaleString()} SOL</h3>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 shadow-lg">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400 mr-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Fees (SOLY)</p>
            <h3 className="text-2xl font-bold text-white">{(stats.feeTotals.SOLY || 0).toLocaleString()} SOLY</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsCards;
