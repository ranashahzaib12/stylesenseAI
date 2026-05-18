import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import JobItem from './Creations/JobItem';

const CreationsPanel: React.FC = () => {
  const { tryOnJobs, setActiveTab, clearCompletedJobs } = useAppContext();
  
  const hasCompletedJobs = tryOnJobs.some(job => job.status === 'completed' || job.status === 'failed');

  if (tryOnJobs.length === 0) {
    return (
      <div className="bg-surface p-6 rounded-lg shadow-md mb-8 text-center border border-textSecondary/5">
        <h3 className="text-xl font-bold text-textPrimary mb-2">My Creations</h3>
        <p className="text-textSecondary">Your virtual try-on results will appear here.</p>
        <button
            onClick={() => setActiveTab('Virtual Try-On')}
            className="mt-4 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90"
        >
            Try Something On
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-md mb-8 border border-textSecondary/5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-textPrimary">My Creations</h3>
        {hasCompletedJobs && (
          <button onClick={clearCompletedJobs} className="text-sm text-primary hover:underline">
            Clear Completed
          </button>
        )}
      </div>
      <div className="space-y-4">
        {tryOnJobs.map(job => (
          <JobItem key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
};

export default CreationsPanel;