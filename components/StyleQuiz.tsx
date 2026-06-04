import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { QuizDetails } from '../types';
import Spinner from './Spinner';

const STYLE_OPTIONS = {
    'Casual':  'https://res.cloudinary.com/du6dsvari/image/upload/stylesense-vibes/casual.jpg',
    'Classic': 'https://res.cloudinary.com/du6dsvari/image/upload/stylesense-vibes/classic.jpg',
    'Elegant': 'https://res.cloudinary.com/du6dsvari/image/upload/stylesense-vibes/elegant.jpg',
    'Formal':  'https://res.cloudinary.com/du6dsvari/image/upload/stylesense-vibes/formal.jpg',
};

const BODY_TYPES = ['Hourglass', 'Pear', 'Apple', 'Rectangle'];
const GENDERS = ['Women', 'Men', 'Prefer Not To Say'];
const SEASONS: QuizDetails['season'][] = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS: QuizDetails['occasion'][] = ['Casual', 'Formal', 'Streetwear', 'Old Money'];

type QuizErrors = Partial<Record<keyof QuizDetails | 'measurements', string>>;

interface Props {
  isInitialSetup?: boolean;
}

const getCurrentSeason = (): QuizDetails['season'] => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
};

const StyleQuiz: React.FC<Props> = ({ isInitialSetup = false }) => {
  const { quizDetails, saveQuizDetails, setActiveTab } = useAppContext();
  const [formData, setFormData] = useState<QuizDetails>({
    vibe: '',
    bodyType: '',
    gender: '',
    heightFt: 5,
    heightIn: 7,
    bust: 36,
    waist: 30,
    hips: 38,
    season: getCurrentSeason(),
    occasion: '',
  });
  const [errors, setErrors] = useState<QuizErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (quizDetails) {
      setFormData(prev => ({...prev, ...quizDetails}));
    }
  }, [quizDetails]);

  const handleVibeSelect = (vibe: QuizDetails['vibe']) => {
    setFormData(prev => ({ ...prev, vibe }));
    if (errors.vibe) setErrors(e => ({...e, vibe: undefined}));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.match(/heightFt|heightIn|bust|waist|hips/) ? (value === '' ? undefined : Number(value)) : value
    }));
     if (errors[name as keyof QuizErrors]) setErrors(e => ({...e, [name]: undefined}));
  };

  const validateForm = (): boolean => {
      const newErrors: QuizErrors = {};
      if (!formData.vibe) newErrors.vibe = 'Please choose your vibe.';
      if (!formData.bodyType) newErrors.bodyType = 'Please select your body type.';
      if (!formData.gender) newErrors.gender = 'Please select a gender.';
      if (!formData.occasion) newErrors.occasion = 'Please select a preferred occasion.';
      if (!formData.season) newErrors.season = 'Please select a season.';
      
      const measurements = ['heightFt', 'heightIn', 'bust', 'waist', 'hips'];
      for(const m of measurements) {
          const value = formData[m as keyof QuizDetails] as number | undefined;
          if (value !== undefined && value < 0) {
              newErrors.measurements = 'Measurements cannot be negative.';
              break;
          }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setSuccess(false);
    
    setTimeout(() => {
      saveQuizDetails(formData);
      setLoading(false);
      setSuccess(true);
      
      if (!isInitialSetup) {
          setTimeout(() => {
              setActiveTab('Dashboard');
          }, 1500);
      } else {
        setTimeout(() => setSuccess(false), 3000);
      }
    }, 1000);
  };

  return (
    <div className={`max-w-4xl mx-auto animate-fade-in ${isInitialSetup ? 'pt-12 pb-12' : ''}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-textPrimary">
            {isInitialSetup ? "Welcome! Let's Get Started" : "Your Style Profile"}
        </h2>
        <p className="mt-2 text-md text-textSecondary">
            {isInitialSetup 
                ? "Complete your profile below to unlock personalized recommendations and AI styling."
                : "Help us understand your unique style for better recommendations."
            }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-xl shadow-lg space-y-12 border border-textSecondary/5">
        <fieldset>
          <legend className="text-xl font-semibold mb-1 text-textPrimary">1. Choose Your Vibe</legend>
          {errors.vibe && <p className="text-sm text-error mb-2">{errors.vibe}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(STYLE_OPTIONS).map(([style, img]) => (
              <div key={style} onClick={() => handleVibeSelect(style as QuizDetails['vibe'])} className={`cursor-pointer rounded-lg overflow-hidden border-4 ${formData.vibe === style ? 'border-primary' : 'border-transparent'} transform hover:scale-105 transition-transform`}>
                <img src={img} alt={style} className="w-full h-48 object-cover" />
                <p className="text-center font-medium p-2 bg-background text-textPrimary">{style}</p>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xl font-semibold mb-1 text-textPrimary">2. Your Profile</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label htmlFor="gender" className="block text-sm font-medium text-textPrimary">Gender</label>
              <select id="gender" name="gender" value={formData.gender || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-textSecondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-lg bg-background text-textPrimary transition-colors">
                <option value="">Select gender</option>
                {GENDERS.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              {errors.gender && <p className="text-sm text-error mt-1">{errors.gender}</p>}
            </div>
             <div>
              <label htmlFor="bodyType" className="block text-sm font-medium text-textPrimary">Body Type</label>
              <select id="bodyType" name="bodyType" value={formData.bodyType || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-textSecondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-lg bg-background text-textPrimary transition-colors">
                <option value="">Select your body type</option>
                {BODY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
               {errors.bodyType && <p className="text-sm text-error mt-1">{errors.bodyType}</p>}
            </div>
             <div>
              <label htmlFor="occasion" className="block text-sm font-medium text-textPrimary">Preferred Occasion/Style</label>
              <select id="occasion" name="occasion" value={formData.occasion || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-textSecondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-lg bg-background text-textPrimary transition-colors">
                <option value="">Select style</option>
                {OCCASIONS.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              {errors.occasion && <p className="text-sm text-error mt-1">{errors.occasion}</p>}
            </div>
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-textPrimary">Primary Season</label>
              <select id="season" name="season" value={formData.season || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border border-textSecondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-lg bg-background text-textPrimary transition-colors">
                <option value="">Select season</option>
                {SEASONS.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              {errors.season && <p className="text-sm text-error mt-1">{errors.season}</p>}
            </div>
          </div>
        </fieldset>
        
        <fieldset>
             <legend className="text-xl font-semibold mb-1 text-textPrimary">3. Measurements (Optional)</legend>
            {errors.measurements && <p className="text-sm text-error mb-2">{errors.measurements}</p>}
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div className="col-span-2 flex gap-2">
                  <div className="flex-1">
                      <label htmlFor="heightFt" className="block text-sm font-medium text-textPrimary">Height (ft)</label>
                      <input type="number" name="heightFt" id="heightFt" value={formData.heightFt || ''} onChange={handleInputChange} className="mt-1 w-full bg-background border border-textSecondary/20 rounded-md shadow-sm py-2 px-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                   <div className="flex-1">
                      <label htmlFor="heightIn" className="block text-sm font-medium text-textPrimary">(in)</label>
                      <input type="number" name="heightIn" id="heightIn" value={formData.heightIn || ''} onChange={handleInputChange} className="mt-1 w-full bg-background border border-textSecondary/20 rounded-md shadow-sm py-2 px-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
              </div>
              <div>
                  <label htmlFor="bust" className="block text-sm font-medium text-textPrimary">Bust (in)</label>
                  <input type="number" name="bust" id="bust" value={formData.bust || ''} onChange={handleInputChange} className="mt-1 w-full bg-background border border-textSecondary/20 rounded-md shadow-sm py-2 px-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                  <label htmlFor="waist" className="block text-sm font-medium text-textPrimary">Waist (in)</label>
                  <input type="number" name="waist" id="waist" value={formData.waist || ''} onChange={handleInputChange} className="mt-1 w-full bg-background border border-textSecondary/20 rounded-md shadow-sm py-2 px-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                  <label htmlFor="hips" className="block text-sm font-medium text-textPrimary">Hips (in)</label>
                  <input type="number" name="hips" id="hips" value={formData.hips || ''} onChange={handleInputChange} className="mt-1 w-full bg-background border border-textSecondary/20 rounded-md shadow-sm py-2 px-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
        </fieldset>

        <div className="text-center">
            <button
                type="submit"
                disabled={loading}
                className="w-full max-w-xs flex justify-center items-center bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors duration-300 shadow-md"
            >
                {loading ? <Spinner /> : (isInitialSetup ? 'Start My Journey' : 'Save & Return to Dashboard')}
            </button>
            {success && <p className="mt-4 text-success">{isInitialSetup ? 'Profile updated!' : 'Profile updated! Redirecting...'}</p>}
        </div>
      </form>
    </div>
  );
};

export default StyleQuiz;