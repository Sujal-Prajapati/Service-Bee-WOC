import { createBrowserRouter } from 'react-router';
import Landing from './pages/Landing';
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import UserDashboard from './pages/UserDashboard';
import UserComplaints from './pages/UserComplaints';
import UserNotifications from './pages/UserNotifications';
import UserRequestDetail from './pages/UserRequestDetail';
import CompanyLogin from './pages/CompanyLogin';
import CompanySignup from './pages/CompanySignup';
import CompanyDashboard from './pages/CompanyDashboard';
import CompanyProfile from './pages/CompanyProfile';
import CompanyCreateService from './pages/CompanyCreateService';
import CompanyReviews from './pages/CompanyReviews';
import CompanyNotifications from './pages/CompanyNotifications';
import ProtectedRoute from './components/ProtectedRoute';
import CompanyRequestDetail from './pages/CompanyRequestDetail';


export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/user/login', Component: UserLogin },
  { path: '/user/signup', Component: UserSignup },
  {
    path: '/user/dashboard',
    Component: () => (
      <ProtectedRoute role="user">
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/user/complaints',
    Component: () => (
      <ProtectedRoute role="user">
        <UserComplaints />
      </ProtectedRoute>
    ),
  },
  {
    path: '/user/notifications',
    Component: () => (
      <ProtectedRoute role="user">
        <UserNotifications />
      </ProtectedRoute>
    ),
  },
  {
    path: '/user/requests/:id',
    Component: () => (
      <ProtectedRoute role="user">
        <UserRequestDetail />
      </ProtectedRoute>
    ),
  },
  { path: '/company/login', Component: CompanyLogin },
  { path: '/company/signup', Component: CompanySignup },
  {
    path: '/company/dashboard',
    Component: () => (
      <ProtectedRoute role="company">
        <CompanyDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/company/profile',
    Component: () => (
      <ProtectedRoute role="company">
        <CompanyProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/company/services/create',
    Component: () => (
      <ProtectedRoute role="company">
        <CompanyCreateService />
      </ProtectedRoute>
    ),
  },
  {
    path: '/company/reviews',
    Component: () => (
      <ProtectedRoute role="company">
        <CompanyReviews />
      </ProtectedRoute>
    ),
  },
  {
    path: '/company/notifications',
    Component: () => (
      <ProtectedRoute role="company">
        <CompanyNotifications />
      </ProtectedRoute>
    ),
  },
  {
    path: '/company/request/:requestId',
    Component: () => (
      <ProtectedRoute role="company">
        <CompanyRequestDetail />
      </ProtectedRoute>
    ),
  },
]);
