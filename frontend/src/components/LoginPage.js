import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage = ({ onLogin, onGoogleLogin, error, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }
    onLogin(email, password);
  };

  const inputClasses = "mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm";
  const labelClasses = "block text-sm font-medium text-primary-text";

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-12 p-4">
      <div className="bg-background p-6 sm:p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-primary-text mb-6">Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClasses} htmlFor="login-email">
              Email Address
            </label>
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              required
              disabled={isLoading}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="login-password">
              Password
            </label>
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              required
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-4 pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-opacity-50 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={onGoogleLogin}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-primary-text bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8 0 123.8 111.8 12.8 244 12.8c70.3 0 129.8 27.8 174.3 71.9l-64.4 64.4c-23.5-22.3-56.2-36.3-94.9-36.3-72.4 0-131.3 58.8-131.3 131.3s58.9 131.3 131.3 131.3c76.3 0 115.4-32.3 121.2-77.9H244v-92.2h236.8c2.5 12.9 3.2 26.4 3.2 40.8z"></path></svg>
              {isLoading ? '...' : 'Sign in with Google'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-secondary-text mt-8">
          Don't have an account? <Link to="/register" className="font-medium text-primary hover:text-primary-hover">Register here</Link>.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
