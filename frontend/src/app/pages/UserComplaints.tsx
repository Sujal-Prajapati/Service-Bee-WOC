import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MapPin,
  Calendar,
  X,
  ChevronRight,
  HardHat,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

interface Complaint {
  id: string;
  companyName: string;
  description: string;
  address: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  rating?: number;
  feedback?: string;
  technician?: { name: string };
}

export default function UserComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('userAuth');
    if (!isAuth) {
      navigate('/user/login');
      return;
    }

    const loadComplaints = async () => {
      try {
        const response = await apiRequest<{ success?: boolean; requests?: Array<any> }>('/consumer/request', {}, 'user');
        const mapped = (response.requests || []).map((request: any) => {
          const status: Complaint['status'] = request.status === 'inProgress'
            ? 'in-progress'
            : request.status === 'resolved'
            ? 'resolved'
            : request.status === 'rejected' || request.status === 'cancelled'
            ? 'rejected'
            : 'pending';
          return {
            id: request._id || request.id,
            companyName: request.company?.name || request.service?.company?.name || 'Service Provider',
            description: request.description || request.service?.description || 'Request submitted',
            address: request.address || '',
            status,
            createdAt: request.createdAt || new Date().toISOString(),
            resolvedAt: request.updatedAt,
            technician: request.technicianName ? { name: request.technicianName } : undefined,
          };
        });
        setComplaints(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load requests');
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [navigate]);

  const getStatusConfig = (status: Complaint['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          label: 'Pending',
        };
      case 'in-progress':
        return {
          icon: AlertCircle,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'In Progress',
        };
      case 'resolved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Resolved',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-slate-600',
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          label: 'Unknown',
        };
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComplaint) {
      const updated = complaints.map((c) =>
        c.id === selectedComplaint.id
          ? { ...c, rating, feedback }
          : c
      );
      setComplaints(updated);
      alert(`Thank you for your feedback! Rating: ${rating} stars`);
      setShowFeedbackModal(false);
      setSelectedComplaint(null);
      setRating(0);
      setFeedback('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link
              to="/user/dashboard"
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div className="flex-1" />
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🐝</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Service Bee
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Service Requests</h1>
          <p className="text-gray-600">Track and manage all your service requests</p>
        </motion.div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: 'Pending',
              count: complaints.filter((c) => c.status === 'pending').length,
              color: 'from-amber-500 to-yellow-500',
            },
            {
              label: 'In Progress',
              count: complaints.filter((c) => c.status === 'in-progress').length,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              label: 'Resolved',
              count: complaints.filter((c) => c.status === 'resolved').length,
              color: 'from-green-500 to-emerald-500',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-xl shadow-md p-6 border border-amber-100"
            >
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.count}
              </div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading requests...</div>
        ) : (
        <div className="space-y-4">
          {complaints.map((complaint, index) => {
            const statusConfig = getStatusConfig(complaint.status);
            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-white rounded-xl shadow-md p-6 border border-amber-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {complaint.companyName}
                      </h3>
                      <span
                        className={`px-3 py-1 ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} rounded-full text-sm font-semibold border flex items-center gap-1`}
                      >
                        <statusConfig.icon className="w-4 h-4" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{complaint.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {complaint.address}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Submitted: {formatDate(complaint.createdAt)}
                      </div>
                      {complaint.resolvedAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Resolved: {formatDate(complaint.resolvedAt)}
                        </div>
                      )}
                      {(complaint as any).technician && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <HardHat className="w-4 h-4" />
                          {(complaint as any).technician.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/user/requests/${complaint.id}`}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex-shrink-0"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {complaint.status === 'resolved' && !complaint.rating && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to={`/user/requests/${complaint.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                    >
                      <Star className="w-4 h-4" />
                      Rate & Review
                    </Link>
                  </div>
                )}

                {complaint.rating && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < complaint.rating!
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {complaint.feedback && (
                      <p className="text-sm text-gray-600 italic">"{complaint.feedback}"</p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        )}

        {complaints.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
            <p className="text-gray-600 mb-6">Start by submitting a service request</p>
            <Link
              to="/user/dashboard"
              className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Browse Services
            </Link>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Rate Service</h2>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedComplaint(null);
                  setRating(0);
                  setFeedback('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="font-semibold text-gray-900">{selectedComplaint.companyName}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedComplaint.description}</div>
            </div>
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How was your experience?
                </label>
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i + 1)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          i < rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="Share your experience..."
                />
              </div>
              <button
                type="submit"
                disabled={rating === 0}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Submit Feedback
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
