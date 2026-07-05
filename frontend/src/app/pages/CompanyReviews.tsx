import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Search,
  X,
  TrendingUp,
  Filter,
  Settings,
  Wrench,
  LogOut,
  Bell,
  BarChart2,
  ArrowLeft,
} from 'lucide-react';
import { categories } from '../lib/constants';
import { apiRequest } from '../lib/api';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

interface Complaint {
  id: string;
  category: string;
  userName?: string;
  status: string;
  rating?: number;
  feedback?: string;
  resolvedAt?: string;
  createdAt: string;
}

/* ── helpers ── */
function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function StarRow({ rating, max = 5, size = 'sm' }: { rating: number; max?: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`${sz} ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

function RatingBar({ count, total, stars }: { count: number; total: number; stars: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-gray-500 shrink-0">{stars}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-gray-400 shrink-0">{count}</span>
    </div>
  );
}

function ratingLabel(r: number) {
  if (r >= 4.5) return 'Excellent';
  if (r >= 3.5) return 'Good';
  if (r >= 2.5) return 'Average';
  return 'Needs Improvement';
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Combined review type (normalised from both sources) ── */
interface CombinedReview {
  id: string;
  source: 'complaint' | 'service';
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

export default function CompanyReviews() {
  const navigate = useNavigate();
  const companyName = localStorage.getItem('companyName') || 'Company';

  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());
  const [serviceReviews, setServiceReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [viewMode, setViewMode] = useState<'reviews' | 'analytics'>('reviews');

  useEffect(() => {
    const isAuth = localStorage.getItem('companyAuth');
    if (!isAuth) {
      navigate('/company/login');
      return;
    }

    const loadReviews = async () => {
      try {
        const response = await apiRequest<{ success?: boolean; requests?: Array<any> }>('/company/request', {}, 'company');
        const resolved = (response.requests || []).filter((request: any) => request.status === 'resolved');
        const mappedReviews = resolved.map((request: any) => ({
          id: request._id || request.id,
          userName: request.consumer?.name || 'Customer',
          rating: 5,
          comment: request.review || 'Great service',
          createdAt: request.updatedAt || request.createdAt || new Date().toISOString(),
          helpful: 0,
        }));
        setServiceReviews(mappedReviews);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('companyAuth');
    localStorage.removeItem('companyEmail');
    localStorage.removeItem('companyName');
    navigate('/');
  };

  /* Build a unified list from resolved complaints with ratings + service reviews */
  const allReviews = useMemo<CombinedReview[]>(() => {
    const fromComplaints: CombinedReview[] = [];

    const fromServices: CombinedReview[] = serviceReviews.map((r) => {
      // map service reviews to a category — use 'cleaning' as default
      const cat = categories.find((x) => x.id === 'cleaning')!;
      return {
        id: `s-${r.id}`,
        source: 'service',
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        userName: r.userName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        helpful: r.helpful,
      };
    });

    return [...fromComplaints, ...fromServices];
  }, [serviceReviews]);

  /* Per-category analytics */
  const catStats = useMemo(() => {
    return categories
      .map((cat) => {
        const reviews = allReviews.filter((r) => r.categoryId === cat.id);
        if (!reviews.length) return null;
        const avgRating = avg(reviews.map((r) => r.rating));
        const dist = [5, 4, 3, 2, 1].map((s) => ({
          stars: s,
          count: reviews.filter((r) => r.rating === s).length,
        }));
        return { ...cat, reviews, avgRating, dist };
      })
      .filter(Boolean) as Array<{
        id: string; name: string; icon: string;
        reviews: CombinedReview[]; avgRating: number;
        dist: Array<{ stars: number; count: number }>;
      }>;
  }, [allReviews]);

  const overallAvg = avg(allReviews.map((r) => r.rating));
  const overallDist = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: allReviews.filter((r) => r.rating === s).length,
  }));

  /* Filtered list */
  const filtered = useMemo(() => {
    let list = allReviews.filter((r) => {
      if (selectedCat !== 'all' && r.categoryId !== selectedCat) return false;
      if (selectedRating > 0 && r.rating !== selectedRating) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.comment.toLowerCase().includes(q) && !r.userName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'helpful') return b.helpful - a.helpful;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allReviews, selectedCat, selectedRating, search, sortBy]);

  const handleHelpful = (id: string) => {
    if (helpfulVoted.has(id)) return;
    setHelpfulVoted((prev) => new Set(prev).add(id));
    // only service reviews have mutable helpful count
    if (id.startsWith('s-')) {
      const rid = id.slice(2);
      setServiceReviews((prev) => prev.map((r) => (r.id === rid ? { ...r, helpful: r.helpful + 1 } : r)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-base">🐝</span>
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Service Bee</span>
            </Link>
            <nav className="hidden md:flex items-center gap-0.5 text-sm">
              {[
                { to: '/company/dashboard', label: 'Requests' },
                { to: '/company/services/create', label: 'Services', icon: Wrench },
                { to: '/company/reviews', label: 'Reviews', icon: MessageSquare, active: true },
                { to: '/company/profile', label: 'Settings', icon: Settings },
              ].map((item) => (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${(item as any).active ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                  {item.icon && <item.icon className="w-3.5 h-3.5" />}{item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-1.5">
              <Link to="/company/notifications" className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-4 h-4" />
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <Link to="/company/dashboard" className="flex items-center gap-1 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Customer Reviews</span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customer Reviews</h1>
            <p className="text-xs text-gray-400 mt-0.5">{allReviews.length} total reviews across all services</p>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 text-xs font-semibold">
            <button onClick={() => setViewMode('reviews')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'reviews' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <MessageSquare className="w-3.5 h-3.5" />Reviews
            </button>
            <button onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <BarChart2 className="w-3.5 h-3.5" />By Service
            </button>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading reviews...</div>
        ) : viewMode === 'analytics' ? (
          /* ── Analytics: service-wise breakdown ── */
          <div className="space-y-5">
            {/* Overall card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row gap-5">
              <div className="flex-shrink-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Overall Rating</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-gray-900">{overallAvg.toFixed(1)}</span>
                  <div className="pb-1 space-y-1">
                    <StarRow rating={overallAvg} size="lg" />
                    <p className="text-xs text-gray-400">{ratingLabel(overallAvg)} · {allReviews.length} reviews</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {overallDist.map(({ stars, count }) => (
                  <RatingBar key={stars} stars={stars} count={count} total={allReviews.length} />
                ))}
              </div>
            </div>

            {/* Per-category cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catStats.map((cat) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelectedCat(cat.id); setViewMode('reviews'); }}
                >
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-400">{cat.reviews.length} reviews</p>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-xl font-black text-gray-900">{cat.avgRating.toFixed(1)}</div>
                        <StarRow rating={cat.avgRating} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {cat.dist.map(({ stars, count }) => (
                        <RatingBar key={stars} stars={stars} count={count} total={cat.reviews.length} />
                      ))}
                    </div>
                    <p className="text-xs text-blue-500 mt-3 font-medium">View reviews →</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Review list view ── */
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: summary + filters */}
            <aside className="lg:w-64 flex-shrink-0 space-y-4">
              {/* Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {selectedCat === 'all' ? 'Overall' : categories.find((c) => c.id === selectedCat)?.name}
                </p>
                {(() => {
                  const reviews = selectedCat === 'all' ? allReviews : allReviews.filter((r) => r.categoryId === selectedCat);
                  const a = avg(reviews.map((r) => r.rating));
                  const dist = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: reviews.filter((r) => r.rating === s).length }));
                  return (
                    <>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-4xl font-black text-gray-900">{a.toFixed(1)}</span>
                        <div className="pb-0.5 space-y-1">
                          <StarRow rating={a} size="lg" />
                          <p className="text-xs text-gray-400">{reviews.length} reviews</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {dist.map(({ stars, count }) => (
                          <RatingBar key={stars} stars={stars} count={count} total={reviews.length} />
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Category filter */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Filter by Service</p>
                <button onClick={() => setSelectedCat('all')}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${selectedCat === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />All Services</span>
                  <span className="text-xs font-bold text-gray-400">{allReviews.length}</span>
                </button>
                {catStats.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${selectedCat === cat.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="flex items-center gap-2"><span>{cat.icon}</span><span className="truncate">{cat.name}</span></span>
                      <span className="text-xs font-bold text-gray-400 ml-1">{cat.reviews.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-6">
                      <StarRow rating={cat.avgRating} />
                      <span className="text-xs text-gray-400">{cat.avgRating.toFixed(1)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Right: list */}
            <div className="flex-1 min-w-0">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews…"
                    className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400 appearance-none transition-all">
                  <option value="newest">Newest first</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                  <option value="helpful">Most helpful</option>
                </select>
              </div>

              {/* Star pills */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {[0, 5, 4, 3, 2, 1].map((s) => (
                  <button key={s} onClick={() => setSelectedRating(selectedRating === s ? 0 : s)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${selectedRating === s ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'}`}>
                    {s === 0 ? 'All ratings' : <>{s} <Star className="w-3 h-3 fill-current" /></>}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-400 mb-3">
                <span className="font-semibold text-gray-700">{filtered.length}</span> review{filtered.length !== 1 ? 's' : ''}
              </p>

              {/* Cards */}
              <div className="space-y-3">
                {filtered.map((r, i) => {
                  const sentimentBorder = r.rating >= 4 ? 'border-l-emerald-400' : r.rating >= 3 ? 'border-l-amber-400' : 'border-l-red-400';
                  const voted = helpfulVoted.has(r.id);
                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`bg-white rounded-2xl border border-l-4 border-gray-100 shadow-sm ${sentimentBorder} p-5 hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
                            {r.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{r.userName}</p>
                            <p className="text-xs text-gray-400">{timeAgo(r.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <StarRow rating={r.rating} />
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                            {r.categoryIcon} {r.categoryName}
                          </span>
                        </div>
                      </div>

                      {r.comment ? (
                        <p className="text-sm text-gray-700 leading-relaxed mb-4">{r.comment}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic mb-4">No written review provided.</p>
                      )}

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleHelpful(r.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors group ${voted ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-blue-100' : 'group-hover:fill-blue-50'}`} />
                          Helpful ({r.helpful})
                        </button>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.rating >= 4 ? 'text-emerald-600 bg-emerald-50' : r.rating >= 3 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'}`}>
                          {r.rating >= 4 ? 'Positive' : r.rating >= 3 ? 'Neutral' : 'Critical'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Filter className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-600">No reviews found</p>
                  <p className="text-xs text-gray-400 mt-1">Adjust filters or wait for more customer feedback</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
