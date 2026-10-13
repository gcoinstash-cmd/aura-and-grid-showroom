import React from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  AlertCircle, 
  Info, 
  CheckCircle2 
} from 'lucide-react';
import { SystemNotification } from '../../types/engine';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllAsRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col font-mono">
          {/* Header */}
          <div className="bg-zinc-950 p-6 sm:p-7 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Bell className="w-7 h-7 text-amber-400" />
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  Real-Time Vault Alerts
                </h3>
                <p className="text-sm sm:text-base text-zinc-400 mt-1">
                  Telemetry & Security Notifications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onMarkAllAsRead}
                title="Mark all notifications as read"
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white transition-colors text-sm sm:text-base font-bold flex items-center gap-2"
              >
                <CheckCheck className="w-5 h-5 text-emerald-400" />
                <span className="hidden sm:inline">Mark Read</span>
              </button>
              <button
                onClick={onClose}
                aria-label="Close Notifications"
                className="text-zinc-400 hover:text-white p-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition-colors space-y-2.5 ${
                  notif.read
                    ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
                    : 'bg-zinc-950 border-amber-500/50 text-zinc-100 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-black text-base sm:text-lg text-white">
                    {notif.level === 'alert' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                    {notif.level === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {notif.level === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
                    <span>{notif.title}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-500 font-mono">
                    {notif.timestamp.replace('T', ' ').substring(0, 19)}
                  </span>
                </div>
                <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-sans font-medium">
                  {notif.message}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4.5 bg-zinc-950 border-t border-zinc-800 text-base text-zinc-300 text-center font-bold">
            GF-T3-167 Telemetry Broadcast Channel
          </div>
        </div>
      </div>
    </div>
  );
};
