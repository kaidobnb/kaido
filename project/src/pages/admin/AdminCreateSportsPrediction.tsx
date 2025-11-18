import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft, Calendar, MapPin, Trophy, Users, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';

// Types for sports data
interface Competition {
  id: string;
  name: string;
  country?: {
    id: string;
    name: string;
    code: string;
  };
  category?: {
    id: string;
    name: string;
    country_code?: string;
  };
}

interface Team {
  id: string;
  name: string;
  country?: {
    id: string;
    name: string;
    code: string;
  };
}

interface Match {
  id: string;
  scheduled: string;
  home?: Team;
  away?: Team;
  competition?: {
    id: string;
    name: string;
  };
  status: string;
  hasPrediction?: boolean;
  validForPrediction?: {
    valid: boolean;
    reason?: string;
  };
}

const AdminCreateSportsPrediction: React.FC = () => {
  console.log('AdminCreateSportsPrediction: Component rendering');
  const { isAdmin, isAuthenticated, userProfile } = useAuth();
  const navigate = useNavigate();
  console.log('AdminCreateSportsPrediction: isAdmin =', isAdmin);
  
  // State management
  const [step, setStep] = useState<'competitions' | 'matches' | 'create'>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentApiProvider, setCurrentApiProvider] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prediction form state
  const [predictionForm, setPredictionForm] = useState({
    title: '',
    description: '',
    type: 'binary', // 'binary' or 'multiple'
    options: [
      { text: '' },
      { text: '' }
    ],
    endTime: '',
    autoResolve: true
  });
  const [isCreating, setIsCreating] = useState(false);

  // Redirect if not admin (temporarily disabled for testing)
  useEffect(() => {
    // TODO: Re-enable admin check in production
    // if (!isAdmin) {
    //   navigate('/');
    //   return;
    // }
  }, [isAdmin, navigate]);

  // Fetch competitions and API provider info when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      console.log('AdminCreateSportsPrediction: User authenticated, fetching data');
      fetchCompetitions();
      fetchApiProvider();
    }
  }, [isAuthenticated, userProfile]);

  const fetchCompetitions = async () => {
    console.log('AdminCreateSportsPrediction: fetchCompetitions called');

    const token = localStorage.getItem('userToken');
    if (!token) {
      console.log('AdminCreateSportsPrediction: No token available, skipping API call');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/sports/competitions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCompetitions(data.competitions);
      } else {
        setError(data.message || 'Failed to fetch competitions');
      }
    } catch (err) {
      console.error('Error fetching competitions:', err);
      setError('Failed to fetch competitions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApiProvider = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      return;
    }

    try {
      const response = await fetch('/api/admin/sports/provider', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const providerName = data.provider.current === 'football-data' ? 'Football-Data.org' : 'Sportradar';
        setCurrentApiProvider(providerName);
      }
    } catch (error) {
      console.error('Error fetching API provider:', error);
    }
  };

  const fetchMatches = async (competitionId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      console.log('AdminCreateSportsPrediction: No token available for fetchMatches');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/sports/competitions/${competitionId}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches);
        setStep('matches');
      } else {
        setError(data.message || 'Failed to fetch matches');
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to fetch matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompetitionSelect = (competition: Competition) => {
    setSelectedCompetition(competition);
    fetchMatches(competition.id);
  };

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match);

    // Auto-populate form with match data
    const defaultTitle = `${match.home?.name} vs ${match.away?.name}`;
    const defaultEndTime = new Date(new Date(match.scheduled).getTime() - 30 * 60 * 1000).toISOString().slice(0, 16);

    setPredictionForm({
      title: defaultTitle,
      description: `Predict the outcome of ${defaultTitle} in ${selectedCompetition?.name}`,
      type: 'binary',
      options: [
        { text: `${match.home?.name} wins` },
        { text: `${match.away?.name} wins` }
      ],
      endTime: defaultEndTime,
      autoResolve: true
    });

    setStep('create');
  };

  const handleBack = () => {
    if (step === 'matches') {
      setStep('competitions');
      setSelectedCompetition(null);
      setMatches([]);
    } else if (step === 'create') {
      setStep('matches');
      setSelectedMatch(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilMatch = (dateString: string) => {
    const now = new Date();
    const matchDate = new Date(dateString);
    const diffMs = matchDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Soon';
    }
  };

  // Form handlers
  const updatePredictionForm = (field: string, value: any) => {
    setPredictionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addOption = () => {
    setPredictionForm(prev => ({
      ...prev,
      options: [...prev.options, { text: '' }]
    }));
  };

  const removeOption = (index: number) => {
    if (predictionForm.options.length > 2) {
      setPredictionForm(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, field: 'text', value: string) => {
    setPredictionForm(prev => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const handleCreatePrediction = async () => {
    if (!selectedMatch) return;

    // Validate form
    if (!predictionForm.title.trim()) {
      alert('Please enter a prediction title');
      return;
    }

    if (predictionForm.options.some(option => !option.text.trim())) {
      alert('Please fill in all option texts');
      return;
    }

    if (!predictionForm.endTime) {
      alert('Please set an end time for the prediction');
      return;
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
      alert('Authentication required. Please refresh the page and try again.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/sports/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          title: predictionForm.title,
          description: predictionForm.description,
          type: predictionForm.type,
          options: predictionForm.options,
          endTime: predictionForm.endTime,
          autoResolve: predictionForm.autoResolve,
          resolutionCriteria: 'full_time_result'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Sports prediction created successfully! Users can now participate with BNB.');
        navigate('/admin');
      } else {
        alert(data.message || 'Failed to create prediction');
      }
    } catch (error) {
      console.error('Error creating prediction:', error);
      alert('Failed to create prediction. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };



  // TODO: Re-enable admin check in production
  // if (!isAdmin) {
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Sports Prediction</h1>
              <p className="text-slate-400 mt-1">
                {step === 'competitions' && 'Select a competition to view upcoming matches'}
                {step === 'matches' && `Upcoming matches in ${selectedCompetition?.name}`}
                {step === 'create' && `Create prediction for ${selectedMatch?.home?.name} vs ${selectedMatch?.away?.name}`}
              </p>
              {currentApiProvider && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-500">
                    Using {currentApiProvider} API
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* API Settings Link */}
            {currentApiProvider && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/sports-api-settings')}
                className="text-xs"
              >
                API Settings
              </Button>
            )}

            {/* Step indicator */}
            <div className="flex items-center space-x-2 text-sm">
            <div className={`px-3 py-1 rounded-full ${step === 'competitions' ? 'bg-purple-600' : 'bg-slate-700'}`}>
              1. Competition
            </div>
            <div className={`px-3 py-1 rounded-full ${step === 'matches' ? 'bg-purple-600' : 'bg-slate-700'}`}>
              2. Match
            </div>
            <div className={`px-3 py-1 rounded-full ${step === 'create' ? 'bg-purple-600' : 'bg-slate-700'}`}>
              3. Create
            </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Step 1: Competition Selection */}
        {step === 'competitions' && !loading && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Select Competition
              </h2>
              <p className="text-slate-400">Choose a league or competition to view upcoming matches</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitions.map((competition) => (
                  <div
                    key={competition.id}
                    onClick={() => handleCompetitionSelect(competition)}
                    className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-purple-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white mb-1">{competition.name}</h3>
                        <div className="flex items-center text-sm text-slate-400">
                          <MapPin className="h-3 w-3 mr-1" />
                          {competition.country?.name || competition.category?.name || 'International'}
                        </div>
                        {competition.category?.name && (
                          <div className="text-xs text-slate-500 mt-1">
                            {competition.category?.name}
                          </div>
                        )}
                      </div>
                      <div className="text-2xl">
                        {(() => {
                          const countryCode = competition.country?.code || competition.category?.country_code;
                          if (countryCode === 'ENG') return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
                          if (countryCode === 'ESP') return '🇪🇸';
                          if (countryCode === 'ITA') return '🇮🇹';
                          if (countryCode === 'GER') return '🇩🇪';
                          if (countryCode === 'FRA') return '🇫🇷';
                          return '⚽';
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {competitions.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-400">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No competitions available at the moment.</p>
                  <Button onClick={fetchCompetitions} className="mt-4">
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Match Selection */}
        {step === 'matches' && !loading && (
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Upcoming Matches
                </h2>
                <p className="text-slate-400">{selectedCompetition?.name} • {selectedCompetition?.country?.name || selectedCompetition?.category?.name || 'International'}</p>
              </div>
              <Button variant="outline" onClick={handleBack}>
                Back to Competitions
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`p-4 bg-slate-800 rounded-lg border transition-colors ${
                      match.hasPrediction
                        ? 'border-yellow-500 opacity-60'
                        : !match.validForPrediction?.valid
                        ? 'border-red-500 opacity-60'
                        : 'border-slate-700 hover:border-purple-500 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!match.hasPrediction && match.validForPrediction?.valid) {
                        handleMatchSelect(match);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-lg font-semibold text-white">
                            {match.home?.name} vs {match.away?.name}
                          </div>
                          <div className="flex items-center text-sm text-slate-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(match.scheduled)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-400">
                            <Clock className="h-3 w-3 mr-1" />
                            In {getTimeUntilMatch(match.scheduled)}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {match.hasPrediction && (
                              <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs">
                                Prediction Exists
                              </span>
                            )}
                            {!match.validForPrediction?.valid && (
                              <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-xs">
                                {match.validForPrediction?.reason}
                              </span>
                            )}
                            {!match.hasPrediction && match.validForPrediction?.valid && (
                              <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs">
                                Available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {matches.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming matches found for this competition.</p>
                  <Button onClick={handleBack} className="mt-4">
                    Try Another Competition
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Create Prediction Form */}
        {step === 'create' && selectedMatch && (
          <div>
            {/* Match details card */}
            <Card className="mb-6">
              <CardHeader className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-white">Selected Match</h2>
                  <p className="text-slate-400">{selectedCompetition?.name}</p>
                </div>
                <Button variant="outline" onClick={handleBack}>
                  Back to Matches
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {selectedMatch?.home?.name} vs {selectedMatch?.away?.name}
                    </div>
                    <div className="text-slate-400 mb-4">
                      {formatDate(selectedMatch.scheduled)} • In {getTimeUntilMatch(selectedMatch.scheduled)}
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm text-slate-400">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {selectedMatch.home.country?.name || 'Unknown'}
                      </div>
                      <div>vs</div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {selectedMatch.away.country?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prediction creation form */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-white">Create Prediction</h2>
                <p className="text-slate-400">Configure the prediction details for this match</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Prediction Title
                      </label>
                      <Input
                        value={predictionForm.title}
                        onChange={(e) => updatePredictionForm('title', e.target.value)}
                        placeholder="Enter prediction title"
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={predictionForm.description}
                        onChange={(e) => updatePredictionForm('description', e.target.value)}
                        placeholder="Enter prediction description"
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Prediction Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Prediction Type
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => updatePredictionForm('type', 'binary')}
                        className={`px-4 py-2 rounded-md border ${
                          predictionForm.type === 'binary'
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Binary (2 options)
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePredictionForm('type', 'multiple')}
                        className={`px-4 py-2 rounded-md border ${
                          predictionForm.type === 'multiple'
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Multiple Choice
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-white">
                        Prediction Options
                      </label>
                      {predictionForm.type === 'multiple' && (
                        <Button
                          onClick={addOption}
                          variant="outline"
                          size="sm"
                          leftIcon={<Plus className="h-4 w-4" />}
                        >
                          Add Option
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {predictionForm.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="flex-1">
                            <Input
                              value={option.text}
                              onChange={(e) => updateOption(index, 'text', e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="bg-slate-800 border-slate-600 text-white"
                            />
                          </div>
                          {predictionForm.options.length > 2 && (
                            <Button
                              onClick={() => removeOption(index)}
                              variant="outline"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Prediction Ends
                      </label>
                      <Input
                        type="datetime-local"
                        value={predictionForm.endTime}
                        onChange={(e) => updatePredictionForm('endTime', e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-blue-300 font-medium mb-1">User-Funded Prediction</h4>
                          <p className="text-blue-200 text-sm">
                            This sports prediction will be funded by user participation. Users will stake BNB to participate,
                            and winners will share the accumulated pool (minus platform fees).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-resolve */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoResolve"
                      checked={predictionForm.autoResolve}
                      onChange={(e) => updatePredictionForm('autoResolve', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="autoResolve" className="text-sm text-white">
                      Auto-resolve prediction based on match result
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCreatePrediction}
                      disabled={isCreating}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isCreating ? 'Creating...' : 'Create Prediction'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCreateSportsPrediction;
