import React, { useState, useEffect } from 'react';
import { getAdminUsers } from '../../services/api';
import Button from '../ui/Button';
import { User, Star } from 'lucide-react';

interface UserData {
  _id: string;
  walletAddress: string;
  username: string | null;
  email: string | null;
  profileCompleted: boolean;
  isAdmin: boolean;
  balances: {
    SOL: number;
    SOLY: number;
  };
  reputation: number;
  totalPredictions: number;
  wonPredictions: number;
  createdAt: string;
}

const AdminUsersTable: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAdminUsers({
          page,
          limit: 10,
          sort: 'createdAt',
          order: 'desc'
        });

        if (response.success) {
          setUsers(response.users);
          setTotalPages(response.pages);
        } else {
          setError(response.message || 'Failed to load users');
        }
      } catch (err) {
        setError('Error loading users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
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
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Wallet</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">SOL Balance</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">SOLY Balance</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Predictions</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Win Rate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        {user.isAdmin && (
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        )}
                        <span className="text-white">
                          {user.username || 'Anonymous'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {truncateAddress(user.walletAddress)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {user.email || 'Not provided'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.profileCompleted ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {user.profileCompleted ? 'Complete' : 'Incomplete'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {user.balances.SOL.toLocaleString()} SOL
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {user.balances.SOLY.toLocaleString()} SOLY
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {user.totalPredictions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {user.totalPredictions > 0 
                        ? `${((user.wonPredictions / user.totalPredictions) * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {formatDate(user.createdAt)}
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

export default AdminUsersTable;
