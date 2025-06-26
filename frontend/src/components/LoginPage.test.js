import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';
import * as api from '../services/api';

// Mock the api module
jest.mock('../services/api');

describe('LoginPage', () => {
  const mockOnLoginSuccess = jest.fn();
  const mockOnNavigateToRegister = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders login form correctly', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} onNavigateToRegister={mockOnNavigateToRegister} />);
    expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('allows user to type in username and password', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} onNavigateToRegister={mockOnNavigateToRegister} />);
    fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    expect(screen.getByLabelText(/Username or Email/i)).toHaveValue('testuser');
    expect(screen.getByLabelText(/Password/i)).toHaveValue('password123');
  });

  test('calls api.loginUser and onLoginSuccess on successful login', async () => {
    api.loginUser.mockResolvedValue({ access_token: 'fake_token' });
    // Mock getCurrentUser as it's called in App.js's handleLoginSuccess via onLoginSuccess prop
    // For this component test, we only care that onLoginSuccess is called.
    // The actual implementation of onLoginSuccess is an integration concern.

    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} onNavigateToRegister={mockOnNavigateToRegister} />);

    fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(api.loginUser).toHaveBeenCalledTimes(1);
      const formData = api.loginUser.mock.calls[0][0];
      expect(formData.get('username')).toBe('testuser');
      expect(formData.get('password')).toBe('password123');
      expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
      // We don't check the argument for onLoginSuccess here as it's passed {username}
      // and the full user object is fetched by the parent.
    });
  });

  test('displays error message on failed login', async () => {
    api.loginUser.mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} onNavigateToRegister={mockOnNavigateToRegister} />);

    fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(api.loginUser).toHaveBeenCalledTimes(1);
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('Sign Up button navigates to registration page', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} onNavigateToRegister={mockOnNavigateToRegister} />);
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    expect(mockOnNavigateToRegister).toHaveBeenCalledTimes(1);
  });

  test('Google Sign In button is present (though functionality is stubbed)', () => {
    render(<LoginPage onLoginSuccess={mockOnLoginSuccess} onNavigateToRegister={mockOnNavigateToRegister} />);
    const googleButton = screen.getByRole('button', { name: /Sign in with Google/i });
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toBeDisabled(); // As per current implementation
    // fireEvent.click(googleButton);
    // await waitFor(() => {
    //   expect(screen.getByText(/Google login not fully implemented/i)).toBeInTheDocument();
    // });
  });
});
