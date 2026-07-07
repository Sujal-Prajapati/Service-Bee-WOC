import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  HardHat,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  X,
  FileText,
  CalendarDays,
  MessageSquare,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { categories } from '../lib/constants';

// ─── Interfaces ───────────────────────────────────────────────
interface RequestDetail {
  _id: string;
  status: 'pending' | 'inProgress' | 'rejected' | 'resolved' | 'cancelled';
  description?: string;
  address: string;
  pincode: number;
  expectedDate?: string;
  consumerNote?: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRole?: string;
  companyExpectedDate?: string;
  createdAt: string;
  updatedAt: string;
  consumer: { _id: string; name: string; phone: string };
  company: { _id: string; name: string };
  service: { _id: string; name: string; category: string; description?: string };
}

interface AcceptForm {
  technicianName: string;
  technicianPhone: string;
  technicianRole: string;
  estimatedArrival: string;
  notes: string;
}
interface RejectForm {
  reason: string;
}

// ─── Status config ────────────────────────────────────────────
const statusConfig: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  inProgress: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
};

// ─── Main Component ──────────────────────────────────────────
export default function CompanyRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAccept, setShowAccept] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [acceptForm, setAcceptForm] = useState<AcceptForm>({
    technicianName: '',
    technicianPhone: '',
    technicianRole: '',
    estimatedArrival: '',
    notes: '',
  });
  const [rejectForm, setRejectForm] = useState<RejectForm>({ reason: '' });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await apiRequest<{ request: RequestDetail }>(
          `/company/request/${requestId}`,
          {},
          'company'
        );
        setRequest(response.request);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load request');
      } finally {
        setLoading(false);
      }
    };
    if (requestId) fetchDetail();
  }, [requestId]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    try {
      const response = await apiRequest<{ request?: any }>(
        `/company/request/${request._id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'inProgress',
            companyExpectedDate: acceptForm.estimatedArrival || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            technicianName: acceptForm.technicianName,
            technicianPhone: acceptForm.technicianPhone,
            technicianRole: acceptForm.technicianRole,
            companyNote: acceptForm.notes,
          }),
        },
        'company'
      );
      const updated = response.request;
      if (updated) {
        setRequest((prev) => (prev ? { ...prev, ...updated } : null));
      } else {
        setRequest((prev) =>
          prev
            ? {
                ...prev,
                status: 'inProgress',
                technicianName: acceptForm.technicianName,
                technicianPhone: acceptForm.technicianPhone,
                technicianRole: acceptForm.technicianRole,
                companyExpectedDate: acceptForm.estimatedArrival || undefined,
              }
            : null
        );
      }
      setShowAccept(false);
      setAcceptForm({ technicianName: '', technicianPhone: '', technicianRole: '', estimatedArrival: '', notes: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    try {
      await apiRequest(`/company/request/${request._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      }, 'company');
      setRequest((prev) => (prev ? { ...prev, status: 'rejected' } : null));
      setShowReject(false);
      setRejectForm({ reason: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    }
  };

  const handleResolve = async () => {
    if (!request) return;
    try {
      await apiRequest(`/company/request/${request._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved' }),
      }, 'company');
      setRequest((prev) => (prev ? { ...prev, status: 'resolved' } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolve failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading request details…</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!request) return <div className="p-8 text-center text-gray-500">Request not found</div>;

  const cat = categories.find((c) => c.id === request.service?.category);
  const status = statusConfig[request.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Breadcrumb ──────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/company/dashboard" className="flex items-center gap-1 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Request #{request._id.slice(-6)}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* ─── Header ────────────────────────────────────── */}
          <div className="p-6 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl flex items-center justify-center text-3xl border border-blue-100 shadow-sm flex-shrink-0">
                {cat?.icon || '🔧'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{request.service?.name || 'Service Request'}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold border px-3 py-1 rounded-full ${status.bg} ${status.border} ${status.text}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                    {cat?.name || request.service?.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(request.createdAt).toLocaleString('en-IN')}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {request._id.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Body ──────────────────────────────────────── */}
          <div className="p-6 space-y-6">
            {/* Description */}
            {request.description && (
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</h3>
                    <p className="text-gray-700 leading-relaxed mt-1">{request.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Address & Pincode */}
            <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address</h3>
                  <p className="text-gray-700">{request.address}</p>
                  <p className="text-sm text-gray-500">Pincode: {request.pincode}</p>
                </div>
              </div>
            </div>

            {/* Two‑column: Customer / Technician */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-200 to-yellow-200 rounded-full flex items-center justify-center text-amber-700 font-bold text-lg flex-shrink-0">
                    {request.consumer?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider">Customer</h3>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{request.consumer?.name || 'Unknown'}</p>
                    {request.consumer?.phone && (
                      <a
                        href={`tel:${request.consumer.phone}`}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 mt-1"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        {request.consumer.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Technician (if assigned) */}
              {(request.technicianName || request.companyExpectedDate) && (
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                      {request.technicianName?.charAt(0) || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Technician</h3>
                      {request.technicianName && (
                        <>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{request.technicianName}</p>
                          {request.technicianRole && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                              <HardHat className="w-3.5 h-3.5" /> {request.technicianRole}
                            </p>
                          )}
                          {request.technicianPhone && (
                            <a
                              href={`tel:${request.technicianPhone}`}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 mt-1"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              {request.technicianPhone}
                            </a>
                          )}
                        </>
                      )}
                      {request.companyExpectedDate && (
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Expected arrival: {new Date(request.companyExpectedDate).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Consumer's expected date & note */}
            {(request.expectedDate || request.consumerNote) && (
              <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-2">
                {request.expectedDate && (
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-indigo-400" />
                    <span className="font-medium">Customer expects by:</span>{' '}
                    {new Date(request.expectedDate).toLocaleString('en-IN')}
                  </p>
                )}
                {request.consumerNote && (
                  <p className="text-sm text-gray-600 flex items-start gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5" />
                    <span>
                      <span className="font-medium">Note from customer:</span> {request.consumerNote}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400 border-t border-gray-100 pt-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Created: {new Date(request.createdAt).toLocaleString('en-IN')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Updated: {new Date(request.updatedAt).toLocaleString('en-IN')}
              </span>
            </div>

            {/* ─── Action buttons ──────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
              {request.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowAccept(true)}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm"
                  >
                    <UserCheck className="w-4 h-4" />
                    Accept & Assign
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </>
              )}
              {request.status === 'inProgress' && (
                <button
                  onClick={handleResolve}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Resolved
                </button>
              )}
              {(request.status === 'resolved' || request.status === 'rejected' || request.status === 'cancelled') && (
                <span className="text-sm text-gray-400 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  This request is {status.label.toLowerCase()}.
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Accept Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showAccept && (
          <Modal onClose={() => setShowAccept(false)} title="Accept & Assign Technician">
            <form onSubmit={handleAccept} className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700 border border-blue-100">
                Accepting this request will notify the customer and share technician details.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Technician Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      value={acceptForm.technicianName}
                      onChange={(e) => setAcceptForm({ ...acceptForm, technicianName: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      type="tel"
                      value={acceptForm.technicianPhone}
                      onChange={(e) => setAcceptForm({ ...acceptForm, technicianPhone: e.target.value })}
                      placeholder="+91 98765 XXXXX"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <HardHat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      value={acceptForm.technicianRole}
                      onChange={(e) => setAcceptForm({ ...acceptForm, technicianRole: e.target.value })}
                      placeholder="e.g. Senior Plumber"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expected Arrival <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      type="datetime-local"
                      value={acceptForm.estimatedArrival}
                      onChange={(e) => setAcceptForm({ ...acceptForm, estimatedArrival: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note (optional)</label>
                  <textarea
                    value={acceptForm.notes}
                    onChange={(e) => setAcceptForm({ ...acceptForm, notes: e.target.value })}
                    placeholder="Any instructions for the customer…"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm">
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Accept
                </button>
                <button type="button" onClick={() => setShowAccept(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ─── Reject Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showReject && (
          <Modal onClose={() => setShowReject(false)} title="Decline Request">
            <form onSubmit={handleReject} className="space-y-4">
              <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700 border border-red-100">
                The customer will be notified that this request was declined.
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason (optional)</label>
                <textarea
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm({ reason: e.target.value })}
                  placeholder="e.g. Outside service area, fully booked…"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-sm">
                  <XCircle className="w-4 h-4" />
                  Decline Request
                </button>
                <button type="button" onClick={() => setShowReject(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Modal Wrapper ────────────────────────────────────────── */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}