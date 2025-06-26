import React, { useState } from 'react';
import * as api from '../services/api'; // Assuming api service will be updated

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // The /token endpoint expects 'username' and 'password' in a FormData object
      const formData = new FormData();
      formData.append('username', username); // This can be username or email
      formData.append('password', password);

      const response = await api.loginUser(formData); // This function needs to be created in api.js
      if (response.access_token) {
        localStorage.setItem('accessToken', response.access_token); // Store token
        // Fetch user details if needed, or pass some user info to onLoginSuccess
        if (onLoginSuccess) onLoginSuccess({ username }); // Or user object from a /users/me endpoint
      } else {
        setError('Login failed: No access token received.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // This would typically redirect to Google's OAuth consent screen
    // or use the Google Sign-In for websites library.
    // For this example, we'll simulate a successful Google login.
    // In a real app, after Google auth, you'd get a token/ID from Google,
    // send it to your backend's /google-login endpoint,
    // and then the backend would return a session token or user info.
    console.log('Simulating Google Login...');
    // Example: const googleUser = await GoogleAuthLibrary.signIn();
    // const backendResponse = await api.googleLogin({ google_id: googleUser.googleId, email: googleUser.email });
    // localStorage.setItem('accessToken', backendResponse.access_token);
    // if(onLoginSuccess) onLoginSuccess(backendResponse.user);
    setError('Google login not fully implemented in this example.');
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Username or Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="Username or Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col items-center justify-between space-y-4">
          <button
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled // Enable once Google Sign-In is integrated
          >
            {/* Replace with an actual Google icon */}
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M47.5201 24.5C47.5201 22.9273 47.3801 21.4091 47.0801 19.9091H24.0001V28.5H37.3201C36.7601 31.0909 35.2401 33.3182 33.0801 34.7273V39.6364H40.2001C44.8001 35.6364 47.5201 30.5 47.5201 24.5Z" fill="#4285F4"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M24.0001 48.0001C30.4801 48.0001 35.9201 45.8637 40.2001 42.6364L33.0801 37.7273C30.9201 39.1819 27.7601 40.091 24.0001 40.091C17.7201 40.091 12.3601 36.0455 10.2001 30.3182H2.88012V35.3182C7.12012 43.0455 14.9201 48.0001 24.0001 48.0001Z" fill="#34A853"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M10.2001 27.6818C9.72012 26.2727 9.48012 24.7727 9.48012 23.2273C9.48012 21.6818 9.72012 20.1818 10.2001 18.7727V13.7727H2.88012C1.04012 17.3182 0.00012207 21.5 0.00012207 26C0.00012207 30.5 1.04012 34.6818 2.88012 38.2273L10.2001 27.6818Z" fill="#FBBC05"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M24.0001 7.90908C27.0401 7.90908 29.6801 8.95454 31.8001 10.9545L38.2401 4.5C34.0401 0.818176 28.2801 0 24.0001 0C14.9201 0 7.12012 4.95454 2.88012 12.6818L10.2001 17.6818C12.3601 11.9545 17.7201 7.90908 24.0001 7.90908Z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          <p className="text-center text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => { /* Navigate to Registration Page */ }}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign Up
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
