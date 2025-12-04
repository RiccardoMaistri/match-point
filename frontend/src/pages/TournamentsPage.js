import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import TournamentCard from '../components/TournamentCard';

const TournamentsPage = ({ currentUser, onCreateTournament }) => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getTournaments();
        setTournaments(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch tournaments');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const handleCreateTournament = () => {
    onCreateTournament();
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(tournament => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
      const isJoined = currentUser && tournament.participants?.some(p => p.email === currentUser.email);
      return matchesSearch && matchesStatus && !isJoined;
    });
  }, [tournaments, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-20">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-4 rounded-2xl">
          <p className="font-medium">Error loading tournaments</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Tournaments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and participate in your tournaments</p>
        </div>
        {currentUser && (
          <button
            onClick={handleCreateTournament}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            New Tournament
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="relative flex-grow">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['all', 'open', 'group_stage', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      {filteredTournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-slate-400">search_off</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">No tournaments found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            We couldn't find any tournaments matching your criteria. Try adjusting your filters or search term.
          </p>
          {statusFilter !== 'all' && (
            <button 
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="mt-6 text-primary font-semibold hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map(tournament => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onClick={() => navigate(`/tournaments/${tournament.id}`)}
              onJoin={(t) => console.log('Join clicked', t.id)} // Placeholder for join action
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentsPage;