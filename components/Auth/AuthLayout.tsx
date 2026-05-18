import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

const ThemeToggle: React.FC = () => {
    const { isDarkMode, toggleTheme } = useAppContext();
    return (
        <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-lg text-textSecondary hover:bg-background hover:text-primary transition-colors duration-200"
            aria-label="Toggle Dark Mode"
        >
            {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            )}
        </button>
    );
};

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md relative">
        <ThemeToggle />
        <div className="bg-surface rounded-2xl shadow-xl p-8 border border-textSecondary/5">
          <div className="text-center mb-8">
             <h1 className="text-3xl font-bold tracking-tight text-textPrimary">StyleSense.AI</h1>
             <p className="text-textSecondary mt-2">Your AI-Powered Fashion Assistant</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;