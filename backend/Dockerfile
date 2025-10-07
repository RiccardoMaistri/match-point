# Usa un'immagine Python ufficiale come immagine base
FROM python:3.9-slim

# Imposta la directory di lavoro nel container
WORKDIR /app

# Copia il file delle dipendenze nella directory di lavoro
COPY requirements.txt .

# Installa le dipendenze
RUN pip install --no-cache-dir -r requirements.txt

# Copia il resto del codice dell'applicazione
COPY . .

# Esponi la porta su cui FastAPI sarà in esecuzione
EXPOSE 8000

# Comando per avviare l'applicazione quando il container parte
# Uvicorn viene avviato per ascoltare su tutte le interfacce (0.0.0.0)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
