import React from 'react';
import { Award, MessageCircle, ArrowRight, Clock, CheckCircle, Users, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Notification {
  id: string;
  type: 'winnings' | 'prediction_resolved' | 'prediction_created' | 'comment' | 'system' | 'prediction_win' | 'prediction_loss' | 'new_comment' | 'reward_claim' | 'referral_bonus';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  predictionId?: string;
  data?: any;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'winnings':
        return <Award className="h-5 w-5 text-yellow-400" />;
      case 'prediction_win':
        return <Award className="h-5 w-5 text-green-400" />;
      case 'prediction_loss':
        return <Award className="h-5 w-5 text-red-400" />;
      case 'prediction_resolved':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'prediction_created':
        return <Clock className="h-5 w-5 text-blue-400" />;
      case 'comment':
      case 'new_comment':
        return <MessageCircle className="h-5 w-5 text-purple-400" />;
      case 'reward_claim':
        return <Award className="h-5 w-5 text-amber-400" />;
      case 'referral_bonus':
        return <Users className="h-5 w-5 text-green-400" />;
      case 'system':
        return <Info className="h-5 w-5 text-slate-400" />;
      default:
        return <ArrowRight className="h-5 w-5 text-slate-400" />;
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    onMarkAsRead(notification.id);

    // Close dropdown
    onClose();

    // If there's a predictionId, navigate to the prediction page with includeResolved=true
    // This ensures resolved predictions can still be viewed
    if (notification.predictionId) {
      window.location.href = `/prediction/${notification.predictionId}?includeResolved=true`;
    } else if (notification.type === 'referral_bonus') {
      window.location.href = '/referrals';
    } else if (notification.link) {
      // Use the link if provided
      // The Link component will handle this navigation
    } else {
      // Default to home page if no link or predictionId
      window.location.href = '/';
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-black/95 rounded-lg shadow-lg border border-yellow-500/30 overflow-hidden backdrop-blur-sm"
         style={{
           maxHeight: '80vh',
           overflowY: 'auto',
           transform: 'translateZ(0)',
           touchAction: 'manipulation',
           zIndex: 9999,
           position: 'fixed',
           right: '16px',
           top: 'auto'
         }}>
      <div className="p-3 border-b border-yellow-500/30 flex justify-between items-center sticky top-0 bg-black/95 z-10">
        <h3 className="text-white font-medium">Notifications</h3>
        <button
          onClick={onMarkAllAsRead}
          className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors p-2 -m-2"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <p>No notifications</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-yellow-500/20 hover:bg-yellow-500/10 transition-colors ${
                  !notification.read ? 'bg-yellow-500/5' : ''
                }`}
              >
                {notification.link ? (
                  <Link
                    to={notification.link}
                    className="block p-2 -m-2"
                    onClick={() => handleNotificationClick(notification)}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <NotificationItem notification={notification} formatRelativeTime={formatRelativeTime} getNotificationIcon={getNotificationIcon} />
                  </Link>
                ) : (
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className="p-2 -m-2"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <NotificationItem notification={notification} formatRelativeTime={formatRelativeTime} getNotificationIcon={getNotificationIcon} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-yellow-500/30 text-center">
        <Link
          to="/profile/notifications"
          className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
          onClick={onClose}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

// Separate component for notification item to avoid code duplication
const NotificationItem: React.FC<{
  notification: Notification;
  formatRelativeTime: (timestamp: string) => string;
  getNotificationIcon: (type: Notification['type']) => React.ReactNode;
}> = ({ notification, formatRelativeTime, getNotificationIcon }) => (
  <>
    <div className="flex items-start">
      <div className="mr-3 mt-1">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1">
        <h4 className="text-white text-sm font-medium">{notification.title}</h4>
        <p className="text-slate-300 text-xs mt-1">{notification.message}</p>
        <span className="text-slate-400 text-xs mt-1 block">
          {formatRelativeTime(notification.timestamp)}
        </span>
      </div>
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1"></div>
      )}
    </div>
  </>
);

export default NotificationDropdown;
