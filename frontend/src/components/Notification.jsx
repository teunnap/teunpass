import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const TYPE_CONFIG = {
  success: {
    colorClasses: 'bg-green-100 text-green-800 border-green-200',
    Icon: CheckCircle2
  },
  error: {
    colorClasses: 'bg-red-100 text-red-800 border-red-200',
    Icon: AlertCircle
  },
  warning: {
    colorClasses: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Icon: AlertTriangle
  },
  default: {
    colorClasses: 'bg-slate-100 text-slate-800 border-slate-200',
    Icon: Info
  }
};

const Notification = ({ notification }) => {
  if (!notification || !notification.message) return null;

  const { message, type = 'success', isLeaving } = notification;
  const { colorClasses, Icon } = TYPE_CONFIG[type] || TYPE_CONFIG.default;
  const animationClass = isLeaving ? 'animate-slide-out' : 'animate-slide-in';
  const role = (type === 'error' || type === 'warning') ? 'alert' : 'status';
  const ariaLive = (type === 'error' || type === 'warning') ? 'assertive' : 'polite';

  return (
    <div role={role} aria-live={ariaLive} className={`fixed top-6 left-1/2 -translate-x-1/2 border px-6 py-3 rounded-full shadow-lg z-50 transition-all font-medium text-sm flex items-center gap-2 ${animationClass} ${colorClasses}`}>
      <Icon className="w-4 h-4" aria-hidden="true" />
      {message}
    </div>
  );
};

export default Notification;
