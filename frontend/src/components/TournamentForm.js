import React, { useState, useEffect } from 'react';

const INITIAL_FORM_STATE = {
  name: '',
  tournament_type: 'single',
  format: 'round_robin',
  end_date: '',
  playoff_participants: 4,
};

function TournamentForm({ onSubmit, initialData = null, onCancel }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        tournament_type: initialData.tournament_type || 'single',
        format: 'round_robin',
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
        playoff_participants: initialData.playoff_participants || 4,
      });
      setIsEditing(true);
    } else {
      setFormData(INITIAL_FORM_STATE);
      setIsEditing(false);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };
    
    if (dataToSubmit.end_date) {
      try {
        dataToSubmit.end_date = new Date(dataToSubmit.end_date + 'T00:00:00Z').toISOString();
      } catch (error) {
        console.error("Error parsing end date:", error);
      }
    } else {
      delete dataToSubmit.end_date;
    }
    onSubmit(dataToSubmit);
  };

  const inputClasses = "mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-slate-900 dark:text-slate-50 transition-all";
  const labelClasses = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">{isEditing ? 'edit' : 'emoji_events'}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{isEditing ? 'Edit Tournament' : 'Create New Tournament'}</h3>
          </div>

          <div>
            <label htmlFor="name" className={labelClasses}>
              Tournament Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={inputClasses}
              placeholder="e.g., Summer Championship 2024"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tournament_type" className={labelClasses}>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="tournament_type"
                id="tournament_type"
                value={formData.tournament_type}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="single">Single (e.g., Tennis Singles)</option>
                <option value="double">Double (e.g., Tennis Doubles)</option>
              </select>
            </div>

            <div>
              <label htmlFor="playoff_participants" className={labelClasses}>
                Playoff Qualifiers <span className="text-red-500">*</span>
              </label>
              <select
                name="playoff_participants"
                id="playoff_participants"
                value={formData.playoff_participants}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="4">4 Players</option>
                <option value="6">6 Players</option>
                <option value="8">8 Players</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                    Cancel
                </button>
            )}
            <button
              type="submit"
              className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-2xl hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              {isEditing ? 'Save Changes' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TournamentForm;
