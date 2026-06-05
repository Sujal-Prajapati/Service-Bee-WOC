import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  Filter,
  Star,
  LogOut,
  FileText,
  Plus,
  X,
  Send,
  Bell,
} from 'lucide-react';
import { api } from '../lib/api';

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

type Service = {
  id: string;
  title: string;
  category: string;
  description: string;
  price?: string;
  location?: string;
  image?: string;
  isAvailable?: boolean;
  company?: {
    id: string;
    name: string;
  };
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [complaintData, setComplaintData] = useState({
    description: '',
    address: '',
    pincode: '',
  });

  useEffect(() => {
    const isAuth = localStorage.getItem('userAuth');
    if (!isAuth) {
      navigate('/user/login');
      return;
    }

    const fetchServices = async () => {
      try {
        const response = await api.get('/consumer/service');
        const serviceData = Array.isArray(response.data.services) ? response.data.services : [];

        const parsedServices = serviceData.map((service: any) => ({
          id: service._id || service.id || `${service.company?._id}-${service.title}`,
          title: service.title || service.name || 'Service',
          category: service.category || 'cleaning',
          description: service.description || '',
          price: service.price || '',
          location: service.location || service.city || '',
          image: service.image || '',
          isAvailable: service.isAvailable ?? true,
          company: service.company
            ? {
                id: service.company._id || service.company.id || '',
                name: service.company.name || 'Provider',
              }
            : undefined,
        }));

        setServices(parsedServices);
        setFilteredServices(parsedServices);
        setAvailableCities(
          Array.from(new Set(parsedServices.map((item) => item.location || '').filter(Boolean)))
        );
      } catch (error: any) {
        console.error('Unable to load consumer services', error);
        alert(error.response?.data?.message || 'Unable to load consumer services');
      }
    };

    fetchServices();
  }, [navigate]);

  useEffect(() => {
    let filtered = services;

    if (selectedCity) {
      filtered = filtered.filter((service) => service.location === selectedCity);
    }

    if (selectedCategory) {
      filtered = filtered.filter((service) => service.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  }, [services, selectedCity, selectedCategory, searchQuery]);

  const handleLogout = async () => {
    try {
      await api.post('/consumer/logout');
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userAuth');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const handleViewServiceDetails = (service: Service) => {
    navigate(`/user/service/${service.id}`, {
      state: { service },
    });
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService) {
      return;
    }

    if (!complaintData.description || !complaintData.address || !complaintData.pincode) {
      alert('Please complete all fields before submitting your request.');
      return;
    }

    try {
      const response = await api.post(`/consumer/complaint/${selectedService.id}`, {
        description: complaintData.description,
        address: complaintData.address,
        pincode: parseInt(complaintData.pincode, 10),
      });

      alert(response.data.message || 'Complaint submitted successfully.');
      setShowComplaintModal(false);
      setComplaintData({ description: '', address: '', pincode: '' });
      setSelectedService(null);
    } catch (error: any) {
      console.error('Unable to submit complaint', error);
      alert(error.response?.data?.message || 'Unable to submit complaint. Please try again.');
    }
  };

  const userName = localStorage.getItem('userName') || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🐝</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Service Bee
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/user/complaints"
                className="flex items-center gap-2 px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                My Complaints
              </Link>
              <button className="relative p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{userName}</span>
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
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-gray-600">Find and connect with service providers in your area</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8 border border-amber-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Search & Filter</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">All Cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">All Services</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(selectedCity || selectedCategory || searchQuery) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedCity && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1">
                  {selectedCity}
                  <button onClick={() => setSelectedCity('')} className="hover:text-amber-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('')} className="hover:text-amber-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-amber-100 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleViewServiceDetails(service)}
            >
              {service.image ? (
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-amber-100 flex items-center justify-center text-amber-600 text-sm">
                  No image provided
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{service.company?.name || 'Service Provider'}</h3>
                    <div className="text-sm text-gray-500">{service.title}</div>
                  </div>
                  <span className="text-2xl">
                    {categories.find((c) => c.id === service.category)?.icon || '🛠️'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  {service.location || 'Location not available'}
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedService(service);
                    setShowComplaintModal(true);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Submit Request
                </button>
                <div className="mt-3 text-sm text-amber-700 font-medium text-center">
                  Tap card to view service details
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {/* Complaint Modal */}
      {showComplaintModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Submit Request</h2>
              <button
                onClick={() => {
                  setShowComplaintModal(false);
                  setSelectedService(null);
                  setComplaintData({ description: '', address: '', pincode: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-3">
                {selectedService.image ? (
                  <img
                    src={selectedService.image}
                    alt={selectedService.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    🛠️
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{selectedService.company?.name || 'Service Provider'}</div>
                  <div className="text-sm text-gray-600">{selectedService.title}</div>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Description
                </label>
                <textarea
                  value={complaintData.description}
                  onChange={(e) =>
                    setComplaintData({ ...complaintData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                  rows={4}
                  placeholder="Describe your service request in detail..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Address
                </label>
                <textarea
                  value={complaintData.address}
                  onChange={(e) =>
                    setComplaintData({ ...complaintData, address: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                  rows={2}
                  placeholder="Enter your complete address..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  value={complaintData.pincode}
                  onChange={(e) =>
                    setComplaintData({ ...complaintData, pincode: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Enter your area pincode"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
              >
                <Send className="w-4 h-4" />
                Submit Request
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}