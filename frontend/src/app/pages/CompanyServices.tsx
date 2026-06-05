import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import {
  Plus,
  ArrowLeft,
  Trash2,
  Edit2,
  Building2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { categories } from '../data/mockData';

type Service = {
  id: string;
  backendId?: string;
  title: string;
  category: string;
  description: string;
  price: string;
  location: string;
  image: string;
  isAvailable: boolean;
};

const createEmptyService = (): Service => ({
  id: '',
  backendId: undefined,
  title: '',
  category: categories[0]?.id || 'cleaning',
  description: '',
  price: '',
  location: '',
  image: '',
  isAvailable: true,
});

export default function CompanyServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<Service>(createEmptyService());

  const fetchServices = async () => {
    try {
      const response = await api.get('/company/service');
      const servicesData = response.data.services || response.data.service || [];

      const parsedServices = Array.isArray(servicesData)
        ? servicesData.map((service: any) => ({
            id: service._id || service.id || `${service.company}-${service.title}`,
            backendId: service._id || service.id,
            title: service.title || '',
            category: service.category || 'cleaning',
            description: service.description || '',
            price: service.price || '',
            location: service.location || '',
            image: service.image || '',
            isAvailable: service.isAvailable ?? true,
          }))
        : [];

      setServices(parsedServices);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('companyAuth');
        navigate('/company/login');
        return;
      }
      console.error('Unable to load services', error);
    }
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('companyAuth');
    if (!isAuth) {
      navigate('/company/login');
      return;
    }

    fetchServices();
  }, [navigate]);

  const syncStorage = (nextServices: Service[]) => {
    setServices(nextServices);
  };

  const handleStartAdd = () => {
    setEditingService(null);
    setForm(createEmptyService());
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setForm(service);
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('Delete this service?')) return;
    const service = services.find((item) => item.id === serviceId);
    const backendId = service?.backendId || service?.id;

    if (!backendId) {
      const next = services.filter((service) => service.id !== serviceId);
      syncStorage(next);
      if (editingService?.id === serviceId) {
        handleStartAdd();
      }
      return;
    }

    try {
      await api.post(`/company/service/delete/${backendId}`);
      await fetchServices();
      if (editingService?.id === serviceId) {
        handleStartAdd();
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Unable to delete service. Please try again.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Please provide a service title.');
      return;
    }

    const companyString = localStorage.getItem('company');
    const company = companyString ? JSON.parse(companyString) : null;
    const companyId = company?.id || company?._id;

    if (!companyId) {
      alert('Company data is missing. Please log in again.');
      navigate('/company/login');
      return;
    }

    const payload = {
      company: companyId,
      title: form.title,
      category: form.category,
      description: form.description,
      price: form.price,
      location: form.location,
      image: form.image,
      isAvailable: form.isAvailable,
    };

    let backendId = editingService?.backendId || editingService?.id;

    try {
      if (editingService && backendId) {
        await api.put(`/company/service/${backendId}`, payload);
      } else {
        await api.post('/company/service/add', payload);
      }

      await fetchServices();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Unable to save service. Please try again.');
      return;
    }

    setEditingService(null);
    setForm(createEmptyService());
  };

  const serviceCountLabel = useMemo(() => {
    if (services.length === 0) return 'No services saved yet.';
    return `${services.length} saved service${services.length > 1 ? 's' : ''}`;
  }, [services.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white border-b border-blue-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link
              to="/company/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-gray-900 font-semibold">Service Manager</div>
                <div className="text-xs text-gray-500">Add, edit, and delete services locally</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8">
          <section className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Company Services</h1>
                  <p className="text-gray-600 mt-1">{serviceCountLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-4"
            >
              {services.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center text-gray-500">
                  No services are saved yet. Click the button above to create one.
                </div>
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{service.title}</div>
                        <div className="mt-2 text-sm text-gray-600">{service.description}</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                        {categories.find((cat) => cat.id === service.category)?.icon} {' '}
                        {categories.find((cat) => cat.id === service.category)?.name || service.category}
                      </div>
                      <div className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${service.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {service.isAvailable ? 'Available' : 'Unavailable'}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        <span className="text-sm">📍</span>
                        {service.location || 'Location not set'}
                      </span>
                      {service.image ? (
                        <a
                          href={service.image}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View image
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">No image provided</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:items-end">
                    <div className="text-sm text-gray-500">Price</div>
                    <div className="text-xl font-semibold text-gray-900">{service.price || '—'}</div>
                  </div>
                </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service.id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </section>

          <aside>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{editingService ? 'Edit Service' : 'Add New Service'}</div>
                  <div className="text-sm text-gray-500">Fill the fields and save to keep the service locally.</div>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Eg. Home Deep Cleaning"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full min-h-[120px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
                    placeholder="Describe what this service includes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">₹</span>
                    <input
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="City, neighborhood, or service area"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="https://example.com/service-image.jpg"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="isAvailable"
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
                    Service available now
                  </label>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                  >
                    {editingService ? 'Save Changes' : 'Save Service'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}
