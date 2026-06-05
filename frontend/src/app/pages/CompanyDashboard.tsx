import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import {
  Settings,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  User,
  Bell,
  Plus,
} from 'lucide-react';

type Complaint = {
  id: string;
  description: string;
  address: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  resolvedAt?: string;
  rating?: number;
  feedback?: string;
  serviceTitle?: string;
  consumerName?: string;
};

const categories = [
  { id: 'cleaning', name: 'Cleaning Services', icon: '🧹' },
  { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
  { id: 'electrical', name: 'Electrical', icon: '⚡' },
  { id: 'carpenter', name: 'Carpentry', icon: '🔨' },
  { id: 'painting', name: 'Painting', icon: '🎨' },
  { id: 'appliance', name: 'Appliance Repair', icon: '🔌' },
  { id: 'pest', name: 'Pest Control', icon: '🐛' },
  { id: 'gardening', name: 'Gardening', icon: '🌿' },
];

type CompanyService = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
};

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [savedCompanyServices, setSavedCompanyServices] = useState<CompanyService[]>([]);
  useEffect(() => {
  const isAuth = localStorage.getItem('companyAuth');

  if (!isAuth) {
    navigate('/company/login');
    return;
  }

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/company/complaint');

      if (response.data?.success) {
        setComplaints(response.data.complaints.map(mapComplaint));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/company/services');

      if (response.data?.success) {
        setSavedCompanyServices(response.data.services);

        setCompanyServices(
          response.data.services.map((service: any) => service.category)
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchComplaints();
  fetchServices();
}, [navigate]);

  const [companyServices, setCompanyServices] = useState<string[]>([]);

  const mapComplaint = (complaint: any): Complaint => ({
    id: complaint._id ?? complaint.id,
    description: complaint.description ?? complaint.issue ?? '',
    address: complaint.address ?? '',
    status: complaint.status ?? 'pending',
    createdAt: complaint.createdAt ?? new Date().toISOString(),
    resolvedAt: complaint.resolvedAt,
    rating: complaint.rating,
    feedback: complaint.feedback,
    serviceTitle: complaint.service?.title ?? 'Service',
    consumerName:
      complaint.consumer?.name ?? complaint.consumer?.email ?? 'Customer',
  });

  const handleToggleService = (serviceId: string) => {
    setCompanyServices((current) => {
      const next = current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId];
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await api.post('/company/logout');
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('companyAuth');
      localStorage.removeItem('companyEmail');
      localStorage.removeItem('companyName');
      localStorage.removeItem('companyServices');
      localStorage.removeItem('companyPhone');
      localStorage.removeItem('companyCity');
      localStorage.removeItem('companyDescription');
      localStorage.removeItem('company');
      navigate('/');
    }
  };

  const updateComplaintStatus = async (
  complaintId: string,
  newStatus: Complaint['status']
) => {
  try {
    const response = await api.patch(
      `/company/complaint/${complaintId}`,
      { status: newStatus }
    );

    if (response.data?.success) {
      setComplaints((prevComplaints) =>
        prevComplaints.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                status: newStatus,
                resolvedAt:
                  newStatus === 'completed'
                    ? new Date().toISOString()
                    : c.resolvedAt,
              }
            : c
        )
      );
    }
  } catch (error) {
    console.error('Failed to update complaint status:', error);
  }
};

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
      case 'accepted':
        return {
          icon: AlertCircle,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Accepted',
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Rejected',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Completed',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const companyName = localStorage.getItem('companyName') || 'Company';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🐝</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Service Bee
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0.5 right-0.5 px-1.5 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {complaints.filter((c) => c.status === 'pending').length}
                </span>
              </button>
              <Link
                to="/company/services"
                className="flex items-center gap-2 px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Manage Services
              </Link>
              <Link
                to="/company/profile"
                className="flex items-center gap-2 px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {companyName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{companyName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {companyName}! 👋
          </h1>
          <p className="text-gray-600">Manage and track all your service requests</p>

          <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Services</h2>
                <p className="text-sm text-gray-500">Add the services your company provides. This is stored locally for now.</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {savedCompanyServices.length > 0 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                    {savedCompanyServices.length} service{savedCompanyServices.length > 1 ? 's' : ''} saved.
                  </div>
                  <div className="grid gap-3">
                    {savedCompanyServices.slice(0, 3).map((service) => (
                      <div key={service.id} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{service.title}</div>
                            <div className="text-xs text-gray-500">{categories.find((cat) => cat.id === service.category)?.name || service.category}</div>
                          </div>
                          <div className="text-sm font-semibold text-blue-700">₹{service.price || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-500">No services saved yet. Click Manage Services to add service offerings for your company.</span>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => {
                const selected = companyServices.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleService(cat.id)}
                    className={`text-left rounded-2xl border px-4 py-4 transition-all duration-200 focus:outline-none ${
                      selected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <div className="font-semibold text-gray-900">{cat.name}</div>
                        <div className="text-sm text-gray-500">
                          {selected ? 'Remove service' : 'Add service'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Pending Requests',
              count: complaints.filter((c) => c.status === 'pending').length,
              color: 'from-amber-500 to-yellow-500',
              icon: Clock,
            },
            {
              label: 'Accepted',
              count: complaints.filter((c) => c.status === 'accepted').length,
              color: 'from-blue-500 to-cyan-500',
              icon: AlertCircle,
            },
            {
              label: 'Rejected',
              count: complaints.filter((c) => c.status === 'rejected').length,
              color: 'from-red-500 to-rose-500',
              icon: AlertCircle,
            },
            {
              label: 'Completed',
              count: complaints.filter((c) => c.status === 'completed').length,
              color: 'from-green-500 to-emerald-500',
              icon: CheckCircle,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-xl shadow-md p-6 border border-blue-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.count}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Service Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Requests</h2>
          <div className="space-y-4">
            {complaints.map((complaint, index) => {
              const statusConfig = getStatusConfig(complaint.status);
              return (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="bg-white rounded-xl shadow-md p-6 border border-blue-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} rounded-full text-sm font-semibold border flex items-center gap-1`}
                        >
                          <statusConfig.icon className="w-4 h-4" />
                          {statusConfig.label}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(complaint.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-3 font-medium">{complaint.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Request ID: {complaint.id}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {complaint.address}
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                          Service:
                          <span className="font-normal">{complaint.serviceTitle}</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                          Customer:
                          <span className="font-normal">{complaint.consumerName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {complaint.status !== 'completed' && complaint.status !== 'rejected' && (
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
                      {complaint.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'accepted')}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'rejected')}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      {complaint.status === 'accepted' && (
                        <button
                          onClick={() => updateComplaintStatus(complaint.id, 'completed')}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete
                        </button>
                      )}
                    </div>
                  )}

                  {complaint.status === 'completed' && complaint.rating && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-green-900">
                            Customer Rating: {complaint.rating}/5 ⭐
                          </div>
                          {complaint.feedback && (
                            <div className="text-sm text-green-700 mt-1">"{complaint.feedback}"</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {complaints.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-blue-100">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
              <p className="text-gray-600">Service requests will appear here</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}