import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = ({ onRegister, error, isLoading }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
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
    if (!email || !password || !name || !username) {
      setFormError('Please fill in all required fields.');
      return;
    }
    onRegister({ name, username, email, password });
  };

  const inputClasses = "mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm";
  const labelClasses = "block text-sm font-medium text-primary-text";

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-12 p-4">
      <div className="bg-background p-6 sm:p-8 rounded-3xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-primary-text mb-6">Create Account</h2>
        
        {(error || formError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative mb-6" role="alert">
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
            <label className={labelClasses} htmlFor="register-username">
              Username
            </label>
            <input
              type="text"
              id="register-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClasses}
              required
              disabled={isLoading}
              placeholder="yourusername"
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-opacity-50 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-secondary-text mt-8">
          Already have an account? <Link to="/login" className="font-medium text-primary hover:text-primary-hover">Login</Link>.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
