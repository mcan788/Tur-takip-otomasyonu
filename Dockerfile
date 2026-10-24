FROM node:22-bookworm-slim

# Install Python 3 and pip for Rent A Car (Flask/Waitress) backend
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Python dependencies for Rent A Car
COPY rent_a_car/requirements.txt ./rent_a_car/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r rent_a_car/requirements.txt

# 2. Install Node.js server dependencies for Tur Takip & Unified Gateway
COPY tur_takip_otomasyonu/server/package*.json ./tur_takip_otomasyonu/server/
RUN cd tur_takip_otomasyonu/server && npm install --omit=optional

# 3. Install & build React client
COPY tur_takip_otomasyonu/client/package*.json ./tur_takip_otomasyonu/client/
RUN cd tur_takip_otomasyonu/client && npm install

# 4. Copy full project source
COPY . .

# 5. Build Vite React SPA into tur_takip_otomasyonu/dist
RUN cd tur_takip_otomasyonu/client && npm run build

ENV NODE_ENV=production
ENV PORT=10000
ENV PYTHON_PORT=8080
ENV USE_MSSQL=false
ENV JWT_SECRET=zyronova_jwt_secret_key_7a9d8c6b2e1f4a
ENV ENCRYPTION_KEY=9u3g8htIZALnQwM61s_LvKkYkYN-1YdlCaMgksKxiUQ=

EXPOSE 10000

CMD ["node", "tur_takip_otomasyonu/server/index.js"]
