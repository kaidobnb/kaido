import React, { useState, useEffect } from 'react';
import { getAdminPredictions, resolvePrediction, cancelPrediction, getPredictionById } from '../../services/api';
import Button from '../ui/Button';
import { Eye, CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

interface Prediction {
  _id: string;
  title: string;
  asset: string;
  type: string;
  status: string;
  volume: number;
  participants: number;
  tokenType: string;
  createdAt: string;
  endDate: string;
  duration?: number;
  resolvedBy?: 'api' | 'admin';
  resolvedAt?: string;
  creator: {
    username: string;
    walletAddress: string;
  };
  choices?: Array<{
    id: string;
    label: string;
    price: number;
    percentage: number;
  }>;
  priceRanges?: string[];
}

const AdminPredictionsTable: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const { showToast } = useToast();

  // Function to fetch predictions
  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await getAdminPredictions({
        status: statusFilter || undefined,
        page,
        limit: 10,
        sort: 'createdAt',
        order: 'desc'
      });

      if (response.success) {
        setPredictions(response.predictions);
        setTotalPages(response.pages);
      } else {
        setError(response.message || 'Failed to load predictions');
      }
    } catch (err) {
      setError('Error loading predictions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Set up polling to refresh predictions every 10 seconds
  useEffect(() => {
    fetchPredictions();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchPredictions();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [statusFilter, page]);

  // Add click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        // Check if the click was outside the dropdown
        const dropdownElement = document.querySelector(`[data-dropdown-id="${showDropdown}"]`);
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setShowDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Function to fetch prediction details for multi-choice predictions
  const fetchPredictionDetails = async (id: string) => {
    try {
      console.log('Fetching prediction details for ID:', id);
      setActionLoading(id);
      const response = await getPredictionById(id, true);

      console.log('Prediction details response:', response);

      if (response && (response.success || response._id)) {
        const predictionData = response.prediction || response;

        console.log('Prediction data:', predictionData);
        console.log('Prediction type:', predictionData.type);
        console.log('Prediction choices:', predictionData.choices);

        // Update the prediction in the list with the fetched details
        const updatedPredictions = predictions.map(p =>
          p._id === id ? { ...p, choices: predictionData.choices, priceRanges: predictionData.priceRanges } : p
        );
        setPredictions(updatedPredictions);

        // Toggle dropdown
        setShowDropdown(showDropdown === id ? null : id);

        return predictionData;
      } else {
        console.error('Failed to fetch prediction details:', response);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch prediction details'
        });
        return null;
      }
    } catch (err) {
      console.error('Error fetching prediction details:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error fetching prediction details'
      });
      return null;
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: string, choice: string) => {
    try {
      console.log('Resolving prediction:', id, 'with choice:', choice);
      setActionLoading(id);

      // Find the prediction in the current state
      const prediction = predictions.find(p => p._id === id);
      console.log('Prediction to resolve:', prediction);

      const response = await resolvePrediction(id, { resolvedChoice: choice });
      console.log('Resolve prediction response:', response);

      if (response.success) {
        // Refresh predictions
        const updatedPredictions = predictions.map(p =>
          p._id === id ? { ...p, status: 'resolved' } : p
        );
        setPredictions(updatedPredictions);

        showToast({
          type: 'success',
          title: 'Success',
          message: `Prediction resolved successfully with choice: ${choice}`
        });
      } else {
        console.error('Failed to resolve prediction:', response);
        setError(response.message || 'Failed to resolve prediction');
        showToast({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to resolve prediction'
        });
      }
    } catch (err) {
      console.error('Error resolving prediction:', err);
      setError('Error resolving prediction');
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error resolving prediction'
      });
    } finally {
      setActionLoading(null);
      setShowDropdown(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await cancelPrediction(id);

      if (response.success) {
        // Refresh predictions
        const updatedPredictions = predictions.map(p =>
          p._id === id ? { ...p, status: 'cancelled' } : p
        );
        setPredictions(updatedPredictions);

        showToast({
          type: 'success',
          title: 'Success',
          message: 'Prediction cancelled successfully'
        });
      } else {
        setError(response.message || 'Failed to cancel prediction');
        showToast({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to cancel prediction'
        });
      }
    } catch (err) {
      setError('Error cancelling prediction');
      console.error(err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error cancelling prediction'
      });
    } finally {
      setActionLoading(null);
      setShowDropdown(null); // Close any open dropdowns
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <select
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Asset</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Volume</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Resolved By</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                    No predictions found
                  </td>
                </tr>
              ) : (
                predictions.map((prediction) => (
                  <tr key={prediction._id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-sm text-white">{prediction.title}</td>
                    <td className="px-4 py-3 text-sm text-white">{prediction.asset}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.type === 'binary'
                          ? 'bg-blue-500/20 text-blue-400'
                          : prediction.type === 'agent'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {prediction.type === 'binary'
                          ? 'Yes/No'
                          : prediction.type === 'agent'
                            ? 'Agent'
                            : 'Multi-Choice'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        prediction.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {prediction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {prediction.volume} {prediction.tokenType}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatDate(prediction.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatDate(prediction.endDate)}</td>
                    <td className="px-4 py-3 text-sm">
                      {prediction.status === 'resolved' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          prediction.resolvedBy === 'api'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {prediction.resolvedBy === 'api' ? 'Resolved by Agent' : 'Resolved by Admin'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <Link to={`/prediction/${prediction._id}`}>
                          <Button variant="secondary" size="xs" leftIcon={<Eye className="h-3 w-3" />}>
                            View
                          </Button>
                        </Link>

                        {prediction.status === 'active' && (
                          <>
                            {prediction.type === 'binary' ? (
                              // Binary prediction resolution options
                              <>
                                <Button
                                  variant="success"
                                  size="xs"
                                  leftIcon={<CheckCircle className="h-3 w-3" />}
                                  onClick={() => handleResolve(prediction._id, 'yes')}
                                  disabled={actionLoading === prediction._id}
                                >
                                  Resolve Yes
                                </Button>
                                <Button
                                  variant="danger"
                                  size="xs"
                                  leftIcon={<XCircle className="h-3 w-3" />}
                                  onClick={() => handleResolve(prediction._id, 'no')}
                                  disabled={actionLoading === prediction._id}
                                >
                                  Resolve No
                                </Button>
                              </>
                            ) : (
                              // Multi-choice prediction resolution options
                              <div className="relative">
                                <Button
                                  variant="primary"
                                  size="xs"
                                  leftIcon={<CheckCircle className="h-3 w-3" />}
                                  rightIcon={<ChevronDown className="h-3 w-3 ml-1" />}
                                  onClick={() => fetchPredictionDetails(prediction._id)}
                                  disabled={actionLoading === prediction._id}
                                >
                                  Resolve {prediction.type === 'agent' ? 'Agent' : 'Multi-Choice'}
                                </Button>

                                {/* Dropdown for multi-choice options */}
                                {showDropdown === prediction._id && prediction.choices && (
                                  <div
                                    className="absolute z-10 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg"
                                    data-dropdown-id={prediction._id}
                                  >
                                    <div className="py-1">
                                      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700">
                                        Select the correct price range:
                                      </div>
                                      {prediction.choices.map((choice) => (
                                        <button
                                          key={choice.id}
                                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700"
                                          onClick={() => handleResolve(prediction._id, choice.id)}
                                        >
                                          {choice.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Cancel button for all prediction types */}
                            <Button
                              variant="warning"
                              size="xs"
                              leftIcon={<AlertTriangle className="h-3 w-3" />}
                              onClick={() => handleCancel(prediction._id)}
                              disabled={actionLoading === prediction._id}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
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

export default AdminPredictionsTable;
