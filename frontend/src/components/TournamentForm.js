import React, { useState, useEffect } from 'react';

const INITIAL_FORM_STATE = {
  name: '',
  tournament_type: 'single',
  format: 'elimination',
  start_date: '',
  end_date: '',
};

function TournamentForm({ onSubmit, initialData = null, onCancel }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        tournament_type: initialData.tournament_type || 'single',
        format: initialData.format || 'elimination',
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
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
    
    if (dataToSubmit.start_date) {
      try {
        dataToSubmit.start_date = new Date(dataToSubmit.start_date + 'T00:00:00Z').toISOString();
      } catch (error) {
        console.error("Error parsing start date:", error);
      }
    } else {
      delete dataToSubmit.start_date;
    }
    
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

  const inputClasses = "mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-transparent dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{isEditing ? 'Edit Tournament' : 'Create New Tournament'}</h3>

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
            <label htmlFor="format" className={labelClasses}>
              Format <span className="text-red-500">*</span>
            </label>
            <select
              name="format"
              id="format"
              value={formData.format}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="elimination">Direct Elimination</option>
              <option value="round_robin">Round Robin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start_date" className={labelClasses}>Start Date (Optional)</label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="end_date" className={labelClasses}>End Date (Optional)</label>
            <input
              type="date"
              name="end_date"
              id="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
              <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-colors"
              >
                  Cancel
              </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 shadow-sm transition-colors"
          >
            {isEditing ? 'Save Changes' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TournamentForm;
