# STAGE 1: Build dell'applicazione React
FROM node:16-alpine as build

# Imposta la directory di lavoro
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto del codice sorgente
COPY . .

# Crea la build di produzione
# Disabilita ESLint per evitare errori con 'self' nel service worker
RUN DISABLE_ESLINT_PLUGIN=true npm run build

# STAGE 2: Servi l'applicazione con Nginx
FROM nginx:1.21-alpine

# Copia i file di build dalla fase precedente nella directory di Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Rimuovi la configurazione di default di Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia una nuova configurazione per gestire il routing di React
COPY nginx.conf /etc/nginx/conf.d

# Esponi la porta 80
EXPOSE 80

# Comando per avviare Nginx
CMD ["nginx", "-g", "daemon off;"]
