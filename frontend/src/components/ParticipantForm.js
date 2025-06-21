import React, { useState } from 'react';

const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  ranking: '', // Opzionale
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

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200 space-y-4 mb-6">
      <h4 className="text-lg font-semibold text-slate-700">Add New Participant</h4>
      {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
      <div>
        <label htmlFor="participant-name" className="block text-xs font-medium text-slate-600 mb-0.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          id="participant-name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., John Doe"
        />
      </div>
      <div>
        <label htmlFor="participant-email" className="block text-xs font-medium text-slate-600 mb-0.5">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          id="participant-email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., john.doe@example.com"
        />
      </div>
      <div>
        <label htmlFor="participant-ranking" className="block text-xs font-medium text-slate-600 mb-0.5">Ranking (Optional)</label>
        <input
          type="number"
          name="ranking"
          id="participant-ranking"
          value={formData.ranking}
          onChange={handleChange}
          min="0"
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., 1500"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        {onCancel && (
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md border border-slate-300 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors"
            >
                Cancel
            </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors"
        >
          Add Participant
        </button>
      </div>
    </form>
  );
}

export default ParticipantForm;
