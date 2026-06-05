import { Link, useLocation } from "react-router";
import { Bee, User, Building2, LogOut } from "lucide-react";

interface NavbarProps {
  userType?: "user" | "company" | null;
  userName?: string;
}

export function Navbar({ userType, userName }: NavbarProps) {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Bee className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Service Bee
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {!userType && (
              <>
                <Link
                  to="/user/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">User Login</span>
                </Link>
                <Link
                  to="/company/login"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">Company Login</span>
                </Link>
              </>
            )}
            
            {userType === "user" && (
              <>
                <Link
                  to="/user/dashboard"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive("/user/dashboard")
                      ? "bg-amber-100 text-amber-900 font-medium"
                      : "hover:bg-amber-50"
                  }`}
                >
                  Find Services
                </Link>
                <Link
                  to="/user/complaints"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive("/user/complaints")
                      ? "bg-amber-100 text-amber-900 font-medium"
                      : "hover:bg-amber-50"
                  }`}
                >
                  My Complaints
                </Link>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg">
                  <User className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-900">{userName}</span>
                </div>
                <Link
                  to="/"
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                </Link>
              </>
            )}
            
            {userType === "company" && (
              <>
                <Link
                  to="/company/dashboard"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive("/company/dashboard")
                      ? "bg-amber-100 text-amber-900 font-medium"
                      : "hover:bg-amber-50"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/company/profile"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive("/company/profile")
                      ? "bg-amber-100 text-amber-900 font-medium"
                      : "hover:bg-amber-50"
                  }`}
                >
                  Profile
                </Link>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-900">{userName}</span>
                </div>
                <Link
                  to="/"
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
