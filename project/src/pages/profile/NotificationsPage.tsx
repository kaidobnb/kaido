import React, { useState } from 'react';
import { Award, ArrowRight, Clock, CheckCircle, MessageCircle, Trash2, Check } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNotifications } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { Notification } from '../../components/notifications/NotificationDropdown';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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

  // Format date for full date display
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'winnings':
        return <Award className="h-5 w-5 text-yellow-400" />;
      case 'prediction_resolved':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'prediction_created':
        return <Clock className="h-5 w-5 text-blue-400" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-yellow-400" />;
      case 'system':
        return <ArrowRight className="h-5 w-5 text-slate-400" />;
      default:
        return <ArrowRight className="h-5 w-5 text-slate-400" />;
    }
  };

  // Filter notifications based on current filter
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.read);

  // Group notifications by date
  const groupedNotifications: { [key: string]: Notification[] } = {};
  
  filteredNotifications.forEach(notification => {
    const date = new Date(notification.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey = '';
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    
    if (!groupedNotifications[groupKey]) {
      groupedNotifications[groupKey] = [];
    }
    
    groupedNotifications[groupKey].push(notification);
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl text-white font-medium mb-4 md:mb-0">Notifications</h1>
          
          <div className="flex space-x-3">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                className={`px-4 py-2 rounded-md text-sm ${
                  filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm ${
                  filter === 'unread' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="tertiary"
                size="sm"
                leftIcon={<Check className="h-4 w-4" />}
                onClick={markAllAsRead}
              >
                Mark All Read
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={clearNotifications}
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader className="border-b border-slate-700">
            <h2 className="text-xl text-white font-medium">Your Notifications</h2>
          </CardHeader>
          
          <CardContent className="p-0">
            {Object.keys(groupedNotifications).length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                  <Bell className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg text-white font-medium mb-2">No notifications</h3>
                <p className="text-slate-400">
                  {filter === 'all' 
                    ? "You don't have any notifications yet." 
                    : "You don't have any unread notifications."}
                </p>
              </div>
            ) : (
              <div>
                {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                  <div key={date}>
                    <div className="bg-slate-800 px-6 py-2 sticky top-0">
                      <h3 className="text-sm font-medium text-slate-400">{date}</h3>
                    </div>
                    
                    {dateNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`border-b border-slate-700 p-4 hover:bg-slate-800/50 transition-colors ${
                          !notification.read ? 'bg-slate-800/20' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="bg-slate-800 p-2 rounded-full mr-4 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1">
                            {notification.link ? (
                              <Link 
                                to={notification.link} 
                                className="block"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <h4 className="text-white font-medium">{notification.title}</h4>
                                <p className="text-slate-300 text-sm mt-1">{notification.message}</p>
                              </Link>
                            ) : (
                              <>
                                <h4 className="text-white font-medium">{notification.title}</h4>
                                <p className="text-slate-300 text-sm mt-1">{notification.message}</p>
                              </>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-slate-400 text-xs">
                                {formatDate(notification.timestamp)}
                              </span>
                              
                              {!notification.read && (
                                <Button
                                  variant="tertiary"
                                  size="xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark as read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Bell icon component for the empty state
const Bell: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export default NotificationsPage;
