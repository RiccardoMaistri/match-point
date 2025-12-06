import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const LoginPage = ({ onLogin, error, isLoading }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tournamentName, setTournamentName] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (from.startsWith('/join/')) {
       localStorage.setItem('postLoginRedirect', from);
    }
    const checkForTournamentInvite = async () => {
      if (from.startsWith('/join/')) {
        const inviteCode = from.split('/join/')[1];
        try {
          const tournament = await api.getTournamentByInviteCode(inviteCode);
          setTournamentName(tournament.name);
        } catch (err) {
          console.error('Failed to fetch tournament for invite:', err);
        }
      }
    };
    checkForTournamentInvite();
  }, [from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      return;
    }
    await onLogin(usernameOrEmail, password);
  };

  const inputClasses = "mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm";
  const labelClasses = "block text-sm font-medium text-primary-text";

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-12 p-4">
      <div className="bg-background p-6 sm:p-8 rounded-3xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-primary-text mb-6">
          {tournamentName ? `Login to join "${tournamentName}"` : 'Login'}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClasses} htmlFor="login-email">
              Email or Username
            </label>
            <input
              type="text"
              id="login-email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className={inputClasses}
              required
              disabled={isLoading}
              placeholder="you@example.com or yourusername"
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-opacity-50 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-secondary-text mt-8">
          Don't have an account? <Link to="/register" state={location.state} className="font-medium text-primary hover:text-primary-hover">Register</Link>.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
