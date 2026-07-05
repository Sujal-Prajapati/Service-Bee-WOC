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
import { categories, cities } from '../lib/constants';
import { apiRequest } from '../lib/api';

interface Company {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  totalReviews: number;
  description: string;
  phone: string;
  email: string;
  image: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [complaintData, setComplaintData] = useState({
    description: '',
    address: '',
    expectedDate: '',
    pincode: '',
  });

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await apiRequest<{ success?: boolean; services?: Array<any> }>('/consumer/service', {}, 'user');
        const services = response.services || [];
        const mapped = services.map((service: any) => ({
          id: service._id || service.id,
          name: service.company?.name || service.title || 'Service Provider',
          category: service.category,
          city: service.location || 'Gandhi Nagar',
          rating: 4.5,
          totalReviews: 0,
          description: service.description || 'Service available for booking.',
          phone: service.phone || '+91 98765 43210',
          email: service.email || 'contact@servicebee.com',
          image: service.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
        }));
        setCompanies(mapped);
        setFilteredCompanies(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load services');
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    let filtered = companies;

    if (selectedCity) {
      filtered = filtered.filter((c) => c.city === selectedCity);
    }

    if (selectedCategory) {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
  }, [companies, selectedCity, selectedCategory, searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('userAuth');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const loadServiceDetail = async (company: Company) => {
    try {
      const response = await apiRequest<{ success?: boolean; existingService?: any }>(
        `/consumer/service/${company.id}`,
        {},
        'user'
      );
      const service = response.existingService;
      if (service) {
        setSelectedCompany({
          ...company,
          name: company.name,
          category: service.category || company.category,
          city: service.location || company.city,
          description: service.description || company.description,
          image: service.image || company.image,
        });
      } else {
        setSelectedCompany(company);
      }
    } catch (err) {
      console.error('Failed to load service detail', err);
      setSelectedCompany(company);
    }
    setShowComplaintModal(true);
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      await apiRequest(
        `/consumer/request/${selectedCompany.id}`,
        {
          method: 'POST',
          body: JSON.stringify({
            description: complaintData.description,
            expectedDate: complaintData.expectedDate,
            address: complaintData.address,
            pincode: Number(complaintData.pincode),
          }),
        },
        'user'
      );
      alert(`Request submitted to ${selectedCompany.name}`);
      setShowComplaintModal(false);
      setComplaintData({ description: '', address: '', expectedDate: '', pincode: '' });
      setSelectedCompany(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to submit request');
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
              <Link to="/user/notifications" className="relative p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
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
                placeholder="Search companies..."
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
                {cities.map((city) => (
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

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Companies Grid */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading services...</div>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-amber-100 hover:shadow-xl transition-shadow"
            >
              <img
                src={company.image}
                alt={company.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                  <span className="text-2xl">
                    {categories.find((c) => c.id === company.category)?.icon}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-900">{company.rating}</span>
                  <span className="text-gray-500 text-sm">({company.totalReviews} reviews)</span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{company.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  {company.city}
                </div>
                <button
                  onClick={() => {
                    setSelectedCompany(company);
                    setShowComplaintModal(true);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Submit Request
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        )}

        {filteredCompanies.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {/* Complaint Modal */}
      {showComplaintModal && selectedCompany && (
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
                  setSelectedCompany(null);
                  setComplaintData({ description: '', address: '', expectedDate: '', pincode: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCompany.image}
                  alt={selectedCompany.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900">{selectedCompany.name}</div>
                  <div className="text-sm text-gray-600">{selectedCompany.city}</div>
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
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={complaintData.expectedDate}
                    onChange={(e) =>
                      setComplaintData({ ...complaintData, expectedDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={complaintData.pincode}
                    onChange={(e) =>
                      setComplaintData({ ...complaintData, pincode: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="380001"
                    required
                  />
                </div>
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