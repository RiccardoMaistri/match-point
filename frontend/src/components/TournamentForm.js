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

  const inputClasses = "mt-1 block w-full px-4 py-3 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm text-text-light dark:text-text-dark";
  const labelClasses = "block text-sm font-medium text-text-light dark:text-text-dark mb-1";

  return (
    <div className="fixed inset-0 bg-background-dark bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-card-light dark:bg-card-dark p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-6">{isEditing ? 'Edit Tournament' : 'Create New Tournament'}</h3>

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

          <div className="flex justify-end space-x-4 pt-4">
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 text-sm font-semibold text-subtext-light dark:text-subtext-dark bg-border-light dark:bg-border-dark rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                    Cancel
                </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-2xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg transition-colors"
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
