/**
 * @jest-environment jsdom
 */
import { jest, describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Onboarding from '../components/Onboarding';
import { AppProvider } from '../contexts/AppContext';

// Mock the context
const mockSaveQuizDetails = jest.fn();
const mockSetActiveTab = jest.fn();

const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AppProvider setActiveTab={mockSetActiveTab}>
    {children}
  </AppProvider>
);

// We need to mock useAppContext
jest.mock('../contexts/AppContext', () => ({
    ...jest.requireActual('../contexts/AppContext'),
    useAppContext: () => ({
        saveQuizDetails: mockSaveQuizDetails,
    }),
}));

describe('Onboarding Component', () => {
  it('renders the first step and shows an error on incomplete submission', () => {
    render(<Onboarding />, { wrapper });

    expect(screen.getByText('Welcome to StyleSense.AI!')).toBeInTheDocument();
    
    // Click continue without filling
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByText('Please select your gender and style vibe to continue.')).toBeInTheDocument();
  });

  it('navigates to the second step after completing the first', () => {
    render(<Onboarding />, { wrapper });

    // Fill the form
    fireEvent.change(screen.getByLabelText(/how do you identify/i), { target: { value: 'Women' } });
    fireEvent.click(screen.getByText('Casual'));

    // Click continue
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Check for step 2 content
    expect(screen.getByText("Here's a Quick Tour")).toBeInTheDocument();
  });

  it('completes the flow and saves data with the correct structure', async () => {
    render(<Onboarding />, { wrapper });

    // Step 1
    fireEvent.change(screen.getByLabelText(/how do you identify/i), { target: { value: 'Women' } });
    fireEvent.click(screen.getByText('Chic'));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 2
    await screen.findByText("Here's a Quick Tour");
    fireEvent.click(screen.getByRole('button', { name: /Finish & Explore/i }));

    // Check if save function was called with the full, correct quiz details object
    expect(mockSaveQuizDetails).toHaveBeenCalledWith(expect.objectContaining({
      vibe: 'Chic',
      gender: 'Women',
      favoriteColors: [],
      bodyType: '',
      season: expect.any(String), // The season will be auto-detected
      occasion: '',
      heightFt: 5,
      heightIn: 7,
      bust: 36,
      waist: 30,
      hips: 38,
    }));
  });
});