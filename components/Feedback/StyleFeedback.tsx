import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Spinner from '../Spinner';

const Star: React.FC<{ filled: boolean; onClick: () => void; onMouseEnter: () => void; onMouseLeave: () => void; }> = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
  <svg
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`w-10 h-10 cursor-pointer transition-colors ${filled ? 'text-warning' : 'text-textSecondary/40'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const StyleFeedback: React.FC = () => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating before submitting.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    const { error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id,
        rating,
        comment,
      });
      
    setLoading(false);
    if (insertError) {
      setError(`Failed to submit feedback: ${insertError.message}`);
    } else {
      setSuccess("Thank you for your feedback! We appreciate you helping us improve.");
      setRating(0);
      setComment('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-textPrimary">Share Your Feedback</h2>
        <p className="mt-2 text-md text-textSecondary">We'd love to hear what you think about StyleSense.AI.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-xl shadow-lg space-y-6 border border-textSecondary/5">
        <div>
          <label className="block text-lg font-medium text-center text-textPrimary mb-4">How would you rate your experience?</label>
          <div className="flex justify-center" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map(starIndex => (
              <Star
                key={starIndex}
                filled={(hoverRating || rating) >= starIndex}
                onClick={() => setRating(starIndex)}
                onMouseEnter={() => setHoverRating(starIndex)}
                onMouseLeave={() => {}}
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-lg font-medium text-textPrimary">Any comments or suggestions?</label>
          <textarea
            id="comment"
            rows={5}
            className="mt-2 block w-full shadow-sm sm:text-sm border border-textSecondary/20 rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary px-3 py-2.5 resize-none transition-colors"
            placeholder="Tell us more about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg px-4 py-3 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-success/10 border border-success/30 text-success text-sm rounded-lg px-4 py-3 text-center">
            {success}
          </div>
        )}

        <div className="text-center">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full max-w-xs flex justify-center items-center bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-md"
          >
            {loading ? <Spinner /> : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StyleFeedback;