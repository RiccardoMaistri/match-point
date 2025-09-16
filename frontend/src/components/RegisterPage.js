import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = ({ onRegister, error, isLoading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }
    if (!email || !password || !name) {
      setFormError('Please fill in all required fields.');
      return;
    }
    onRegister({ name, email, password });
  };

  const inputClasses = "mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors disabled:opacity-50";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-12">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">Create Account</h2>
        
        {(error || formError) && (
          <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <span className="block sm:inline">{error || formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClasses} htmlFor="register-name">
              Full Name
            </label>
            <input
              type="text"
              id="register-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              required
              disabled={isLoading}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="register-email">
              Email Address
            </label>
            <input
              type="email"
              id="register-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              required
              disabled={isLoading}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="register-password">
              Password (min. 8 characters)
            </label>
            <input
              type="password"
              id="register-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              required
              minLength="8"
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClasses}
              required
              minLength="8"
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:bg-indigo-400 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
          Already have an account? <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Login here</Link>.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
