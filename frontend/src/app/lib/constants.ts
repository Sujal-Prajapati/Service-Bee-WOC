export interface Category {
  id: string;
  name: string;
  icon: string;
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

export const categories: Category[] = [
  { id: 'cleaning', name: 'Cleaning Services', icon: '🧹' },
  { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
  { id: 'electrical', name: 'Electrical', icon: '⚡' },
  { id: 'carpenter', name: 'Carpentry', icon: '🔨' },
  { id: 'painting', name: 'Painting', icon: '🎨' },
  { id: 'appliance', name: 'Appliance Repair', icon: '🔌' },
  { id: 'pest', name: 'Pest Control', icon: '🐛' },
  { id: 'gardening', name: 'Gardening', icon: '🌿' },
];
