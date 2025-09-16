import React, { useState } from 'react';

const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  ranking: '', // Optional
};

function ParticipantForm({ tournamentId, onSubmit, onCancel, existingParticipants = [] }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (existingParticipants.find(p => p.email.toLowerCase() === formData.email.toLowerCase().trim())) {
        setError(`Participant with email ${formData.email.trim()} already exists in this tournament.`);
        return;
    }

    const participantData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      ranking: formData.ranking ? parseInt(formData.ranking, 10) : undefined,
    };
    if (participantData.ranking && isNaN(participantData.ranking)) {
        setError('Ranking must be a number.');
        return;
    }
    if (participantData.ranking === undefined || isNaN(participantData.ranking)) {
      delete participantData.ranking;
    }

    onSubmit(tournamentId, participantData);
    setFormData(INITIAL_FORM_STATE);
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 space-y-4 my-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Add New Participant</h4>
        {error && <p className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="participant-name" className={labelClasses}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="participant-name"
              value={formData.name}
              onChange={handleChange}
              required
              className={inputClasses}
              placeholder="e.g., John Doe"
            />
          </div>
          <div>
            <label htmlFor="participant-email" className={labelClasses}>
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="participant-email"
              value={formData.email}
              onChange={handleChange}
              required
              className={inputClasses}
              placeholder="e.g., john.doe@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="participant-ranking" className={labelClasses}>Ranking (Optional)</label>
          <input
            type="number"
            name="ranking"
            id="participant-ranking"
            value={formData.ranking}
            onChange={handleChange}
            min="0"
            className={inputClasses}
            placeholder="e.g., 1500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          {onCancel && (
              <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                  Cancel
              </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm transition-colors"
          >
            Add Participant
          </button>
        </div>
      </form>
    </div>
  );
}

export default ParticipantForm;
