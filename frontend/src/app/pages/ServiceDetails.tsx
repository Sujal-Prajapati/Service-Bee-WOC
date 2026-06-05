import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, MapPin, Star, Info, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

type ServiceDetailState = {
  service?: {
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

export default function ServiceDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const state = location.state as ServiceDetailState;
  const [service, setService] = useState(state?.service || null);
  const [loading, setLoading] = useState(!state?.service);

  useEffect(() => {
    const serviceId = params.id;
    if (!serviceId) return;

    const fetchService = async () => {
      setLoading(true);
      try {
        const response = await api.put(`/consumer/service/${serviceId}`);
        setService(response.data.existingService || response.data.service || null);
      } catch (error) {
        console.error('Unable to load service details', error);
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [params.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Details</h1>
            <p className="text-sm text-gray-600">View service provider details and request support.</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="rounded-3xl bg-white p-10 shadow-lg border border-amber-100 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-3">Loading service details...</p>
          </div>
        ) : service ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl overflow-hidden shadow-lg border border-amber-100 bg-white">
                {service.image ? (
                  <img src={service.image} alt={service.title} className="w-full h-96 object-cover" />
                ) : (
                  <div className="w-full h-96 bg-amber-100 flex items-center justify-center text-amber-700 text-lg font-medium">
                    No image available
                  </div>
                )}
              </div>

              <section className="bg-white rounded-3xl shadow-lg border border-amber-100 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-2xl">
                    {categories.find((cat) => cat.id === service.category)?.icon || '🛠️'}
                  </span>
                  <div>
                    <p className="text-sm text-amber-700 font-semibold">{categories.find((cat) => cat.id === service.category)?.name || 'General Service'}</p>
                    <h2 className="text-3xl font-bold text-gray-900">{service.title}</h2>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  <div className="rounded-3xl bg-amber-50 p-5 border border-amber-100">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold mb-2">Provider</p>
                    <p className="text-base font-medium text-gray-900">{service.company?.name || 'Unknown provider'}</p>
                  </div>
                  <div className="rounded-3xl bg-amber-50 p-5 border border-amber-100">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold mb-2">Location</p>
                    <p className="text-base font-medium text-gray-900">{service.location || 'Not specified'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl bg-white p-6 border border-amber-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Service fee</p>
                        <p className="text-2xl font-semibold text-gray-900">{service.price || 'Contact provider'}</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-amber-700 text-sm font-semibold">
                        <Star className="w-4 h-4" />
                        Recommended
                      </div>
                    </div>
                    <p className="text-gray-600 leading-7">{service.description || 'No description available for this service.'}</p>
                  </div>

                  <div className="rounded-3xl bg-amber-50 p-6 border border-amber-100">
                    <div className="flex items-center gap-3 mb-4 text-amber-900 font-semibold">
                      <Info className="w-5 h-5" />
                      <span>Service Information</span>
                    </div>
                    <ul className="space-y-3 text-gray-700 text-sm">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-amber-500" />
                        <span>{service.isAvailable ? 'Available now' : 'Contact provider for availability'}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span>{service.location || 'Location not available'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-white shadow-lg border border-amber-100 p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Request this service</p>
                    <h3 className="text-xl font-semibold text-gray-900">Quick connect</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  Send your service request directly to the provider and get a fast response.
                </p>
                <button
                  onClick={() => navigate('/user/dashboard')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl font-semibold hover:from-amber-600 hover:to-yellow-600 transition-all"
                >
                  Back to services
                </button>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 shadow-lg border border-amber-100 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-3">Service details are unavailable</p>
            <p className="text-gray-600 mb-6">Please open the service from the consumer dashboard to view full details.</p>
            <button
              onClick={() => navigate('/user/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl font-semibold hover:from-amber-600 hover:to-yellow-600 transition-all"
            >
              Return to dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
