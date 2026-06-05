export interface Company {
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

export interface Complaint {
  id: string;
  userId: string;
  companyId: string;
  companyName: string;
  category: string;
  description: string;
  address: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  rating?: number;
  feedback?: string;
}

export const cities = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Gandhi Nagar',
  'Jaipur',
];

export const categories = [
  { id: 'cleaning', name: 'Cleaning Services', icon: '🧹' },
  { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
  { id: 'electrical', name: 'Electrical', icon: '⚡' },
  { id: 'carpenter', name: 'Carpentry', icon: '🔨' },
  { id: 'painting', name: 'Painting', icon: '🎨' },
  { id: 'appliance', name: 'Appliance Repair', icon: '🔌' },
  { id: 'pest', name: 'Pest Control', icon: '🐛' },
  { id: 'gardening', name: 'Gardening', icon: '🌿' },
];

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'SparkClean Services',
    category: 'cleaning',
    city: 'Gandhi Nagar',
    rating: 4.8,
    totalReviews: 245,
    description: 'Professional cleaning services for homes and offices. We use eco-friendly products.',
    phone: '+91 98765 43210',
    email: 'contact@sparkclean.com',
    image: 'https://images.unsplash.com/photo-1740657254989-42fe9c3b8cce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMHNlcnZpY2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzc4ODk5ODAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '2',
    name: 'QuickFix Plumbers',
    category: 'plumbing',
    city: 'Gandhi Nagar',
    rating: 4.6,
    totalReviews: 189,
    description: '24/7 emergency plumbing services. Licensed and insured professionals.',
    phone: '+91 98765 43211',
    email: 'help@quickfixplumbing.com',
    image: 'https://images.unsplash.com/photo-1676210134188-4c05dd172f89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmVyJTIwZml4aW5nJTIwcGlwZXxlbnwxfHx8fDE3NzkwODYxNTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '3',
    name: 'BrightSpark Electricians',
    category: 'electrical',
    city: 'Gandhi Nagar',
    rating: 4.9,
    totalReviews: 312,
    description: 'Certified electricians for all your electrical needs. Safety is our priority.',
    phone: '+91 98765 43212',
    email: 'info@brightspark.com',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2lhbiUyMHdvcmtpbmd8ZW58MXx8fHwxNzc5MDAzNzAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '4',
    name: 'HomeRepair Pro',
    category: 'carpenter',
    city: 'Mumbai',
    rating: 4.7,
    totalReviews: 156,
    description: 'Expert carpentry and woodwork services for residential and commercial spaces.',
    phone: '+91 98765 43213',
    email: 'contact@homerepairpro.com',
    image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwcmVwYWlyJTIwc2VydmljZXxlbnwxfHx8fDE3NzkwODYzNzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '5',
    name: 'CrystalClean',
    category: 'cleaning',
    city: 'Mumbai',
    rating: 4.5,
    totalReviews: 198,
    description: 'Deep cleaning specialists with trained staff and modern equipment.',
    phone: '+91 98765 43214',
    email: 'support@crystalclean.com',
    image: 'https://images.unsplash.com/photo-1740657254989-42fe9c3b8cce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMHNlcnZpY2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzc4ODk5ODAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '6',
    name: 'FlowMaster Plumbing',
    category: 'plumbing',
    city: 'Bangalore',
    rating: 4.8,
    totalReviews: 267,
    description: 'Comprehensive plumbing solutions from installation to repair.',
    phone: '+91 98765 43215',
    email: 'service@flowmaster.com',
    image: 'https://images.unsplash.com/photo-1676210134188-4c05dd172f89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmVyJTIwZml4aW5nJTIwcGlwZXxlbnwxfHx8fDE3NzkwODYxNTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export const mockComplaints: Complaint[] = [
  {
    id: 'c1',
    userId: 'user1',
    companyId: '1',
    companyName: 'SparkClean Services',
    category: 'cleaning',
    description: 'Need deep cleaning service for my 3BHK apartment',
    address: '123 Main Street, Gandhi Nagar, Gujarat',
    status: 'pending',
    createdAt: '2026-05-17T10:30:00Z',
  },
  {
    id: 'c2',
    userId: 'user1',
    companyId: '2',
    companyName: 'QuickFix Plumbers',
    category: 'plumbing',
    description: 'Kitchen sink is leaking and needs immediate attention',
    address: '123 Main Street, Gandhi Nagar, Gujarat',
    status: 'in-progress',
    createdAt: '2026-05-15T14:20:00Z',
  },
  {
    id: 'c3',
    userId: 'user1',
    companyId: '3',
    companyName: 'BrightSpark Electricians',
    category: 'electrical',
    description: 'Power outlet not working in bedroom',
    address: '123 Main Street, Gandhi Nagar, Gujarat',
    status: 'resolved',
    createdAt: '2026-05-10T09:15:00Z',
    resolvedAt: '2026-05-12T16:45:00Z',
    rating: 5,
    feedback: 'Excellent service! Very professional and quick.',
  },
];
