import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bell,
  Star,
  Clock,
  Check,
  Trash2,
  Wrench,
  MessageSquare,
  Settings,
  LogOut,
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
  { icon: React.ElementType; iconBg: string; iconColor: string; accent: string; label: string }
> = {
  new_request: {
    icon: Clock,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accent: 'border-l-amber-400',
    label: 'New Request',
  },
  review_received: {
    icon: Star,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    accent: 'border-l-yellow-400',
    label: 'Review',
  },
  status_update: {
    icon: Bell,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    accent: 'border-l-blue-400',
    label: 'Update',
  },
  request_accepted: {
    icon: Bell,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accent: 'border-l-emerald-400',
    label: 'Accepted',
  },
  technician_assigned: {
    icon: Bell,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accent: 'border-l-violet-400',
    label: 'Assigned',
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

export default function CompanyNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check auth on mount
  useEffect(() => {
    const isAuth = localStorage.getItem('companyAuth');
    if (!isAuth) {
      navigate('/company/login');
    }
  }, [navigate]);

  // Fetch notifications whenever filter changes
  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      setError('');
      try {
        // Determine endpoint based on filter
        const endpoint = filter === 'all' 
          ? '/company/notification' 
          : '/company/notification/unread';

        const response = await apiRequest<{ notifications?: Array<any> }>(
          endpoint,
          {},
          'company'
        );

        const mapped = (response.notifications || []).map((notification: any) => ({
          id: notification._id || notification.id,
          type: notification.type || 'status_update',
          title: notification.title || 'Update',
          message: notification.message || 'Your request has an update.',
          createdAt: notification.createdAt || new Date().toISOString(),
          read: notification.isRead || false,
          complaintId: notification.request || notification.complaint,
          for: 'company' as const,
        }));

        setNotifications(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [filter, navigate]); // Re-fetch when filter changes

  const handleLogout = () => {
    localStorage.removeItem('companyAuth');
    localStorage.removeItem('companyEmail');
    localStorage.removeItem('companyName');
    navigate('/');
  };

  const companyName = localStorage.getItem('companyName') || 'Company';
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await apiRequest('/company/notification/read-all', { method: 'PATCH' }, 'company');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiRequest(`/company/notification/${id}/read`, { method: 'PATCH' }, 'company');
      // Update local state optimistically
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Failed to mark as read', err);
      // Optionally revert state
    }
  };

  const dismiss = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  // Display all or filter unread? Since we already fetch only unread when filter='unread',
  // but we might still want to show only unread from the fetched list. We'll keep the local filter.
  const displayed = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (unchanged) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-base">🐝</span>
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Service Bee
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link to="/company/dashboard" className="px-3 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                Requests
              </Link>
              <Link to="/company/services/create" className="px-3 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />Services
              </Link>
              <Link to="/company/reviews" className="px-3 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />Reviews
              </Link>
              <Link to="/company/profile" className="px-3 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />Settings
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {companyName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{companyName}</span>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/company/dashboard" className="flex items-center gap-1 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Notifications</span>
        </div>

        {/* Title + controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-5"
        >
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">New requests, reviews, and updates</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 text-xs">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors capitalize ${
                    filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading notifications...</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-gray-300" />
            </div>
            <p className="font-medium text-gray-600">
              {filter === 'unread' ? 'No unread notifications' : "You're all caught up!"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'unread' ? 'Switch to "All" to see past notifications.' : 'New requests and reviews will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((notif, i) => {
              const cfg = typeConfig[notif.type];
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl border border-l-4 shadow-sm transition-all ${cfg.accent} ${
                    notif.read ? '' : 'shadow-md ring-1 ring-black/5'
                  }`}
                >
                  <div className="flex items-start gap-4 p-4">
                    <div className={`w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <cfg.icon className={`w-5 h-5 ${cfg.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold ${cfg.iconColor} bg-opacity-10 px-2 py-0.5 rounded-full ${cfg.iconBg}`}>
                          {cfg.label}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm font-semibold mt-1 ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                        <div className="flex items-center gap-2">
                          {notif.complaintId && (
                            <Link
                              to="/company/dashboard"
                              onClick={() => markRead(notif.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
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