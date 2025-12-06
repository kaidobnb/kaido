import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader, Lightbulb, Globe } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface EventCategory {
  id: string;
  name: string;
  description: string;
  requiredFields: string[];
  exampleClaim: string;
  suggestedSources: string[];
}

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
}

export default function CreateRealWorldPredictionPage() {
  const navigate = useNavigate();
  
  // Step 1: Select event category
  const [step, setStep] = useState<'category' | 'claim' | 'details' | 'review'>('category');
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  
  // Step 2: Enter claim
  const [claim, setClaim] = useState('');
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  
  // Step 3: Prediction details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entryFee, setEntryFee] = useState('0.01');
  
  // Step 4: Generated schema
  const [schema, setSchema] = useState<any>(null);
  const [suggestedSources, setSuggestedSources] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load event categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/realworld/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load event categories');
    }
  };

  const handleCategorySelect = (category: EventCategory) => {
    setSelectedCategory(category);
    setClaim('');
    setValidation(null);
    setStep('claim');
  };

  const handleValidateClaim = async () => {
    if (!selectedCategory || !claim.trim()) return;

    setValidating(true);
    setValidation(null);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/realworld/validate-claim`, {
        eventType: selectedCategory.id,
        claim: claim.trim(),
      });

      if (response.data.success) {
        setValidation(response.data.data);
        
        if (response.data.data.isValid) {
          // Auto-fill title with claim
          setTitle(claim.trim());
          // Generate schema
          await generateSchema();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate claim');
    } finally {
      setValidating(false);
    }
  };

  const generateSchema = async () => {
    if (!selectedCategory || !claim.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/api/realworld/generate-schema`, {
        eventType: selectedCategory.id,
        claim: claim.trim(),
      });

      if (response.data.success) {
        setSchema(response.data.data.schema);
        setSuggestedSources(response.data.data.suggestedSources);
      }
    } catch (err: any) {
      console.error('Error generating schema:', err);
    }
  };

  const handleNext = () => {
    if (step === 'claim' && validation?.isValid) {
      setStep('details');
    } else if (step === 'details') {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('claim');
    } else if (step === 'claim') {
      setStep('category');
    } else if (step === 'review') {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !validation?.isValid) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/predictions`,
        {
          title,
          description,
          type: 'binary',
          category: 'realworld',
          choices: ['YES', 'NO'],
          endDate: new Date(endDate).toISOString(),
          entryFee: parseFloat(entryFee),
          tokenType: 'BNB',
          oracleData: {
            requiresOracle: true,
            eventType: selectedCategory.id,
            claim: claim.trim(),
            schema,
            suggestedSources,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        navigate(`/prediction/${response.data.prediction._id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Create Real-World Event Prediction</h1>
          </div>
          <p className="text-gray-300">
            Create verifiable predictions about real-world events using AI-powered oracle verification
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['category', 'claim', 'details', 'review'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === s
                    ? 'bg-purple-500 text-white'
                    : ['category', 'claim', 'details', 'review'].indexOf(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && <div className="w-16 h-1 bg-gray-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
          {/* Step 1: Select Category */}
          {step === 'category' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Select Event Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className="bg-gray-700/50 hover:bg-purple-600/20 border border-gray-600 hover:border-purple-500 rounded-lg p-6 text-left transition-all"
                  >
                    <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                    <div className="flex items-center gap-2 text-purple-400 text-sm">
                      <Lightbulb className="w-4 h-4" />
                      <span>Example: {category.exampleClaim}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Enter Claim */}
          {step === 'claim' && selectedCategory && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Enter Your Claim</h2>
              <p className="text-gray-400 mb-6">
                Category: <span className="text-purple-400 font-semibold">{selectedCategory.name}</span>
              </p>

              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">
                  What do you want to predict?
                </label>
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder={selectedCategory.exampleClaim}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 min-h-[120px]"
                />
                <p className="text-gray-500 text-sm mt-2">
                  Required fields: {selectedCategory.requiredFields.join(', ')}
                </p>
              </div>

              <button
                onClick={handleValidateClaim}
                disabled={!claim.trim() || validating}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {validating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Claim'
                )}
              </button>

              {validation && (
                <div
                  className={`mt-6 p-4 rounded-lg border ${
                    validation.isValid
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-red-500/10 border-red-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {validation.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={validation.isValid ? 'text-green-400' : 'text-red-400'}>
                        {validation.reason}
                      </p>
                      {validation.suggestions && validation.suggestions.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {validation.suggestions.map((suggestion, i) => (
                            <li key={i} className="text-gray-400 text-sm">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!validation?.isValid}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Prediction Details */}
          {step === 'details' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Prediction Details</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more context about this prediction..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">End Date</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Entry Fee (BNB)</label>
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    min="0.001"
                    step="0.001"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!title || !endDate || !entryFee}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 'review' && selectedCategory && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Review & Submit</h2>

              <div className="space-y-4 mb-8">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Category</p>
                  <p className="text-white font-semibold">{selectedCategory.name}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Claim</p>
                  <p className="text-white">{claim}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Title</p>
                  <p className="text-white">{title}</p>
                </div>

                {description && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Description</p>
                    <p className="text-white">{description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">End Date</p>
                    <p className="text-white">{new Date(endDate).toLocaleString()}</p>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Entry Fee</p>
                    <p className="text-white">{entryFee} BNB</p>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500 rounded-lg p-4">
                  <p className="text-purple-400 font-semibold mb-2">Oracle Verification</p>
                  <p className="text-gray-300 text-sm mb-2">
                    This prediction will be automatically verified using our AI-powered oracle system.
                  </p>
                  <p className="text-gray-400 text-sm">
                    Verification sources: {suggestedSources.join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Prediction'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

