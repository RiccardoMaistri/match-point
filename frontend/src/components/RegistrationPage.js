import React, { useState } from 'react';
import * as api from '../services/api'; // Assuming api service will be updated

const RegistrationPage = ({ onRegistrationSuccess }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const userData = {
        email,
        username,
        phone_number: phoneNumber,
        password,
      };
      const registeredUser = await api.registerUser(userData); // This function needs to be created in api.js
      if (registeredUser) {
        // Optionally log in the user directly or redirect to login
        if (onRegistrationSuccess) onRegistrationSuccess(registeredUser);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Similar to Google login, this would involve Google's OAuth flow
    // and then hitting the backend's /google-login endpoint (which also handles registration)
    console.log('Simulating Google Sign Up...');
    setError('Google sign-up not fully implemented in this example.');
    // Example:
    // const googleUser = await GoogleAuthLibrary.signIn();
    // const backendResponse = await api.googleLogin({ google_id: googleUser.googleId, email: googleUser.email, username: 'suggest_based_on_email_or_prompt' });
    // if(onRegistrationSuccess) onRegistrationSuccess(backendResponse.user);
  };


  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Account</h2>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username-reg">
            Username
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username-reg"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email-reg">
            Email Address
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email-reg"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tel-reg">
            Phone Number (Optional)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="tel-reg"
            type="tel"
            placeholder="Your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password-reg">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="password-reg"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password-reg">
            Confirm Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="confirm-password-reg"
            type="password"
            placeholder="******************"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col items-center justify-between space-y-4">
          <button
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            Sign up with Google
          </button>
          <p className="text-center text-sm">
            Already have an account?{' '}
            <button
              onClick={() => { /* Navigate to Login Page */ }}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Log In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegistrationPage;
