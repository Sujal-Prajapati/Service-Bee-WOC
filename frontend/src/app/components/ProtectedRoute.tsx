import { Navigate } from 'react-router';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  role: 'user' | 'company';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const isAuth = localStorage.getItem(role === 'user' ? 'userAuth' : 'companyAuth');
  const token = localStorage.getItem(role === 'user' ? 'userToken' : 'companyToken');

  if (!isAuth || !token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
