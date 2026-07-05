import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Bell,
  Wrench,
  Plus,
  Star,
  TrendingUp,
  Search,
  X,
  Phone,
  User,
  HardHat,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  XCircle,
  Filter,
} from 'lucide-react';
import { categories } from '../lib/constants';
import { apiRequest } from '../lib/api';

interface Complaint {
  id: string;
  userName: string;
  userPhone: string;
  category: string;
  description: string;
  address: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  resolvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  technician?: { name: string; phone: string; role: string; avatar: string };
  estimatedArrival?: string;
  rating?: number;
  feedback?: string;
}

type StatusTab = 'all' | 'pending' | 'in-progress' | 'resolved' | 'rejected';

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

const statusMeta = {
  pending: { label: 'Pending', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  'in-progress': { label: 'In Progress', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', dot: 'bg-red-400', badge: 'bg-red-50 text-red-600 border-red-200' },
};

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Accept modal state
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptForm, setAcceptForm] = useState<AcceptForm>({
    technicianName: '', technicianPhone: '', technicianRole: '',
    estimatedArrival: '', notes: '',
  });

  // Reject modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectForm, setRejectForm] = useState<RejectForm>({ reason: '' });

  const loadRequests = async () => {
    try {
      const response = await apiRequest<{ success?: boolean; requests?: Array<any> }>('/company/request', {}, 'company');
      const mapped = (response.requests || []).map((request: any) => {
        const status: Complaint['status'] = request.status === 'inProgress'
          ? 'in-progress'
          : request.status === 'resolved'
          ? 'resolved'
          : request.status === 'rejected' || request.status === 'cancelled'
          ? 'rejected'
          : 'pending';
        const technicianName = request.technician?.name || request.technicianName;
        return {
          id: request._id || request.id,
          userName: request.consumer?.name || 'Customer',
          userPhone: request.consumer?.phone || '',
          category: request.service?.category || 'cleaning',
          description: request.description || request.service?.description || 'Service request',
          address: request.address || '',
          status,
          priority: 'medium' as Complaint['priority'],
          createdAt: request.createdAt || new Date().toISOString(),
          resolvedAt: request.updatedAt,
          rejectedAt: request.updatedAt,
          rejectedReason: request.rejectedReason,
          technician: technicianName
            ? {
                name: technicianName,
                phone: request.technician?.phone || request.technicianPhone || '',
                role: request.technician?.role || request.technicianRole || '',
                avatar: technicianName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
              }
            : undefined,
          estimatedArrival: request.companyExpectedDate,
        };
      });
      setComplaints(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('companyAuth');
    if (!isAuth) {
      navigate('/company/login');
      return;
    }

    loadRequests();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('companyAuth');
    localStorage.removeItem('companyEmail');
    localStorage.removeItem('companyName');
    navigate('/');
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingId) return;
    try {
      const response = await apiRequest<{ success?: boolean; request?: any }>(`/company/request/${acceptingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'inProgress',
          companyExpectedDate: acceptForm.estimatedArrival || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          technicianName: acceptForm.technicianName,
          technicianPhone: acceptForm.technicianPhone,
          technicianRole: acceptForm.technicianRole,
          companyNote: acceptForm.notes,
        }),
      }, 'company');

      const updatedRequest = response.request;
      if (updatedRequest) {
        const status: Complaint['status'] = updatedRequest.status === 'inProgress'
          ? 'in-progress'
          : updatedRequest.status === 'resolved'
          ? 'resolved'
          : updatedRequest.status === 'rejected' || updatedRequest.status === 'cancelled'
          ? 'rejected'
          : 'pending';
        const technicianName = updatedRequest.technician?.name || updatedRequest.technicianName;
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === acceptingId
              ? {
                  ...c,
                  status,
                  technician: technicianName
                    ? {
                        name: technicianName,
                        phone: updatedRequest.technician?.phone || updatedRequest.technicianPhone || acceptForm.technicianPhone,
                        role: updatedRequest.technician?.role || updatedRequest.technicianRole || acceptForm.technicianRole,
                        avatar: technicianName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
                      }
                    : c.technician,
                  estimatedArrival: updatedRequest.companyExpectedDate || acceptForm.estimatedArrival || undefined,
                }
              : c
          )
        );
      } else {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === acceptingId
              ? {
                  ...c,
                  status: 'in-progress',
                  technician: {
                    name: acceptForm.technicianName,
                    phone: acceptForm.technicianPhone,
                    role: acceptForm.technicianRole,
                    avatar: acceptForm.technicianName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
                  },
                  estimatedArrival: acceptForm.estimatedArrival || undefined,
                }
              : c
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept request');
    }
    setAcceptingId(null);
    setAcceptForm({ technicianName: '', technicianPhone: '', technicianRole: '', estimatedArrival: '', notes: '' });
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    try {
      await apiRequest(`/company/request/${rejectingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      }, 'company');
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === rejectingId
            ? { ...c, status: 'rejected', rejectedAt: new Date().toISOString(), rejectedReason: rejectForm.reason }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reject request');
    }
    setRejectingId(null);
    setRejectForm({ reason: '' });
  };

  const handleMarkResolved = async (id: string) => {
    try {
      await apiRequest(`/company/request/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved' }),
      }, 'company');
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString() } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update request');
    }
  };

  const getCat = (id: string) => categories.find((c) => c.id === id);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const counts = useMemo(() => ({
    all: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    'in-progress': complaints.filter((c) => c.status === 'in-progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    rejected: complaints.filter((c) => c.status === 'rejected').length,
  }), [complaints]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (tab !== 'all' && c.status !== tab) return false;
      if (catFilter !== 'all' && c.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.description.toLowerCase().includes(q) && !(c.userName ?? '').toLowerCase().includes(q) && !c.address.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [complaints, tab, catFilter, search]);

  const companyName = localStorage.getItem('companyName') || 'Company';

  const tabs: { key: StatusTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
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

            <nav className="hidden md:flex items-center gap-0.5 text-sm">
              {[
                { to: '/company/dashboard', label: 'Requests', active: true },
                { to: '/company/services/create', label: 'Services', icon: Wrench },
                { to: '/company/reviews', label: 'Reviews', icon: MessageSquare },
                { to: '/company/profile', label: 'Settings', icon: Settings },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    item.active ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {item.icon && <item.icon className="w-3.5 h-3.5" />}
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <Link to="/company/notifications" className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-4.5 h-4.5" />
                {counts.pending > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-0.5">
                    {counts.pending}
                  </span>
                )}
              </Link>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', count: counts.all, g: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', icon: TrendingUp },
            { label: 'Pending', count: counts.pending, g: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', icon: Clock },
            { label: 'In Progress', count: counts['in-progress'], g: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', icon: AlertCircle },
            { label: 'Completed', count: counts.resolved, g: 'from-emerald-400 to-green-600', bg: 'bg-emerald-50', icon: CheckCircle },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                <div className={`w-5 h-5 bg-gradient-to-br ${s.g} rounded-md flex items-center justify-center`}>
                  <s.icon className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className={`text-2xl font-black bg-gradient-to-r ${s.g} bg-clip-text text-transparent`}>{s.count}</div>
              <div className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, description, address…"
              className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none transition-all"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <Link
            to="/company/services/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </Link>
        </div>

        {/* ── Status tabs ── */}
        <div className="flex gap-1 mb-4 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Results summary ── */}
        <p className="text-xs text-gray-400 mb-3">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> request{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* ── Request list ── */}
        <div className="space-y-2">
          {filtered.map((c, i) => (
            <RequestRow
              key={c.id}
              complaint={c}
              index={i}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onAccept={() => setAcceptingId(c.id)}
              onReject={() => setRejectingId(c.id)}
              onResolve={() => handleMarkResolved(c.id)}
              getCat={getCat}
              formatDate={formatDate}
              formatDateTime={formatDateTime}
              timeAgo={timeAgo}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6 text-gray-300" />
            </div>
            <p className="font-medium text-gray-600">No requests found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search</p>
          </div>
        )}
      </div>

      {/* ── Accept modal ── */}
      <AnimatePresence>
        {acceptingId && (
          <Modal onClose={() => setAcceptingId(null)} title="Accept & Assign Technician">
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role / Specialisation <span className="text-red-500">*</span></label>
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expected Arrival Date & Time <span className="text-red-500">*</span></label>
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note for Customer <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={acceptForm.notes}
                    onChange={(e) => setAcceptForm({ ...acceptForm, notes: e.target.value })}
                    placeholder="Any instructions or information for the customer…"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Accept
                </button>
                <button
                  type="button"
                  onClick={() => setAcceptingId(null)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Reject modal ── */}
      <AnimatePresence>
        {rejectingId && (
          <Modal onClose={() => setRejectingId(null)} title="Decline Request">
            <form onSubmit={handleReject} className="space-y-4">
              <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700 border border-red-100">
                The customer will be notified that this request was declined.
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Reason for Declining <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm({ reason: e.target.value })}
                  placeholder="e.g. Outside service area, fully booked on the requested date…"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Decline Request
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
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

/* ── Modal wrapper ── */
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

/* ── Request row ── */
interface RowProps {
  complaint: Complaint;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
  onResolve: () => void;
  getCat: (id: string) => { id: string; name: string; icon: string } | undefined;
  formatDate: (d: string) => string;
  formatDateTime: (d: string) => string;
  timeAgo: (d: string) => string;
}

function RequestRow({ complaint: c, index, expanded, onToggle, onAccept, onReject, onResolve, getCat, formatDate, formatDateTime, timeAgo }: RowProps) {
  const cat = getCat(c.category);
  const sm = statusMeta[c.status];
  const priorityBadge = c.priority === 'high'
    ? 'bg-red-50 text-red-600 border-red-200'
    : c.priority === 'medium'
    ? 'bg-amber-50 text-amber-600 border-amber-200'
    : 'bg-gray-100 text-gray-500 border-gray-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`bg-white rounded-2xl border shadow-sm transition-all ${
        expanded ? 'border-blue-300 shadow-md ring-1 ring-blue-200' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
      }`}
    >
      {/* Compact header row */}
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            {cat?.icon ?? '🔧'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 truncate">{c.userName ?? 'Customer'}</span>
              <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-full capitalize hidden sm:inline ${priorityBadge}`}>
                {c.priority}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{c.description}</p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span className={`hidden md:flex items-center gap-1 text-xs font-semibold border px-2 py-0.5 rounded-full ${sm.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
              {sm.label}
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">{timeAgo(c.createdAt)}</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-blue-100 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 px-5 py-4">
              <div className="grid md:grid-cols-2 gap-5">
                {/* Left: details */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-bold border px-2.5 py-1 rounded-full ${sm.badge}`}>
                      {sm.label}
                    </span>
                    <span className="text-xs font-medium bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-600">
                      {cat?.icon} {cat?.name}
                    </span>
                    <span className={`text-xs font-bold border px-2.5 py-1 rounded-full capitalize ${priorityBadge}`}>
                      {c.priority} priority
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{c.address}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Submitted: {formatDate(c.createdAt)}</span>
                    {c.resolvedAt && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> Resolved: {formatDate(c.resolvedAt)}</span>}
                    {c.rejectedAt && <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" /> Declined: {formatDate(c.rejectedAt)}</span>}
                  </div>

                  {c.rejectedReason && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-600">
                      <span className="font-semibold">Decline reason:</span> {c.rejectedReason}
                    </div>
                  )}
                </div>

                {/* Right: customer + technician + actions */}
                <div className="space-y-3">
                  {/* Customer */}
                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm">
                        {(c.userName ?? 'C').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.userName ?? '—'}</p>
                        {c.userPhone && (
                          <a href={`tel:${c.userPhone}`} className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-800">
                            <Phone className="w-3 h-3" />{c.userPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Technician (if assigned) */}
                  {c.technician && (
                    <div className="bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Technician</p>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                          {c.technician.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.technician.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <HardHat className="w-3 h-3" />{c.technician.role}
                          </p>
                        </div>
                      </div>
                      <a href={`tel:${c.technician.phone}`} className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-800">
                        <Phone className="w-3 h-3" />{c.technician.phone}
                      </a>
                      {c.estimatedArrival && (
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Arrival: {formatDateTime(c.estimatedArrival)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rating (resolved) */}
                  {c.status === 'resolved' && c.rating && (
                    <div className="bg-white rounded-xl border border-emerald-100 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Review</p>
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < c.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'}`} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{c.rating}/5</span>
                      </div>
                      {c.feedback && <p className="text-xs text-gray-600 italic">"{c.feedback}"</p>}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {c.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); onAccept(); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onReject(); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </>
                    )}
                    {c.status === 'in-progress' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onResolve(); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
