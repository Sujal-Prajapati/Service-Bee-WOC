import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Tag,
  DollarSign,
  FileText,
  CheckCircle,
  Wrench,
} from 'lucide-react';
import { categories } from '../lib/constants';
import { apiRequest } from '../lib/api';

interface Service {
  id: string;
  name: string;
  category: string;
  priceMin: number;
  priceMax: number;
  duration: string;
  description: string;
}

const DURATION_OPTIONS = [
  '30 minutes',
  '1 hour',
  '2 hours',
  '3-4 hours',
  'Half day',
  'Full day',
  'Multiple days',
];

const initialServices: Service[] = [];

const emptyForm = {
  name: '',
  category: 'cleaning',
  priceMin: '',
  priceMax: '',
  duration: '1 hour',
  description: '',
};

export default function CompanyCreateService() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('companyAuth');
    if (!isAuth) {
      navigate('/company/login');
      return;
    }

    const loadServices = async () => {
      try {
        const response = await apiRequest<{ success?: boolean; services?: Array<any> }>('/company/complaint', {}, 'company');
        const mapped = (response.services || []).map((service: any) => ({
          id: service._id || service.id,
          name: service.title || 'Service',
          category: service.category,
          priceMin: Number(service.price) || 0,
          priceMax: Number(service.price) || 0,
          duration: service.duration || '1 hour',
          description: service.description || '',
        }));
        setServices(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load services');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [navigate]);

  const getCategoryInfo = (id: string) => categories.find((c) => c.id === id);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      category: service.category,
      priceMin: String(service.priceMin),
      priceMax: String(service.priceMax),
      duration: service.duration,
      description: service.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/company/complaint/delete/${id}`, { method: 'POST' }, 'company');
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete service');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        company: localStorage.getItem('companyId') || '',
        title: form.name,
        category: form.category,
        description: form.description,
        price: Number(form.priceMin) || Number(form.priceMax) || 0,
        location: 'Gandhi Nagar',
        image: '',
        isAvailable: true,
      };

      if (editingId) {
        await apiRequest(`/company/complaint/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) }, 'company');
      } else {
        await apiRequest('/company/complaint/add', { method: 'POST', body: JSON.stringify(payload) }, 'company');
      }

      const newService: Service = {
        id: editingId ?? `s${Date.now()}`,
        name: form.name,
        category: form.category,
        priceMin: Number(form.priceMin),
        priceMax: Number(form.priceMax),
        duration: form.duration,
        description: form.description,
      };

      if (editingId) {
        setServices((prev) => prev.map((s) => (s.id === editingId ? newService : s)));
      } else {
        setServices((prev) => [...prev, newService]);
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save service');
    }
    setTimeout(() => setSaved(false), 2000);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <Link
              to="/company/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-800">Manage Services</span>
            <div className="flex-1" />
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl">🐝</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Service Bee
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Services</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Add and manage the services you offer to customers
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg font-medium text-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        </motion.div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Success toast */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">Service saved successfully!</span>
          </motion.div>
        )}

        {/* Add / Edit form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-blue-100 shadow-lg mb-6 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
              <h2 className="text-white font-semibold text-lg">
                {editingId ? 'Edit Service' : 'Add New Service'}
              </h2>
              <p className="text-blue-100 text-sm mt-0.5">
                Fill in the details of the service you provide
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                {/* Service name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Service Name
                  </label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Deep Home Cleaning"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {/* Min price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Min Price (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={form.priceMin}
                      onChange={(e) => setForm({ ...form, priceMin: e.target.value })}
                      placeholder="500"
                      min={0}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Max price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Max Price (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={form.priceMax}
                      onChange={(e) => setForm({ ...form, priceMax: e.target.value })}
                      placeholder="2000"
                      min={0}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Estimated Duration
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what this service includes..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm hover:shadow-md"
                >
                  {editingId ? 'Save Changes' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Services list */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading services...</div>
        ) : services.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No services yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Add your first service so customers can find and book you.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add First Service
            </button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {services.map((service, i) => {
              const cat = getCategoryInfo(service.category);
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  {/* Card top accent */}
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          {cat?.icon ?? '🔧'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {service.name}
                          </h3>
                          <span className="text-xs text-blue-600 font-medium">
                            {cat?.name ?? service.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Price range</div>
                        <div className="text-sm font-bold text-gray-900">
                          ₹{service.priceMin.toLocaleString('en-IN')} –{' '}
                          ₹{service.priceMax.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 mb-0.5">Duration</div>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {service.duration}
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
