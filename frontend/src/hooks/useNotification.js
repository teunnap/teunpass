import { useState, useCallback, useRef } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState(null);
  const showTimer = useRef(null), hideTimer = useRef(null);

  const clearNotification = useCallback(() => {
    setNotification(p => p ? { ...p, isLeaving: true } : null);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setNotification(null), 300);
  }, []);

  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
    setNotification({ message, type, isLeaving: false });
    showTimer.current = setTimeout(clearNotification, duration);
  }, [clearNotification]);

  return { notification, showNotification, clearNotification };
};
