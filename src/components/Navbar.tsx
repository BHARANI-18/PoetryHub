import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Search, User, LogOut, Plus, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <span>PoetryHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/explore" className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
              <Search className="w-4 h-4" />
              <span>Explore</span>
            </Link>
            
            {user ? (
              <>
                <Link to="/create" className="flex items-center space-x-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Write</span>
                </Link>
                <Link to={`/profile/${user.id}`} className="flex items-center space-x-1 text-gray-700 hover:text-purple-600 transition-colors">
                  <User className="w-4 h-4" />
                  <span>{user.username}</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4 pt-4">
              <Link to="/explore" className="flex items-center space-x-2 text-gray-700 hover:text-purple-600">
                <Search className="w-4 h-4" />
                <span>Explore</span>
              </Link>
              
              {user ? (
                <>
                  <Link to="/create" className="flex items-center space-x-2 text-gray-700 hover:text-purple-600">
                    <Plus className="w-4 h-4" />
                    <span>Write</span>
                  </Link>
                  <Link to={`/profile/${user.id}`} className="flex items-center space-x-2 text-gray-700 hover:text-purple-600">
                    <User className="w-4 h-4" />
                    <span>{user.username}</span>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-700 hover:text-red-600">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-purple-600">
                    Login
                  </Link>
                  <Link to="/register" className="text-gray-700 hover:text-purple-600">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;