
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react'
import {toast} from 'react-hot-toast'
import { useNavigate } from 'react-router-dom';
import { signInApi } from '../service/api.service';
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const res = await signInApi({ emailAddress: email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      toast.success('Signed in successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.response.data.message || 'Error signing in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-900 dark:text-white">Sign In</h2>
        <form className="space-y-4"
        onSubmit={handleSignIn}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
           {isLoading ? <div className='flex items-center gap-2 justify-center'>
            <Loader2 className="animate-spin" />
            Signing In
           </div> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
