import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import VirtualTryOn from './components/VirtualTryOn';
import OutfitGenerator from './components/OutfitGenerator';
import StyleChatbot from './components/StyleChatbot';
import StyleQuiz from './components/StyleQuiz';
import StyleFeedback from './components/Feedback/StyleFeedback';
import { NAV_ITEMS } from './constants';
import type { NavItem } from './types';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';

const ThemeToggle: React.FC = () => {
    const { isDarkMode, toggleTheme } = useAppContext();
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-textSecondary hover:bg-background hover:text-primary transition-colors duration-200"
            aria-label="Toggle Dark Mode"
        >
            {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            )}
        </button>
    );
};

const MainAppUI: React.FC<{ activeTab: NavItem; setActiveTab: (tab: NavItem) => void }> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': return <Dashboard />;
      case 'Virtual Try-On': return <VirtualTryOn />;
      case 'Outfit Generator': return <OutfitGenerator />;
      case 'Style Chatbot': return <StyleChatbot />;
      case 'Style Quiz': return <StyleQuiz />;
      case 'Feedback': return <StyleFeedback />;
      default: return <Dashboard />;
    }
  };

  const Icon = ({ path }: { path: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans transition-colors duration-300">
      <header className="bg-surface shadow-sm sticky top-0 z-10 border-b border-textSecondary/10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight text-textPrimary">StyleSense<span className="text-primary">.AI</span></h1>
          </div>
          <div className="flex items-center space-x-1">
            <nav className="hidden md:flex space-x-1 items-center">
              {Object.entries(NAV_ITEMS).map(([key, { iconPath, shortLabel }]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as NavItem)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === key
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-textSecondary hover:bg-background hover:text-textPrimary'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                  </svg>
                  <span className="hidden lg:inline">{shortLabel}</span>
                </button>
              ))}
            </nav>
            <div className="h-6 w-px bg-textSecondary/20 mx-1 hidden md:block"></div>
            <ThemeToggle />
            <button
              onClick={logout}
              className="ml-1 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-textSecondary hover:bg-background hover:text-error"
              title="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-textSecondary/10 shadow-lg">
        <nav className="flex justify-around items-center h-16">
          {Object.entries(NAV_ITEMS).map(([key, { iconPath, shortLabel }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as NavItem)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                activeTab === key
                  ? 'text-primary'
                  : 'text-textSecondary'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${activeTab === key ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === key ? 2.5 : 2} d={iconPath} />
              </svg>
              <span className="text-xs font-medium mt-0.5">{shortLabel}</span>
            </button>
          ))}
        </nav>
      </footer>
      <div className="md:hidden h-20"></div>
    </div>
  );
};


const MainOrOnboarding: React.FC<{ activeTab: NavItem; setActiveTab: (tab: NavItem) => void }> = ({ activeTab, setActiveTab }) => {
    const { isQuizCompleted } = useAppContext();

    if (!isQuizCompleted) {
        // Force the complete Style Quiz if not done
        return <StyleQuiz isInitialSetup={true} />;
    }

    return <MainAppUI activeTab={activeTab} setActiveTab={setActiveTab} />;
};


const AppContent: React.FC = () => {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<NavItem>('Dashboard');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        )
    }

    return (
        <AppProvider setActiveTab={setActiveTab}>
            {user ? <MainOrOnboarding activeTab={activeTab} setActiveTab={setActiveTab} /> : <AuthPage />}
        </AppProvider>
    );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;