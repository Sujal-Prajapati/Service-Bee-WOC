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
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
}

/* ── helpers (unchanged) ── */
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

/* ── Combined review type ── */
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

  // ─── State ──────────────────────────────────────────────
  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());
  const [serviceReviews, setServiceReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [viewMode, setViewMode] = useState<'reviews' | 'analytics'>('reviews');

  // Backend stats
  const [overallAvg, setOverallAvg] = useState<number>(0);
  const [overallDist, setOverallDist] = useState<{ _id: number; count: number }[]>([]);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [categoryStats, setCategoryStats] = useState<Array<{
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    avgRating: number;
    total: number;
    distribution: Record<number, number>;
  }>>([]);

  // ─── Debounce search ────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Fetch function ──────────────────────────────────────
  const fetchReviews = async (
    category?: string,
    rating?: number,
    searchQuery?: string
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (rating && rating > 0) params.append('rating', rating.toString());
      if (searchQuery) params.append('search', searchQuery);

      const url = `/company/review${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest<{
        success: boolean;
        stats: { avgRating: number; total: number };
        overallDistribution: Array<{ _id: number; count: number }>;
        categoryStats: Array<{
          category: string;
          avgRating: number;
          total: number;
          distribution: Record<number, number>;
        }>;
        reviews: any[];
        pagination: { currentPage: number; totalPages: number; total: number };
      }>(url, {}, 'company');

      // Stats
      setOverallAvg(response.stats.avgRating);
      setTotalReviews(response.stats.total);
      setOverallDist(response.overallDistribution || []);

      // Category stats – map to your constants
      const mappedCategoryStats = (response.categoryStats || []).map(cat => {
        const matched = categories.find(c => c.id === cat.category);
        return {
          categoryId: cat.category,
          categoryName: matched?.name || cat.category,
          categoryIcon: matched?.icon || '📌',
          avgRating: cat.avgRating,
          total: cat.total,
          distribution: cat.distribution,
        };
      });
      setCategoryStats(mappedCategoryStats);

      // Reviews
      const mappedReviews: Review[] = (response.reviews || []).map((r) => {
        const cat = categories.find(c => c.id === r.service?.category) || categories[0];
        return {
          id: r._id,
          userName: r.consumer?.name || 'Customer',
          rating: r.rating,
          comment: r.comment || 'No written review provided.',
          createdAt: r.createdAt,
          helpful: r.helpful || 0,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
        };
      });
      setServiceReviews(mappedReviews);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // ─── Initial load & filter changes ──────────────────────
  useEffect(() => {
    const isAuth = localStorage.getItem('companyAuth');
    if (!isAuth) {
      navigate('/company/login');
      return;
    }
    // Load with current filters (initially 'all', 0, empty)
    fetchReviews(selectedCat === 'all' ? undefined : selectedCat, selectedRating || undefined, debouncedSearch || undefined);
  }, []); // only on mount

  // When filters change, re-fetch
  useEffect(() => {
    // Only if not the initial mount (we handle that above)
    if (loading) return; // avoid double fetch on mount
    fetchReviews(selectedCat === 'all' ? undefined : selectedCat, selectedRating || undefined, debouncedSearch || undefined);
  }, [selectedCat, selectedRating, debouncedSearch]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('companyAuth');
    localStorage.removeItem('companyEmail');
    localStorage.removeItem('companyName');
    navigate('/');
  };

  const handleHelpful = (id: string) => {
    if (helpfulVoted.has(id)) return;
    setHelpfulVoted((prev) => new Set(prev).add(id));
    setServiceReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, helpful: (r.helpful || 0) + 1 } : r
      )
    );
    // TODO: call PATCH /api/company/review/${id}/helpful
  };

  // ─── Derived data ──────────────────────────────────────────
  const allReviews = useMemo<CombinedReview[]>(() => {
    return serviceReviews.map((r) => ({
      id: r.id,
      source: 'service',
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      helpful: r.helpful,
    }));
  }, [serviceReviews]);

  // Filtering & sorting on the frontend (for review list only)
  const filtered = useMemo(() => {
    let list = allReviews; // backend already filters, but we still need to apply rating and search if we didn't send them? Actually we do send them, but keep this for extra safety.
    // However, we already have backend filters, so we don't need to re-filter for category/rating/search.
    // But we still need sorting and rating pills? We already send rating to backend, so the list is already filtered.
    // We'll keep this for now – but we can simplify later.
    // The backend now returns only reviews matching the filters, so we should not re-filter.
    // Let's comment out the frontend filters and only sort.
    // We'll keep the sort and maybe search if we want to do client-side search on top of backend search? Better to keep backend search only.
    // I'll keep the frontend filtering for rating and category as a fallback, but it's redundant.
    let result = [...list];
    // If we want to keep frontend filtering for rating (not sent to backend) we need to remove rating from backend.
    // Actually we want to send rating to backend, so frontend filtering is not needed.
    // For simplicity, we'll rely on backend and remove frontend filters.
    // I'll comment out the old frontend filters.
    /*
    if (selectedCat !== 'all') result = result.filter(r => r.categoryId === selectedCat);
    if (selectedRating > 0) result = result.filter(r => r.rating === selectedRating);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.comment.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q));
    }
    */
    // We'll keep sorting.
    return result.sort((a, b) => {
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'helpful') return b.helpful - a.helpful;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allReviews, sortBy]);

  // ─── Render ──────────────────────────────────────────────
  if (loading && allReviews.length === 0) {
    return <div className="p-8 text-center text-gray-500">Loading reviews…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (unchanged) */}
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
                { to: '/company/review', label: 'Reviews', icon: MessageSquare, active: true },
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
            <p className="text-xs text-gray-400 mt-0.5">{totalReviews} total reviews across all services</p>
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

        {viewMode === 'analytics' ? (
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
                    <p className="text-xs text-gray-400">{ratingLabel(overallAvg)} · {totalReviews} reviews</p>
                  </div>
                </div>
              </div>
              {/* Distribution bars – from backend overallDist */}
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map((stars) => {
                  const dist = overallDist.find(d => d._id === stars);
                  const count = dist ? dist.count : 0;
                  return <RatingBar key={stars} stars={stars} count={count} total={totalReviews} />;
                })}
              </div>
            </div>

            {/* Per-category cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.map((cat) => (
                <motion.div
                  key={cat.categoryId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelectedCat(cat.categoryId); setViewMode('reviews'); }}
                >
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{cat.categoryIcon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{cat.categoryName}</p>
                        <p className="text-xs text-gray-400">{cat.total} reviews</p>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-xl font-black text-gray-900">{cat.avgRating.toFixed(1)}</div>
                        <StarRow rating={cat.avgRating} />
                      </div>
                    </div>
                    {/* Show distribution for this category if you want */}
                    <div className="space-y-1">
                      {[5,4,3,2,1].map((stars) => {
                        const count = cat.distribution?.[stars] || 0;
                        return <RatingBar key={stars} stars={stars} count={count} total={cat.total} />;
                      })}
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
                  {selectedCat === 'all' ? 'Overall' : categories.find(c => c.id === selectedCat)?.name}
                </p>
                {(() => {
                  if (selectedCat === 'all') {
                    const dist = [5,4,3,2,1].map(s => ({
                      stars: s,
                      count: overallDist.find(d => d._id === s)?.count || 0
                    }));
                    return (
                      <>
                        <div className="flex items-end gap-2 mb-3">
                          <span className="text-4xl font-black text-gray-900">{overallAvg.toFixed(1)}</span>
                          <div className="pb-0.5 space-y-1">
                            <StarRow rating={overallAvg} size="lg" />
                            <p className="text-xs text-gray-400">{totalReviews} reviews</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {dist.map(({ stars, count }) => (
                            <RatingBar key={stars} stars={stars} count={count} total={totalReviews} />
                          ))}
                        </div>
                      </>
                    );
                  } else {
                    const cat = categoryStats.find(c => c.categoryId === selectedCat);
                    if (!cat) return <p className="text-sm text-gray-400">No data</p>;
                    const dist = [5,4,3,2,1].map(s => ({
                      stars: s,
                      count: cat.distribution?.[s] || 0
                    }));
                    return (
                      <>
                        <div className="flex items-end gap-2 mb-3">
                          <span className="text-4xl font-black text-gray-900">{cat.avgRating.toFixed(1)}</span>
                          <div className="pb-0.5 space-y-1">
                            <StarRow rating={cat.avgRating} size="lg" />
                            <p className="text-xs text-gray-400">{cat.total} reviews</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {dist.map(({ stars, count }) => (
                            <RatingBar key={stars} stars={stars} count={count} total={cat.total} />
                          ))}
                        </div>
                      </>
                    );
                  }
                })()}
              </div>

              {/* Category filter */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Filter by Service</p>
                <button
                  onClick={() => setSelectedCat('all')}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${selectedCat === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />All Services</span>
                  <span className="text-xs font-bold text-gray-400">{totalReviews}</span>
                </button>
                {categoryStats.map((cat) => (
                  <button
                    key={cat.categoryId}
                    onClick={() => setSelectedCat(cat.categoryId)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${selectedCat === cat.categoryId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="flex items-center gap-2"><span>{cat.categoryIcon}</span><span className="truncate">{cat.categoryName}</span></span>
                      <span className="text-xs font-bold text-gray-400 ml-1">{cat.total}</span>
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
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reviews…"
                    className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-400 appearance-none transition-all"
                >
                  <option value="newest">Newest first</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                  <option value="helpful">Most helpful</option>
                </select>
              </div>

              {/* Star pills – these now trigger backend filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {[0, 5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedRating(selectedRating === s ? 0 : s)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${selectedRating === s ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'}`}
                  >
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