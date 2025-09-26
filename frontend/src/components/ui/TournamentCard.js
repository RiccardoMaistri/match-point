import React from 'react';
import { useNavigate } from 'react-router-dom';

const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate();
  
  // Funzione per generare un'immagine casuale per il torneo
  const getRandomImage = (tournamentName) => {
    const sportTypes = {
      'tennis': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXp7ZWAnsH1UFi_ldJtYr7C2iJGk-QD-NMmaWCOZkXGDPXBl17GxXGecAMPkhF0_W7damSIo9rR7lVjp1XPISKWymv3ZeghjtdyAVLgKLIkNbo8_Z6G1-FaKcemWpgFJp1xVW5TRVwQkaSGspjFmPGiUqHzJRpvqJJv1QHwvNHRJ8OQuuRVzyN918ASmOH4p4TJm5q28_GsEgc0j1ztMXTluPPTrJFYCGbJ4d44Yo3I903_4bVXaT4S1PO6LflWNDlMbh-swXyEOg',
      'basketball': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbmGcXMLksEjQJpnZRxe3HwP7LzR5Xi0EjIDOkTA4Koiqr0c_48WCUBt5XaP5i37D4eYwIyIAx_06GuIH8suDaKmQgqXTyWSUWKH0zfcTSJW6ntbmK8MUTaRCiJ-thgJcFa0VNkNl3cgobIvGzsphm9fZL2RaQFLVLrl5oyC42AuI8m1uBx4oNkEJmAb8kNl_ulzoSS93Yz3mzTFX_7Cck35zNFlnQt_Z26b71SSXZndY9ShGYQVz8X0l2BaXflGBSvgSBqj9woNA',
      'soccer': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD42kZi3439zCnncOGVvOpJxSLLbjlYMi3ejQGJNnnYxYWM7sQwVxgBh3aVTP2pzBtT-o75Yw9TvTZnhwVSca68YkAx_aRr3d5P9fJ5oPGbZJa4BMBveNNWLaQ1aHM8fRczgCIOsYT1RHB4dq2_9FPcjMCpiAObfFbAV-qPqTOxfgXU7c2ThuRqhy6fZ_f7QuHhtNtfxr4SL0gmzHTYmyWPo6iTkW5w2AGBqTbbnrVpuBVRKVcQDLID4-ep4pip01KwrG23dPQkUhc',
      'volleyball': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXkhsySS7AP_wre52EjsoeJM0JKQGm3KbWf9fKR0sWBmgpxHeCFVOlMr0MsnSvPj4jFULGAoFWI3iWAnab-8wpjCFImQdhbFARg_ChaUDdXBEZNkrQKqdkXGQ7IIuqzT2knNcsctIMLEkj8M5n-G25GAMDNeHRh8uVMZdzbTP2RA4zCSWTg2LYHwSFiU8zYw8YfA0ADmA8HtnBj9NWPBISrqmuYfX_MEhQJCPdAHV4O21-pF7jKEWBy1US5H-47mu5_vyG-v3PBZ8',
      'baseball': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMwDYpbwHmC4NaQvG0YGEBuySNz_u-Cxwv6fORGOfv3j8dEGB0W9rRZqWJh7bv22SuoBkK_P96IvV-TqNIc6nO5ZP7L0Zsl-rLBlA-OPn1Xnzqe5iBx5nFFoaQ8EiokrCK_OVH5qNd7z2WoxSXeyMKaBa11AP8H_w-OCWPvy6PSfJZ1j0ykEEn36nEfOy3Ck3G7ENFXiI1UcDaX0dLsPzt5VokOUnkTrYXtm21oO6kKPpHsFkGJPYSXaFVaI760f9WTfYdMtJD69s'
    };
    
    // Determina il tipo di sport dal nome del torneo o usa un'immagine predefinita
    const name = tournamentName.toLowerCase();
    for (const [sport, url] of Object.entries(sportTypes)) {
      if (name.includes(sport)) {
        return url;
      }
    }
    
    // Immagine predefinita se non viene trovato un match
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXZlCc7tBSle2En-BppAMuMEZ4QHttpDwMoM8dYBOrat4SlhH3cttoWJ5PxVVjMITsmYpq8UlR78mdKAl-nowPwQedYxBUlYJ4uv9yoADgR9X26kba3jX48I6rI_G-VfMTkhj4Ins8dEEmZOCIduRGrCnf3vR3nYCQifTgrktN-qQ8WItLtGGuGVpLEEejZ0agwmHoJtKhHhAGW-tzvjCicPfpE2-z4FqL3o6Ynbk1o73j921rfzk_O2TnU8fYw7_qFvovZejZALo';
  };
  
  // Funzione per formattare il tipo di torneo
  const formatTournamentType = (type, format) => {
    const typeMap = {
      'single': 'Single',
      'double': 'Double'
    };
    
    const formatMap = {
      'elimination': 'Elimination',
      'round_robin': 'Round Robin'
    };
    
    return `${typeMap[type] || type} | ${formatMap[format] || format}`;
  };
  
  const handleViewClick = () => {
    navigate(`/tournaments/${tournament.id}`);
  };
  
  return (
    <div className="flex items-center gap-4 bg-gray-900 px-4 min-h-[72px] py-2 justify-between">
      <div className="flex items-center gap-4">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14"
          style={{
            backgroundImage: `url("${getRandomImage(tournament.name)}")`
          }}
        ></div>
        <div className="flex flex-col justify-center">
          <p className="text-white text-base font-medium leading-normal line-clamp-1">
            {tournament.name}
          </p>
          <p className="text-gray-400 text-sm font-normal leading-normal line-clamp-2">
            {formatTournamentType(tournament.tournament_type, tournament.format)}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <button
          onClick={handleViewClick}
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-gray-700 text-white text-sm font-medium leading-normal w-fit hover:bg-gray-600"
        >
          <span className="truncate">View</span>
        </button>
      </div>
    </div>
  );
};

export default TournamentCard;