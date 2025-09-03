import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import {toast} from 'react-hot-toast'
import { useNavigate } from 'react-router-dom';
import { signInApi } from '../../service/api.service';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to appropriate dashboard based on role
      const dashboardPath = user?.role === 'admin' ? '/' : '/vendor';
      navigate(dashboardPath);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSignIn = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const res = await signInApi({ emailAddress: email, password });
      
      // Store token separately for API calls
      localStorage.setItem('accessToken', res.data.accessToken);
      
      // Use the login method from AuthContext
      login(res.data.user, res.data.accessToken);
      
      toast.success('Signed in successfully');
      
      // Navigate to appropriate dashboard based on role
      const dashboardPath = res.data.user?.role === 'admin' ? '/' : '/vendor';
      navigate(dashboardPath);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error signing in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">
        {/* Main Card */}
        <div className="bg-black backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-orange-500/30">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500 mb-3 shadow-lg">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500 mb-1">
              Tiffix
            </h1>
            <h2 className="text-lg font-semibold text-white mb-0.5">Welcome Back</h2>
            <p className="text-orange-300 text-sm">Sign in to your admin dashboard</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignIn}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-black border border-orange-500/30 rounded-lg backdrop-blur-sm text-white placeholder-orange-300/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 shadow-sm hover:border-orange-500/60"
                  placeholder="admin@tiffix.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-black border border-orange-500/30 rounded-lg backdrop-blur-sm text-white placeholder-orange-300/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 shadow-sm hover:border-orange-500/60"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg hover:bg-orange-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 font-medium shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-orange-300 text-xs">
              Secure admin access • Tiffix Dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login