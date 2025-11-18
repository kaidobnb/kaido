import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileSetupModalProps {
  onClose: () => void;
  onSubmit: (profileData: {
    username?: string;
    email?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
  }) => Promise<void>;
}

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ onClose, onSubmit }) => {
  console.log('ProfileSetupModal rendered');

  const { wallet } = useWallet();
  const { userProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ username?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Pre-fill with existing data if available
  useEffect(() => {
    if (userProfile) {
      if (userProfile.username) setUsername(userProfile.username);
      if (userProfile.email) setEmail(userProfile.email);
    }
  }, [userProfile]);

  const validateForm = (): boolean => {
    const newErrors: { username?: string; email?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    // Email is optional, but if provided, it should be valid
    if (email.trim() && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Pass profile data as an object
      await onSubmit({
        username,
        email: email.trim() ? email : undefined // Only include email if it's provided
      });
      setSuccess(true);

      // Close the modal after showing success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error submitting profile:', error);
      if (error instanceof Error) {
        if (error.message.includes('Username')) {
          setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        } else if (error.message.includes('Email')) {
          setErrors(prev => ({ ...prev, email: 'Email is already taken' }));
        } else {
          // Show generic error
          setErrors(prev => ({
            ...prev,
            username: 'An error occurred. Please try again.',
            email: 'An error occurred. Please try again.'
          }));
        }
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 10001,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div
        className="bg-slate-800 rounded-xl w-full max-w-md overflow-hidden"
        style={{
          border: '2px solid rgb(148, 163, 184)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 0 40px rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Profile Updated!</h3>
              <p className="text-slate-300">
                Your profile has been successfully updated. You can now enjoy all features of SolyMarket!
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-slate-300 mb-4">
                  Welcome to SolyMarket! Please complete your profile to continue.
                </p>
                <div className="bg-slate-700/50 rounded-md p-3 mb-4 flex items-center">
                  <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Wallet Connected</div>
                    <div className="text-white font-medium truncate">
                      {wallet.address ? `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="username" className="block text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full bg-slate-700 border ${
                      errors.username ? 'border-red-500' : 'border-slate-600'
                    } rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    placeholder="Choose a username"
                    disabled={isSubmitting}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">This will be your public @username</p>
                </div>

                <div className="mb-6">
                  <label htmlFor="email" className="block text-slate-300 mb-2">
                    Email <span className="text-slate-400 text-sm">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-slate-700 border ${
                      errors.email ? 'border-red-500' : 'border-slate-600'
                    } rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    placeholder="Enter your email (optional)"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">We'll only use this to notify you about important updates</p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="tertiary"
                    size="md"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    loading={isSubmitting}
                  >
                    Complete Profile
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupModal;
