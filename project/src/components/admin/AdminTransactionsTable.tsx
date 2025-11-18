import React, { useState, useEffect } from 'react';
import { getAdminTransactions } from '../../services/api';
import Button from '../ui/Button';
import { ArrowUpRight, ArrowDownLeft, Coins, Award, AlertTriangle, DollarSign } from 'lucide-react';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'prediction' | 'win' | 'loss' | 'referral' | 'fee' | 'refund';
  amount: number;
  tokenType: 'SOL' | 'SOLY';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: string;
  user: {
    _id: string;
    username: string | null;
    walletAddress: string;
  };
  prediction?: {
    _id: string;
    title: string;
  };
}

const AdminTransactionsTable: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [tokenFilter, setTokenFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await getAdminTransactions({
          type: typeFilter || undefined,
          tokenType: tokenFilter || undefined,
          page,
          limit: 10,
          sort: 'createdAt',
          order: 'desc'
        });

        if (response.success) {
          setTransactions(response.transactions);
          setTotalPages(response.pages);
        } else {
          setError(response.message || 'Failed to load transactions');
        }
      } catch (err) {
        setError('Error loading transactions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [typeFilter, tokenFilter, page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-400" />;
      case 'prediction':
        return <Coins className="h-4 w-4 text-purple-400" />;
      case 'win':
        return <Award className="h-4 w-4 text-yellow-400" />;
      case 'loss':
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'referral':
        return <DollarSign className="h-4 w-4 text-blue-400" />;
      case 'fee':
        return <DollarSign className="h-4 w-4 text-cyan-400" />;
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
      default:
        return <Coins className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <select
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="prediction">Prediction</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="referral">Referral</option>
            <option value="fee">Fee</option>
            <option value="refund">Refund</option>
          </select>
          
          <select
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
            value={tokenFilter}
            onChange={(e) => {
              setTokenFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Tokens</option>
            <option value="SOL">SOL</option>
            <option value="SOLY">SOLY</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-white">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-100">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Prediction</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        {getTransactionIcon(transaction.type)}
                        <span className="ml-2 text-white capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {transaction.user.username || truncateAddress(transaction.user.walletAddress)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {transaction.amount.toLocaleString()} {transaction.tokenType}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        transaction.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {transaction.prediction ? (
                        <a 
                          href={`/prediction/${transaction.prediction._id}`} 
                          className="text-blue-400 hover:underline"
                        >
                          {transaction.prediction.title.length > 20 
                            ? `${transaction.prediction.title.substring(0, 20)}...` 
                            : transaction.prediction.title}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsTable;
