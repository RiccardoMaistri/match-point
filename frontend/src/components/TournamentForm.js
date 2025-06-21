import React, { useState, useEffect } from 'react';

const INITIAL_FORM_STATE = {
  name: '',
  tournament_type: 'single',
  format: 'elimination',
  start_date: '',
  // invitation_link: '', // Potrebbe essere generato dal backend
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
        // La data nel backend è ISO string. Per l'input type="date", serve YYYY-MM-DD.
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
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
      // Converte YYYY-MM-DD in ISO string completa (aggiungendo orario T00:00:00.000Z)
      // o considera il fuso orario locale se necessario.
      // Per semplicità, assumiamo UTC mezzanotte.
      try {
        dataToSubmit.start_date = new Date(dataToSubmit.start_date + 'T00:00:00Z').toISOString();
      } catch (error) {
        console.error("Error parsing date:", error);
        // Gestisci l'errore, magari mostrando un messaggio all'utente
        // Per ora, se la data non è valida, la inviamo così com'è o la omettiamo
        // delete dataToSubmit.start_date;
      }
    } else {
      // Se il campo data è vuoto, assicurati che venga inviato come null o omesso,
      // a seconda di come il backend lo gestisce (Pydantic Optional lo gestisce bene se omesso)
      delete dataToSubmit.start_date;
    }
    onSubmit(dataToSubmit);
    // Non resettare il form qui se si sta editando, il reset avviene in App.js o al cancel.
    // if (!isEditing) {
    //   setFormData(INITIAL_FORM_STATE);
    // }
  };

  return (
    // La classe bg-white p-6 rounded-lg shadow-lg è già stata applicata in App.js al contenitore di questo form
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">{isEditing ? 'Edit Tournament' : 'Create New Tournament'}</h3>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Tournament Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., Summer Championship 2024"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="tournament_type" className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            name="tournament_type"
            id="tournament_type"
            value={formData.tournament_type}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="single">Single (e.g., Tennis Singles)</option>
            <option value="double">Double (e.g., Tennis Doubles)</option>
          </select>
        </div>

        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
            Format <span className="text-red-500">*</span>
          </label>
          <select
            name="format"
            id="format"
            value={formData.format}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="elimination">Direct Elimination</option>
            <option value="round_robin">Round Robin</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
        <input
          type="date"
          name="start_date"
          id="start_date"
          value={formData.start_date}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
                Cancel
            </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isEditing ? 'Save Changes' : 'Create Tournament'}
        </button>
      </div>
    </form>
  );
}

export default TournamentForm;
