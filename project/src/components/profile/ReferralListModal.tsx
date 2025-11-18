import React from 'react';
import { X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

interface ReferredUser {
  id: string;
  username: string;
  avatar?: string;
  joinedAt: string;
}

interface ReferralListModalProps {
  isOpen: boolean;
  onClose: () => void;
  referredUsers: ReferredUser[];
}

const ReferralListModal: React.FC<ReferralListModalProps> = ({ isOpen, onClose, referredUsers }) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-900 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-medium text-white">Your Referrals</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {referredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">You haven't referred any users yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referredUsers.map(user => (
                <div key={user.id} className="bg-slate-800 rounded-lg p-3 flex items-center">
                  <Avatar
                    src={user.avatar || '/images/default-avatar.png'}
                    alt={user.username || 'Anonymous'}
                    size="sm"
                    className="mr-3"
                  />
                  <div className="flex-grow">
                    <div className="text-white font-medium">{user.username || 'Anonymous'}</div>
                    <div className="text-xs text-slate-400">Joined {formatDate(user.joinedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReferralListModal;
