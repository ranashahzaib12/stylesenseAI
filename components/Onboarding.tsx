import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { QuizDetails } from '../types';

const STYLE_OPTIONS: { [key: string]: string } = {
    'Casual':  'https://res.cloudinary.com/du6dsvari/image/upload/stylesense-vibes/casual.jpg',
    'Classic': 'https://res.cloudinary.com/du6dsvari/image/upload/stylesense-vibes/classic.jpg',
    'Elegant': 'https://res.cloudinary.com/du6dsvari/image/upload/stylesense-vibes/elegant.jpg',
    'Formal':  'https://res.cloudinary.com/du6dsvari/image/upload/stylesense-vibes/formal.jpg',
};
const GENDERS: QuizDetails['gender'][] = ['Women', 'Men', 'Prefer Not To Say'];

const getCurrentSeason = (): QuizDetails['season'] => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
};

const WelcomeProfileStep: React.FC<{ onComplete: (data: Partial<QuizDetails>) => void }> = ({ onComplete }) => {
    const [vibe, setVibe] = useState<QuizDetails['vibe']>('');
    const [gender, setGender] = useState<QuizDetails['gender']>('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!vibe || !gender) {
            setError('Please select your gender and style vibe to continue.');
            return;
        }
        setError('');
        onComplete({ vibe, gender });
    };

    return (
        <div className="text-center">
            <div className="flex justify-end mb-2">
                <span className="text-xs text-textSecondary">Step 1 of 2</span>
            </div>
            <h2 className="text-3xl font-bold text-textPrimary">Welcome to StyleSense.AI!</h2>
            <p className="mt-2 text-md text-textSecondary">Let's quickly set up your profile for personalized recommendations.</p>
            
            <div className="mt-8 space-y-6 text-left">
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-textPrimary">First, how do you identify?</label>
                    <select id="gender" name="gender" value={gender || ''} onChange={(e) => setGender(e.target.value as QuizDetails['gender'])} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-textSecondary/20 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-textPrimary">
                        <option value="">Select an option</option>
                        {GENDERS.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-textPrimary">Next, choose your primary style vibe:</label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(STYLE_OPTIONS).map(([style, img]) => (
                            <div key={style} onClick={() => setVibe(style as QuizDetails['vibe'])} className={`cursor-pointer rounded-lg overflow-hidden border-4 ${vibe === style ? 'border-primary' : 'border-transparent'} transform hover:scale-105 transition-transform`}>
                                <img src={img} alt={style} className="w-full h-32 object-cover" />
                                <p className="text-center font-medium p-2 bg-background text-sm text-textPrimary">{style}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {error && <p className="mt-4 text-sm text-error">{error}</p>}

            <button onClick={handleSubmit} className="mt-8 w-full max-w-xs bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors duration-300 shadow-md">
                Continue
            </button>
        </div>
    );
};

const FeatureTourStep: React.FC<{ onComplete: () => void; onBack: () => void }> = ({ onComplete, onBack }) => {
    const features = [
        {
            title: 'Virtual Try-On',
            description: 'Upload your photo and see how any item from our catalog looks on you instantly.',
            icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        },
        {
            title: 'AI Outfit Finder',
            description: 'Describe your dream look in plain text, and our AI will find the best matches for you.',
            icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        },
        {
            title: 'Personal StyleBot',
            description: 'Get instant, personalized fashion advice from your AI stylist, available 24/7.',
            icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        },
    ];
    return (
        <div className="text-center">
            <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-textSecondary hover:text-textPrimary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <span className="text-xs text-textSecondary">Step 2 of 2</span>
            </div>
            <h2 className="text-3xl font-bold text-textPrimary">Here's a Quick Tour</h2>
            <p className="mt-2 text-md text-textSecondary">Discover what you can do with StyleSense.AI.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map(feature => (
                    <div key={feature.title} className="bg-background p-6 rounded-lg border border-textSecondary/10">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-textPrimary">{feature.title}</h3>
                        <p className="mt-1 text-sm text-textSecondary">{feature.description}</p>
                    </div>
                ))}
            </div>
            
            <p className="mt-8 text-sm text-textSecondary">You can complete your full profile later in the 'Style Quiz' tab for even better recommendations!</p>

            <button onClick={onComplete} className="mt-6 w-full max-w-xs bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors duration-300 shadow-md">
                Finish & Explore
            </button>
        </div>
    );
};

const Onboarding: React.FC = () => {
    const [step, setStep] = useState(1);
    const [partialDetails, setPartialDetails] = useState<Partial<QuizDetails>>({});
    const { saveQuizDetails } = useAppContext();

    const handleProfileSubmit = (data: Partial<QuizDetails>) => {
        setPartialDetails(data);
        setStep(2);
    };

    const handleFinish = () => {
        const finalDetails: QuizDetails = {
            vibe: partialDetails.vibe || '',
            bodyType: '',
            gender: partialDetails.gender || '',
            season: getCurrentSeason(),
            occasion: '',
        };
        saveQuizDetails(finalDetails);
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <WelcomeProfileStep onComplete={handleProfileSubmit} />;
            case 2:
                return <FeatureTourStep onComplete={handleFinish} onBack={() => setStep(1)} />;
            default:
                return <WelcomeProfileStep onComplete={handleProfileSubmit} />;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-3xl bg-surface rounded-2xl shadow-xl p-8 md:p-12 animate-fade-in transition-all duration-300 border border-textSecondary/5">
                {renderStep()}
            </div>
        </div>
    );
};

export default Onboarding;