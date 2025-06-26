import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import * as api from './services/api';

// Mock the api module
jest.mock('./services/api');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage before each test
    localStorage.clear();
  });

  test('renders LoginPage by default when no token is present', async () => {
    api.getCurrentUser.mockRejectedValue(new Error('No token')); // Simulate no active session
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });
  });

  test('renders TournamentList when a valid token is present and user is fetched', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    const mockTournaments = [{ id: 't1', name: 'Test Tournament 1' }];
    localStorage.setItem('accessToken', 'fake_valid_token');
    api.getCurrentUser.mockResolvedValue(mockUser);
    api.getTournaments.mockResolvedValue(mockTournaments);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(`Welcome, ${mockUser.username}`)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Test Tournament 1')).toBeInTheDocument();
    });
    expect(api.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(api.getTournaments).toHaveBeenCalledTimes(1);
  });

  test('redirects to LoginPage if token is invalid or session expires', async () => {
    localStorage.setItem('accessToken', 'fake_invalid_token');
    api.getCurrentUser.mockRejectedValue(new Error('Session expired'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
      expect(screen.getByText(/Session expired. Please log in again./i)).toBeInTheDocument();
    });
    expect(localStorage.getItem('accessToken')).toBeNull(); // Token should be cleared
  });

  test('navigates from LoginPage to RegistrationPage', async () => {
    api.getCurrentUser.mockRejectedValue(new Error('No token'));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });

    // Get the "Sign Up" button from the LoginPage component.
    // LoginPage uses a button with text "Sign Up" for navigation.
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);


    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    });
  });

  test('navigates from RegistrationPage to LoginPage', async () => {
    api.getCurrentUser.mockRejectedValue(new Error('No token'));
    render(<App />);
    // First, navigate to Registration Page to make it the current view
    await waitFor(() => {
        // Wait for login page to render initially
        expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);
    await waitFor(() => {
      // Wait for registration page to render
      expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    });

    // Now, click the "Log In" button on the RegistrationPage
    const logInButton = screen.getByRole('button', { name: /Log In/i });
    fireEvent.click(logInButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });
  });


  test('handles logout correctly', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    localStorage.setItem('accessToken', 'fake_valid_token');
    api.getCurrentUser.mockResolvedValue(mockUser);
    api.getTournaments.mockResolvedValue([]); // No tournaments needed for this test

    render(<App />);

    // Wait for user to be logged in
    await waitFor(() => {
      expect(screen.getByText(`Welcome, ${mockUser.username}`)).toBeInTheDocument();
    });

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    // Wait for login page to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });
    expect(localStorage.getItem('accessToken')).toBeNull(); // Token should be cleared
    expect(api.getCurrentUser).toHaveBeenCalledTimes(1); // Initial load
     // getCurrentUser should not be called again after logout for this test's scope
  });

});
