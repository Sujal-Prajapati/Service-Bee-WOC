import { createBrowserRouter } from 'react-router';
import Landing from './pages/Landing';
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import UserDashboard from './pages/UserDashboard';
import UserComplaints from './pages/UserComplaints';
import CompanyLogin from './pages/CompanyLogin';
import CompanySignup from './pages/CompanySignup';
import CompanyDashboard from './pages/CompanyDashboard';
import CompanyProfile from './pages/CompanyProfile';
import CompanyServices from './pages/CompanyServices';
import ServiceDetails from './pages/ServiceDetails';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    path: '/user/login',
    Component: UserLogin,
  },
  {
    path: '/user/signup',
    Component: UserSignup,
  },
  {
    path: '/user/dashboard',
    Component: UserDashboard,
  },
  {
    path: '/user/complaints',
    Component: UserComplaints,
  },
  {
    path: '/company/login',
    Component: CompanyLogin,
  },
  {
    path: '/company/signup',
    Component: CompanySignup,
  },
  {
    path: '/company/dashboard',
    Component: CompanyDashboard,
  },
  {
    path: '/company/services',
    Component: CompanyServices,
  },
  {
    path: '/company/profile',
    Component: CompanyProfile,
  },
  {
    path: '/user/service/:id',
    Component: ServiceDetails,
  },
]);
