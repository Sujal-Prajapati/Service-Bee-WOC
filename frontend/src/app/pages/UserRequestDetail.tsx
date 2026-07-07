import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MapPin,
  Calendar,
  Phone,
  User,
  Building2,
  MessageSquare,
  Send,
  HardHat,
  Navigation,
} from 'lucide-react';
import { categories } from '../lib/constants';
import { apiRequest } from '../lib/api';

interface Complaint {
  id: string;
  companyName: string;
  category: string;
  description: string;
  address: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  expectedDate?: string;
  pincode?: number;
  createdAt: string;
  resolvedAt?: string;
  estimatedArrival?: string;
  rating?: number;
  feedback?: string;
  companyPhone?: string;
  technician?: { name: string; phone: string; role: string; avatar: string };
}

const statusSteps = [
  { key: 'pending', label: 'Request Submitted', icon: Clock, desc: 'Waiting for company to accept' },
  { key: 'in-progress', label: 'Work In Progress', icon: AlertCircle, desc: 'Technician on the way / working' },
  { key: 'resolved', label: 'Completed', icon: CheckCircle, desc: 'Service successfully delivered' },
] as const;

const statusOrder = { pending: 0, 'in-progress': 1, resolved: 2 };

export default function UserRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // ── Load complaint details ──
  useEffect(() => {
    const isAuth = localStorage.getItem('userAuth');
    if (!isAuth) {
      navigate('/user/login');
      return;
    }

    const loadComplaint = async () => {
      if (!id) return;
      try {
        const response = await apiRequest<{ success?: boolean; request?: any }>('/consumer/request/' + id, {}, 'user');
        const request = response.request;
        const status = request?.status === 'inProgress' ? 'in-progress' : request?.status === 'resolved' ? 'resolved' : request?.status === 'rejected' || request?.status === 'cancelled' ? 'rejected' : 'pending';
        setComplaint({
          id: request?._id || request?.id || id,
          companyName: request?.company?.name || 'Service Provider',
          category: request?.service?.category || 'cleaning',
          description: request?.description || request?.service?.description || 'Request submitted',
          address: request?.address || '',
          expectedDate: request?.expectedDate,
          pincode: request?.pincode,
          status,
          priority: 'medium',
          createdAt: request?.createdAt || new Date().toISOString(),
          resolvedAt: request?.updatedAt,
          estimatedArrival: request?.companyExpectedDate,
          technician: request?.technicianName ? {
            name: request?.technicianName,
            phone: request?.technicianPhone,
            role: request?.technicianRole,
            avatar: request?.technicianName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
          } : undefined,
        });
      } catch {
        setComplaint(null);
      }
    };

    loadComplaint();
  }, [id, navigate]);

  // ── Fetch existing review when request is resolved ──
  // ── Fetch existing review when request is resolved ──
  useEffect(() => {
    if (complaint?.status === 'resolved' && id && !submitted) {
      const fetchReview = async () => {
        setLoadingReview(true);
        try {
          const response = await apiRequest<{ review?: { rating: number; comment: string } }>(
            `/consumer/review/request/${id}`,
            { method: 'POST' },
            'user'
          );
          if (response.review) {
            setRating(response.review.rating);
            setFeedback(response.review.comment || '');
            setSubmitted(true);
          }
        } catch (err: any) {
          // If the error is "Not Found", that just means no review yet – ignore it.
          if (err?.message?.toLowerCase().includes('not found')) {
            setReviewError(''); // clear error
          } else {
            setReviewError(err instanceof Error ? err.message : 'Could not load review');
          }
        } finally {
          setLoadingReview(false);
        }
      };
      fetchReview();
    }
  }, [complaint?.status, id, submitted]); // ✅ added `submitted` as dependency

  // ── Submit review ──
  // ── Submit review ──
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    try {
      await apiRequest(`/consumer/review/${id}`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: feedback }), // ← change here
      }, 'user');


      // Update local state immediately (optimistic update)
      setComplaint((prev) => prev ? { ...prev, rating, feedback } : prev);
      setSubmitted(true);
      setReviewError(''); // clear any previous error
    } catch (err: any) {
      // Show a friendly error
      const message = err?.message || 'Failed to submit review. Please try again.';
      setReviewError(message);
      console.error('Review submission error:', err);
    }
  };

  // ── Render helpers ──
  if (!complaint) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Request not found.</p>
          <Link to="/user/complaints" className="text-amber-600 hover:underline">Back to my requests</Link>
        </div>
      </div>
    );
  }

  const cat = categories.find((c) => c.id === complaint.category);
  const currentStep = statusOrder[complaint.status as keyof typeof statusOrder] ?? 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header (unchanged) */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">
            <Link
              to="/user/complaints"
              className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              My Requests
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700">Request #{complaint.id}</span>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Status timeline (unchanged) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6"
        >
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Request Status</h2>
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-700"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {statusSteps.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                        done
                          ? active
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-200 scale-110'
                            : 'bg-gradient-to-br from-amber-400 to-yellow-500'
                          : 'bg-gray-100'
                      }`}
                    >
                      <step.icon className={`w-5 h-5 ${done ? 'text-white' : 'text-gray-300'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      <p className={`text-[10px] mt-0.5 hidden sm:block ${active ? 'text-amber-600' : 'text-gray-400'}`}>
                        {active ? 'Current' : step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 flex flex-wrap gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Submitted: {formatDateTime(complaint.createdAt)}
            </span>
            {complaint.resolvedAt && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" />
                Resolved: {formatDateTime(complaint.resolvedAt)}
              </span>
            )}
            {complaint.estimatedArrival && complaint.status === 'in-progress' && (
              <span className="flex items-center gap-1 text-blue-600">
                <Clock className="w-3.5 h-3.5" />
                Est. arrival: {formatDate(complaint.estimatedArrival)} at {formatTime(complaint.estimatedArrival)}
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* ── Request details (unchanged) ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-4"
          >
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Request Details</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-2xl">
                {cat?.icon ?? '🔧'}
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">{cat?.name}</p>
                <p className="text-xs text-gray-400 font-mono">#{complaint.id}</p>
              </div>
              <div className="ml-auto">
                {complaint.priority === 'high' && (
                  <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                    High Priority
                  </span>
                )}
                {complaint.priority === 'medium' && (
                  <span className="text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                    Medium
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-800 leading-relaxed">{complaint.description}</p>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{complaint.address}</p>
            </div>
            {complaint.expectedDate && (
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 pt-2">
                <div>
                  <p className="text-xs text-gray-400">Preferred date</p>
                  <p>{new Date(complaint.expectedDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pincode</p>
                  <p>{complaint.pincode || '—'}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-50">
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-medium text-gray-700">{complaint.companyName}</span>
            </div>
          </motion.div>

          {/* ── Technician info (unchanged) ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5"
          >
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Assigned Technician</h2>
            {complaint.technician ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm">
                    {complaint.technician.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{complaint.technician.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <HardHat className="w-3 h-3" />
                      {complaint.technician.role}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <a
                    href={`tel:${complaint.technician.phone}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Call technician</p>
                      <p className="text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                        {complaint.technician.phone}
                      </p>
                    </div>
                  </a>
                  <a
                    href={`tel:${complaint.companyPhone || '+919876543210'}`}
                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Company helpline</p>
                      <p className="text-sm font-semibold text-amber-700">
                        +91 98765 43210
                      </p>
                    </div>
                  </a>
                </div>
                {complaint.estimatedArrival && complaint.status === 'in-progress' && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                    <Navigation className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Estimated arrival</p>
                      <p className="text-sm font-semibold text-green-700">
                        {formatDate(complaint.estimatedArrival)} at {formatTime(complaint.estimatedArrival)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <User className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No technician assigned yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  {complaint.status === 'pending'
                    ? 'Waiting for the company to accept your request.'
                    : 'Details will appear here once assigned.'}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Review / Rating section ── */}
        {complaint.status === 'resolved' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6"
          >
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              {submitted ? 'Your Review' : 'Rate & Review This Service'}
            </h2>

            {loadingReview ? (
              <p className="text-sm text-gray-500">Loading your review…</p>
            ) : reviewError ? (
              <p className="text-sm text-red-500">{reviewError}</p>
            ) : submitted ? (
              // Already reviewed – show the review
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${i < (complaint.rating ?? rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {ratingLabels[complaint.rating ?? rating]}
                  </span>
                </div>
                {(complaint.feedback || feedback) && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-sm text-gray-700 italic leading-relaxed">
                      "{complaint.feedback || feedback}"
                    </p>
                  </div>
                )}
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Review submitted — thank you!
                </p>
              </div>
            ) : (
              // Review form
              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div>
                  <p className="text-sm text-gray-600 mb-3">How was your experience with {complaint.companyName}?</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => setHoverRating(i + 1)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(i + 1)}
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`w-9 h-9 transition-colors ${
                              i < (hoverRating || rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-200 fill-gray-100 hover:text-amber-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {(hoverRating || rating) > 0 && (
                      <span className="text-sm font-semibold text-amber-600">
                        {ratingLabels[hoverRating || rating]}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Write a review <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Share details about your experience — quality of work, punctuality, professionalism…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rating === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Send className="w-4 h-4" />
                  Submit Review
                </button>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}