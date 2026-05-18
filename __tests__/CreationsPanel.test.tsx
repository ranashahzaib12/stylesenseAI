/**
 * @jest-environment jsdom
 */
import { jest, describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import CreationsPanel from '../components/CreationsPanel';
import { TryOnJob } from '../types';

// Mock the context
const mockSetActiveTab = jest.fn();
const mockClearCompletedJobs = jest.fn();
let mockJobs: TryOnJob[] = [];

// We need to mock useAppContext
jest.mock('../contexts/AppContext', () => ({
    ...jest.requireActual('../contexts/AppContext'),
    useAppContext: () => ({
        tryOnJobs: mockJobs,
        setActiveTab: mockSetActiveTab,
        clearCompletedJobs: mockClearCompletedJobs,
    }),
}));


describe('CreationsPanel Component', () => {
  it('shows a message and button when there are no jobs', () => {
    mockJobs = [];
    render(<CreationsPanel />);

    expect(screen.getByText('Your virtual try-on results will appear here.')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Try Something On/i });
    fireEvent.click(button);
    expect(mockSetActiveTab).toHaveBeenCalledWith('Virtual Try-On');
  });

  it('renders a list of jobs when they exist', () => {
    mockJobs = [
      { id: 'job-1', status: 'processing', personImage: 'person1.jpg', garment: { name: 'Garment 1', imageUrl: 'g1.jpg' } },
      { id: 'job-2', status: 'completed', personImage: 'person2.jpg', garment: { name: 'Garment 2', imageUrl: 'g2.jpg' }, resultImage: 'res2.jpg' },
    ];
    render(<CreationsPanel />);

    expect(screen.getByText('Garment 1')).toBeInTheDocument();
    expect(screen.getByText('Garment 2')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('shows "Clear Completed" button only when there are completed jobs and calls the clear function', () => {
    mockJobs = [
      { id: 'job-1', status: 'processing', personImage: 'person1.jpg', garment: { name: 'Garment 1', imageUrl: 'g1.jpg' } },
      { id: 'job-2', status: 'failed', personImage: 'person2.jpg', garment: { name: 'Garment 2', imageUrl: 'g2.jpg' }, error: 'Failed' },
    ];
    const { rerender } = render(<CreationsPanel />);
    
    // No completed jobs, so no button
    expect(screen.queryByRole('button', { name: /Clear Completed/i })).not.toBeInTheDocument();

    // Add a completed job
    mockJobs.push({ id: 'job-3', status: 'completed', personImage: 'person3.jpg', garment: { name: 'Garment 3', imageUrl: 'g3.jpg' }, resultImage: 'res3.jpg' });
    rerender(<CreationsPanel />);
    
    const clearButton = screen.getByRole('button', { name: /Clear Completed/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(mockClearCompletedJobs).toHaveBeenCalledTimes(1);
  });
});
