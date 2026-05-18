/**
 * @jest-environment jsdom
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';
import * as AppContext from '../contexts/AppContext';

// Mock services and hooks
jest.mock('../services/apiService');
const mockFetchRecommendations = apiService.fetchRecommendations as jest.Mock;

jest.mock('../hooks/useWeather', () => () => ({
  weather: { temp: 20, description: 'Clear', icon: '☀️' },
  weatherIsFallback: false,
}));

jest.mock('../contexts/AuthContext', () => ({
    ...jest.requireActual('../contexts/AuthContext'),
    useAuth: () => ({
        user: { email: 'test@user.com' },
    }),
}));

const mockQuizDetails = {
    vibe: 'Casual' as const,
    favoriteColors: ['#3b82f6'],
    bodyType: 'Rectangle' as const,
    gender: 'Men' as const,
    season: 'Summer' as const,
    occasion: 'Casual' as const,
};

const mockOutfits = [
    { id: 1, name: 'Casual T-Shirt', category: 'Any', imageUrl: 'tshirt.jpg', gender: 'Men' as const },
    { id: 2, name: 'Smart Blazer', category: 'Cold', imageUrl: 'blazer.jpg', gender: 'Men' as const },
];

let mockIsQuizCompleted = false;
let mockTriedOnOutfits: any[] = [];
// Mock useAppContext specifically for Dashboard
jest.mock('../contexts/AppContext', () => ({
    ...jest.requireActual('../contexts/AppContext'),
    useAppContext: () => ({
        weather: { temp: 20, description: 'Clear', icon: '☀️' },
        location: { name: 'Testville', country: 'Testland' },
        weatherIsFallback: false,
        quizDetails: mockIsQuizCompleted ? mockQuizDetails : null,
        isQuizCompleted: mockIsQuizCompleted,
        triedOnOutfits: mockTriedOnOutfits,
        filteredProducts: mockOutfits,
        productsLoading: false,
        selectForTryOn: jest.fn(),
        tryOnJobs: [],
        clearCompletedJobs: jest.fn(),
        setActiveTab: jest.fn(),
        resetQuiz: jest.fn(),
    }),
}));


const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <AuthProvider>
        <AppContext.AppProvider setActiveTab={jest.fn()}>
            {children}
        </AppContext.AppProvider>
    </AuthProvider>
);


describe('Dashboard Component', () => {
  beforeEach(() => {
    mockFetchRecommendations.mockResolvedValue(mockOutfits);
    mockIsQuizCompleted = false; // Reset before each test
  });
  
  it('renders loading skeletons initially when products are loading', () => {
    // Override the mock for this specific test
    // FIX: Replaced `require` with an ES module `import` to resolve TypeScript error.
    jest.spyOn(AppContext, 'useAppContext').mockImplementation(() => ({
        weather: null,
        location: null,
        productsLoading: true,
        filteredProducts: [],
        weatherIsFallback: false,
        weatherError: null,
        quizDetails: null,
        isQuizCompleted: false,
        triedOnOutfits: [],
        resetQuiz: jest.fn(),
        // Add other context properties to avoid runtime errors in the component
        selectForTryOn: jest.fn(),
        tryOnJobs: [],
        clearCompletedJobs: jest.fn(),
        setActiveTab: jest.fn(),
    }));

    render(<Dashboard />, { wrapper });
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays welcome message and recommendations after loading', async () => {
    render(<Dashboard />, { wrapper });
    
    expect(await screen.findByText('Welcome, test!')).toBeInTheDocument();
    expect(await screen.findByText('Casual T-Shirt')).toBeInTheDocument();
    expect(await screen.findByText('Smart Blazer')).toBeInTheDocument();
  });

  it('shows style profile summary only when quiz is completed', async () => {
    const { rerender } = render(<Dashboard />, { wrapper });
    
    await waitFor(() => {
        expect(screen.queryByText('Your Style Profile')).not.toBeInTheDocument();
    });
    
    mockIsQuizCompleted = true;
    rerender(<Dashboard />);
    
    await waitFor(() => {
        expect(screen.getByText('Your Style Profile')).toBeInTheDocument();
        expect(screen.getByText('Casual')).toBeInTheDocument();
    });
  });
});
