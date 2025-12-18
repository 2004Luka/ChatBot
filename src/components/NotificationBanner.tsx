import { useEffect } from 'react';
import './NotificationBanner.css';

interface NotificationBannerProps {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
  autoHideDelay?: number;
}

export const NotificationBanner = ({ isVisible, onClose, message = 'Please write your messages in English for the best experience!', autoHideDelay = 5000 }: NotificationBannerProps) => {
  useEffect(() => {
    if (isVisible && autoHideDelay > 0) {
      const timer = setTimeout(onClose, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`notification-banner ${isVisible ? 'show' : ''}`}>
      <div className="notification-content">
        <div className="notification-text">{message}</div>
        <button className="notification-close" onClick={onClose} aria-label="Close notification">×</button>
      </div>
    </div>
  );
};

