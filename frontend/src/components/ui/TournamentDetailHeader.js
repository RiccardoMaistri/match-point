import React from 'react';

const TournamentDetailHeader = ({ tournament }) => {
  // Funzione per generare un'immagine di sfondo per il torneo
  const getBackgroundImage = (tournamentName) => {
    const sportTypes = {
      'tennis': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXp7ZWAnsH1UFi_ldJtYr7C2iJGk-QD-NMmaWCOZkXGDPXBl17GxXGecAMPkhF0_W7damSIo9rR7lVjp1XPISKWymv3ZeghjtdyAVLgKLIkNbo8_Z6G1-FaKcemWpgFJp1xVW5TRVwQkaSGspjFmPGiUqHzJRpvqJJv1QHwvNHRJ8OQuuRVzyN918ASmOH4p4TJm5q28_GsEgc0j1ztMXTluPPTrJFYCGbJ4d44Yo3I903_4bVXaT4S1PO6LflWNDlMbh-swXyEOg',
      'basketball': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXZlCc7tBSle2En-BppAMuMEZ4QHttpDwMoM8dYBOrat4SlhH3cttoWJ5PxVVjMITsmYpq8UlR78mdKAl-nowPwQedYxBUlYJ4uv9yoADgR9X26kba3jX48I6rI_G-VfMTkhj4Ins8dEEmZOCIduRGrCnf3vR3nYCQifTgrktN-qQ8WItLtGGuGVpLEEejZ0agwmHoJtKhHhAGW-tzvjCicPfpE2-z4FqL3o6Ynbk1o73j921rfzk_O2TnU8fYw7_qFvovZejZALo',
      'soccer': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD42kZi3439zCnncOGVvOpJxSLLbjlYMi3ejQGJNnnYxYWM7sQwVxgBh3aVTP2pzBtT-o75Yw9TvTZnhwVSca68YkAx_aRr3d5P9fJ5oPGbZJa4BMBveNNWLaQ1aHM8fRczgCIOsYT1RHB4dq2_9FPcjMCpiAObfFbAV-qPqTOxfgXU7c2ThuRqhy6fZ_f7QuHhtNtfxr4SL0gmzHTYmyWPo6iTkW5w2AGBqTbbnrVpuBVRKVcQDLID4-ep4pip01KwrG23dPQkUhc',
      'volleyball': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXkhsySS7AP_wre52EjsoeJM0JKQGm3KbWf9fKR0sWBmgpxHeCFVOlMr0MsnSvPj4jFULGAoFWI3iWAnab-8wpjCFImQdhbFARg_ChaUDdXBEZNkrQKqdkXGQ7IIuqzT2knNcsctIMLEkj8M5n-G25GAMDNeHRh8uVMZdzbTP2RA4zCSWTg2LYHwSFiU8zYw8YfA0ADmA8HtnBj9NWPBISrqmuYfX_MEhQJCPdAHV4O21-pF7jKEWBy1US5H-47mu5_vyG-v3PBZ8'
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

  return (
    <div className="container">
      <div className="md:px-4 md:py-3">
        <div
          className="bg-cover bg-center flex flex-col justify-end overflow-hidden bg-gray-900 md:rounded-xl min-h-[218px]"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), url("${getBackgroundImage(tournament.name)}")`
          }}
        >
          <div className="flex p-4">
            <p className="text-white tracking-light text-[28px] font-bold leading-tight">
              {tournament.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailHeader;