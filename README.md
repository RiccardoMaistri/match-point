# Tournament Manager Full-Stack App
ddd
Questa è una web application full-stack per la gestione di tornei sportivi, costruita con React per il frontend e
FastAPI (Python) per il backend. I dati vengono persistiti su file JSON.

## Funzionalità Principali

- **Gestione Tornei:**
    - Creazione di tornei specificando nome, tipologia (singolo/doppio), formato (eliminazione diretta/girone
      all'italiana).
    - Impostazione opzionale di data/fascia oraria.
    - Modifica ed eliminazione dei tornei.
- **Gestione Partecipanti:**
    - Aggiunta di partecipanti a un torneo (nome, email, ranking opzionale).
    - Visualizzazione e rimozione dei partecipanti.
    - Link di invito (placeholder, non implementata logica di join via link).
- **Generazione Bracket/Calendario:**
    - Generazione automatica (logica base) del tabellone per eliminazione diretta o del calendario per girone
      all'italiana.
- **Gestione Match e Risultati:**
    - Visualizzazione dei match generati.
    - Inserimento dei risultati dei match (punteggi, vincitore).
    - Aggiornamento automatico dello stato del match.
- **Persistenza Dati:**
    - Il backend legge e scrive i dati su file JSON (`tournaments.json`).
- **API Documentata:**
    - Documentazione API auto-generata da FastAPI (Swagger UI e ReDoc) disponibile agli endpoint `/docs` e `/redoc` del
      backend.

## Prerequisiti

- [Python](https://www.python.org/) (versione 3.8 o superiore raccomandata)
- [Node.js](https://nodejs.org/) (versione 16.x o LTS raccomandata)
- `pip` (Python package installer)
- `npm` (Node package manager, solitamente incluso con Node.js)

## Configurazione e Avvio

### Backend (FastAPI)

1. **Naviga nella directory del backend:**
   ```bash
   cd backend
   ```

2. **Crea un ambiente virtuale (raccomandato):**
   ```bash
   python -m venv venv
   ```

3. **Attiva l'ambiente virtuale:**
    - Su macOS e Linux:
      ```bash
      source venv/bin/activate
      ```
    - Su Windows:
      ```bash
      venv\Scripts\activate
      ```

4. **Installa le dipendenze Python:**
   ```bash
   pip install -r requirements.txt
   ```
   (Il file `requirements.txt` contiene `fastapi`, `uvicorn`, `pydantic`)

5. **Avvia il server di sviluppo FastAPI:**
   Tornando alla directory principale del progetto (la root, dove si trova questo README):
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Oppure, se sei già nella directory `backend/`:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   Il backend sarà accessibile su `http://localhost:8000`.
    - La documentazione Swagger UI sarà su `http://localhost:8000/docs`.
    - La documentazione ReDoc sarà su `http://localhost:8000/redoc`.

   I file JSON dei dati verranno creati/utilizzati nella sottodirectory `backend/jsondata/`.

### Frontend (React)

1. **Naviga nella directory del frontend (da un nuovo terminale o dopo aver disattivato l'ambiente virtuale Python se
   necessario):**
   ```bash
   cd frontend
   ```

2. **Installa le dipendenze Node.js:**
   ```bash
   npm install
   ```

3. **Avvia il server di sviluppo React:**
   ```bash
   npm start
   ```
   L'applicazione frontend sarà accessibile su `http://localhost:3000` (o un'altra porta se la 3000 è occupata). Il
   browser dovrebbe aprirsi automaticamente.

   Il frontend effettuerà chiamate API al backend (default `http://localhost:8000`). Se il backend è in esecuzione su
   una porta diversa, modifica `API_BASE_URL` in `frontend/src/services/api.js` o imposta la variabile d'ambiente
   `REACT_APP_API_URL`.

## Struttura del Progetto

```
.
├── backend/
│   ├── jsondata/             # File JSON per la persistenza dei dati
│   │   └── tournaments.json
│   ├── models.py             # Modelli Pydantic
│   ├── database.py           # Logica per la lettura/scrittura dei file JSON
│   ├── main.py               # Endpoint FastAPI e logica principale dell'applicazione
│   └── requirements.txt      # Dipendenze Python
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componenti React riutilizzabili
│   │   ├── services/         # Logica per le chiamate API (api.js)
│   │   ├── App.js            # Componente principale dell'applicazione React
│   │   ├── index.css         # Stili globali e direttive Tailwind
│   │   └── index.js          # Punto di ingresso dell'applicazione React
│   ├── package.json          # Metadati e dipendenze del progetto Node.js
│   ├── tailwind.config.js    # Configurazione di Tailwind CSS
│   └── postcss.config.js     # Configurazione di PostCSS (per Tailwind)
└── README.md                 # Questo file
```

## Note Aggiuntive

- **Persistenza Dati:** La persistenza su file JSON è una simulazione di un database. Per un'applicazione di produzione,
  si dovrebbe considerare un database relazionale o NoSQL più robusto.
- **Generazione Bracket/Calendario:** La logica attuale per la generazione di match è basilare. Librerie specializzate
  come `bracket-maker` o `round-robin-tournament` potrebbero essere integrate per funzionalità più avanzate (seeding,
  gestione bye complessa, ecc.).
- **Autenticazione/Autorizzazione:** Non implementate in questa versione.
- **Test:** Non sono stati scritti test automatici. Per un progetto reale, sarebbero fondamentali.

Grazie per aver utilizzato Tournament Manager!

https://stitch.withgoogle.com/projects/10234286867701351773?pli=1

