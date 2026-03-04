# ---------- Stage 1: Build del Frontend ----------
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Instalar dependencias
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copiar frontend
COPY frontend/ .

# Build con Vite
RUN npm run build


# ---------- Stage 2: Producción ----------
FROM node:18-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Instalar dependencias del backend
COPY Backend/package.json Backend/package-lock.json* ./Backend/
RUN cd Backend && npm install --omit=dev

# Copiar backend
COPY Backend ./Backend

# Copiar frontend compilado
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production

EXPOSE 3000

WORKDIR /app/Backend

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]