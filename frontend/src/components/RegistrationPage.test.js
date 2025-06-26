import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegistrationPage from './RegistrationPage';
import * as api from '../services/api';

// Mock the api module
jest.mock('../services/api');

describe('RegistrationPage', () => {
  const mockOnRegistrationSuccess = jest.fn();
  const mockOnNavigateToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form correctly', () => {
    render(<RegistrationPage onRegistrationSuccess={mockOnRegistrationSuccess} onNavigateToLogin={mockOnNavigateToLogin} />);
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument(); // Use regex for exact match if multiple "Password" labels
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign up with Google/i })).toBeInTheDocument();
    expect(screen.getByText(/Already have an account?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
  });

  test('allows user to type in registration details', () => {
    render(<RegistrationPage onRegistrationSuccess={mockOnRegistrationSuccess} onNavigateToLogin={mockOnNavigateToLogin} />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'newpassword123' } });

    expect(screen.getByLabelText(/Username/i)).toHaveValue('newuser');
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('new@example.com');
    expect(screen.getByLabelText(/Phone Number/i)).toHaveValue('1234567890');
    expect(screen.getByLabelText(/^Password$/i)).toHaveValue('newpassword123');
    expect(screen.getByLabelText(/Confirm Password/i)).toHaveValue('newpassword123');
  });

  test('shows error if passwords do not match', async () => {
    render(<RegistrationPage onRegistrationSuccess={mockOnRegistrationSuccess} onNavigateToLogin={mockOnNavigateToLogin} />);
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText(/Passwords don't match/i)).toBeInTheDocument();
    });
    expect(api.registerUser).not.toHaveBeenCalled();
    expect(mockOnRegistrationSuccess).not.toHaveBeenCalled();
  });

  test('calls api.registerUser and onRegistrationSuccess on successful registration', async () => {
    const mockUser = { id: '1', username: 'newuser', email: 'new@example.com' };
    api.registerUser.mockResolvedValue(mockUser);

    render(<RegistrationPage onRegistrationSuccess={mockOnRegistrationSuccess} onNavigateToLogin={mockOnNavigateToLogin} />);
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(api.registerUser).toHaveBeenCalledTimes(1);
      expect(api.registerUser).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        phone_number: '1234567890',
        password: 'newpassword123',
      });
      expect(mockOnRegistrationSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnRegistrationSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  test('displays error message on failed registration', async () => {
    api.registerUser.mockRejectedValue(new Error('Email already exists'));
    render(<RegistrationPage onRegistrationSuccess={mockOnRegistrationSuccess} onNavigateToLogin={mockOnNavigateToLogin} />);

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'exists@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(api.registerUser).toHaveBeenCalledTimes(1);
      expect(mockOnRegistrationSuccess).not.toHaveBeenCalled();
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });

  test('Log In button navigates to login page', () => {
    render(<RegistrationPage onRegistrationSuccess={mockOnRegistrationSuccess} onNavigateToLogin={mockOnNavigateToLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));
    expect(mockOnNavigateToLogin).toHaveBeenCalledTimes(1);
  });

  test('Google Sign Up button is present (though functionality is stubbed)', () => {
    render(<RegistrationPage onRegistrationSuccess={mockOnRegistrationSuccess} onNavigateToLogin={mockOnNavigateToLogin} />);
    const googleButton = screen.getByRole('button', { name: /Sign up with Google/i });
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toBeDisabled(); // As per current implementation
  });
});
