import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  HardHat,
  Check,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

interface Notification {
  id: string;
  type: 'status_update' | 'new_request' | 'review_received' | 'technician_assigned' | 'request_accepted';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  complaintId?: string;
  for: 'user' | 'company';
}

const typeConfig: Record<
  Notification['type'],
  { icon: React.ElementType; iconBg: string; iconColor: string; accent: string }
> = {
  status_update: {
    icon: AlertCircle,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    accent: 'border-l-blue-400',
  },
  request_accepted: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accent: 'border-l-emerald-400',
  },
  technician_assigned: {
    icon: HardHat,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accent: 'border-l-violet-400',
  },
  review_received: {
    icon: Star,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accent: 'border-l-amber-400',
  },
  new_request: {
    icon: Clock,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    accent: 'border-l-orange-400',
  },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UserNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('userAuth');
    if (!isAuth) {
      navigate('/user/login');
      return;
    }

    const loadNotifications = async () => {
      try {
        const response = await apiRequest<{ notifications?: Array<any> }>('/consumer/notification', {}, 'user');
        const mapped = (response.notifications || []).map((notification: any) => ({
          id: notification._id || notification.id,
          type: notification.type || 'status_update',
          title: notification.title || 'Update',
          message: notification.message || 'Your request has an update.',
          createdAt: notification.createdAt || new Date().toISOString(),
          read: notification.isRead ?? false,
          complaintId: notification.request || notification.complaint,
          for: 'user' as const,
        }));
        setNotifications(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [navigate]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = async (id: string) => {
    try {
      await apiRequest(
        `/consumer/notification/${id}/read`,
        {
          method: 'PATCH',
        },
        'user'
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const dismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">
            <Link
              to="/user/dashboard"
              className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700">Notifications</span>
            <div className="flex-1" />
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-base">🐝</span>
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Service Bee
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page title row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Updates on your service requests</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </motion.div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-amber-100 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-amber-300" />
            </div>
            <p className="font-medium text-gray-600">You're all caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No new notifications at the moment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const cfg = typeConfig[notif.type];
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl border border-l-4 shadow-sm transition-all ${cfg.accent} ${
                    notif.read ? 'opacity-75' : 'shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <cfg.icon className={`w-5 h-5 ${cfg.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-semibold ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>
                            {notif.title}
                            {!notif.read && (
                              <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full align-middle" />
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                        <div className="flex items-center gap-2">
                          {notif.complaintId && (
                            <Link
                              to={`/user/requests/${notif.complaintId}`}
                              onClick={() => markRead(notif.id)}
                              className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                            >
                              View request →
                            </Link>
                          )}
                          {!notif.read && (
                            <button
                              onClick={() => markRead(notif.id)}
                              className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Mark read
                            </button>
                          )}
                          <button
                            onClick={() => dismiss(notif.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
