import React, { useState, useEffect, useRef } from 'react';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Bell, User, Mail, Upload } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../hooks/useToast';
import { uploadProfilePicture } from '../services/api';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications'>('profile');
  const { wallet, userProfile, updateProfile } = useWallet();
  const { showToast } = useToast();

  // AppKit hooks removed (were only used for wallet tab)

  // Profile settings state
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Account settings state
  const [email, setEmail] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [timezone, setTimezone] = useState<string>('UTC (Coordinated Universal Time)');

  // Notification settings state
  const [predictionUpdates, setPredictionUpdates] = useState<boolean>(true);
  const [marketAlerts, setMarketAlerts] = useState<boolean>(true);
  const [rewardNotifications, setRewardNotifications] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false);

  // Initialize form values from user profile
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || 'Crypto Trader');
      setUsername(userProfile.username || 'cryptotrader');
      setBio(userProfile.bio || 'Passionate about crypto and prediction markets. Always looking for the next big opportunity.');
      setEmail(userProfile.email || 'user@example.com');
      setAvatar(userProfile.avatar || '');
    }
  }, [userProfile]);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Profile picture must be less than 5MB'
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please upload an image file'
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Create a preview URL for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setAvatar(previewUrl);

      // Upload the file to the server
      const response = await uploadProfilePicture(file);

      if (response.success) {
        // Update the avatar URL with the one from the server
        setAvatar(response.avatarUrl);

        // Update the profile with the new avatar URL
        await updateProfile({
          avatar: response.avatarUrl
        });

        showToast({
          type: 'success',
          title: 'Profile Picture Updated',
          message: 'Your profile picture has been updated successfully'
        });
      } else {
        throw new Error(response.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload profile picture. Please try again.'
      });

      // Revert to the previous avatar if there was an error
      if (userProfile?.avatar) {
        setAvatar(userProfile.avatar);
      } else {
        setAvatar('');
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle profile save
  const handleProfileSave = async () => {
    try {
      await updateProfile({
        username,
        email,
        displayName,
        bio
      });

      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.'
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Profile Settings</h2>
              <p className="text-slate-400 text-sm">Manage your public profile information</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">This will be your public @username</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Bio</label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Profile Picture</label>
                <div className="flex items-center">
                  <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mr-4 overflow-hidden">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      leftIcon={<Upload className="h-4 w-4" />}
                    >
                      Upload Picture
                    </Button>
                    {avatar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAvatar('');
                          updateProfile({ avatar: '' });
                          showToast({
                            type: 'info',
                            title: 'Profile Picture Removed',
                            message: 'Your profile picture has been removed'
                          });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Recommended: Square image, at least 200x200 pixels</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-700 pt-4 flex justify-end">
              <Button variant="primary" onClick={handleProfileSave}>Save Changes</Button>
            </CardFooter>
          </>
        );
      case 'account':
        return (
          <>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Account Settings</h2>
              <p className="text-slate-400 text-sm">Manage your account details and preferences</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Language</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Japanese</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Time Zone</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option>UTC (Coordinated Universal Time)</option>
                  <option>EST (Eastern Standard Time)</option>
                  <option>CST (Central Standard Time)</option>
                  <option>PST (Pacific Standard Time)</option>
                </select>
              </div>
              <div className="pt-2">
                <h3 className="text-md font-medium text-white mb-2">Danger Zone</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    showToast({
                      type: 'info',
                      title: 'Account Deactivation',
                      message: 'This feature is not available in the current version.'
                    });
                  }}
                >
                  Deactivate Account
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-700 pt-4 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  showToast({
                    type: 'success',
                    title: 'Account Updated',
                    message: 'Your account settings have been updated successfully'
                  });
                }}
              >
                Save Changes
              </Button>
            </CardFooter>
          </>
        );
      case 'notifications':
        return (
          <>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Notification Settings</h2>
              <p className="text-slate-400 text-sm">Control how you receive notifications</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <Bell className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Prediction Updates</p>
                      <p className="text-slate-400 text-xs">Get notified about changes in your predictions</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={predictionUpdates}
                      onChange={() => {
                        setPredictionUpdates(!predictionUpdates);
                        showToast({
                          type: 'info',
                          title: 'Setting Updated',
                          message: `Prediction updates ${!predictionUpdates ? 'enabled' : 'disabled'}`
                        });
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <Bell className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Market Alerts</p>
                      <p className="text-slate-400 text-xs">Receive alerts about new prediction markets</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={marketAlerts}
                      onChange={() => {
                        setMarketAlerts(!marketAlerts);
                        showToast({
                          type: 'info',
                          title: 'Setting Updated',
                          message: `Market alerts ${!marketAlerts ? 'enabled' : 'disabled'}`
                        });
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <Bell className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Reward Notifications</p>
                      <p className="text-slate-400 text-xs">Get notified when you earn rewards</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={rewardNotifications}
                      onChange={() => {
                        setRewardNotifications(!rewardNotifications);
                        showToast({
                          type: 'info',
                          title: 'Setting Updated',
                          message: `Reward notifications ${!rewardNotifications ? 'enabled' : 'disabled'}`
                        });
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <Mail className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Email Notifications</p>
                      <p className="text-slate-400 text-xs">Receive email updates about your account</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={() => {
                        setEmailNotifications(!emailNotifications);
                        showToast({
                          type: 'info',
                          title: 'Setting Updated',
                          message: `Email notifications ${!emailNotifications ? 'enabled' : 'disabled'}`
                        });
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-700 pt-4 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  showToast({
                    type: 'success',
                    title: 'Notification Settings Saved',
                    message: 'Your notification preferences have been updated'
                  });
                }}
              >
                Save Changes
              </Button>
            </CardFooter>
          </>
        );
      /* Security tab removed as requested */
      /* Wallet tab removed as requested */
      /* Appearance tab removed as requested */
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                <button
                  className={`flex items-center w-full px-4 py-3 text-left ${
                    activeTab === 'profile'
                      ? 'bg-purple-500/10 border-l-4 border-purple-500'
                      : 'hover:bg-slate-800'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User className={`h-5 w-5 mr-3 ${activeTab === 'profile' ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span className={`${activeTab === 'profile' ? 'text-white' : 'text-slate-400'}`}>Profile</span>
                </button>

                <button
                  className={`flex items-center w-full px-4 py-3 text-left ${
                    activeTab === 'account'
                      ? 'bg-purple-500/10 border-l-4 border-purple-500'
                      : 'hover:bg-slate-800'
                  }`}
                  onClick={() => setActiveTab('account')}
                >
                  <Mail className={`h-5 w-5 mr-3 ${activeTab === 'account' ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span className={`${activeTab === 'account' ? 'text-white' : 'text-slate-400'}`}>Account</span>
                </button>

                <button
                  className={`flex items-center w-full px-4 py-3 text-left ${
                    activeTab === 'notifications'
                      ? 'bg-purple-500/10 border-l-4 border-purple-500'
                      : 'hover:bg-slate-800'
                  }`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className={`h-5 w-5 mr-3 ${activeTab === 'notifications' ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span className={`${activeTab === 'notifications' ? 'text-white' : 'text-slate-400'}`}>Notifications</span>
                </button>

                {/* Security tab removed as requested */}
                {/* Wallet tab removed as requested */}

                {/* Appearance tab removed as requested */}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            {renderTabContent()}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
