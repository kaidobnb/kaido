import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Allow time for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Allow time for exit animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-200" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-200" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-200" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-200" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600/90 border-green-400/60 shadow-green-500/50';
      case 'error':
        return 'bg-red-600/90 border-red-400/60 shadow-red-500/50';
      case 'info':
        return 'bg-blue-600/90 border-blue-400/60 shadow-blue-500/50';
      case 'warning':
        return 'bg-yellow-600/90 border-yellow-400/60 shadow-yellow-500/50';
      default:
        return 'bg-slate-800/90 border-slate-700 shadow-slate-500/50';
    }
  };

  return (
    <div
      className={`${
        isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      } transform transition-all duration-300 ease-out w-full`}
    >
      <div
        className={`${getBgColor()} rounded-xl border-2 shadow-2xl p-4 flex items-start gap-3 backdrop-blur-xl`}
        style={{
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
        }}
      >
        <div className="flex-shrink-0 mt-0.5 drop-shadow-lg">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white drop-shadow-md">{title}</h3>
          <p className="mt-1.5 text-sm text-white/95 font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200"
          aria-label="Close notification"
        >
          <X className="w-5 h-5 drop-shadow-md" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
