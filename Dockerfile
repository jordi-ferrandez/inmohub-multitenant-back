FROM node:24-alpine AS builder
WORKDIR /app

# 1) Instala deps de npm
COPY package*.json ./
RUN npm ci

# 2) Copia tsconfig PARA tsc y prisma.schema para prisma generate
COPY tsconfig.json ./
COPY prisma/ ./prisma/
RUN npx prisma generate

# 3) Copia sólo el código fuente
COPY src/ ./src

# 4) Compila tu TS (usar tsconfig.json con baseUrl=src)
RUN npm run build

# --- stage final ---

FROM node:24-alpine
RUN apk add --no-cache postgresql-client bash
WORKDIR /app

# 5) Sólo traemos dist, node_modules y prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./dist/generated
COPY --from=builder /app/tsconfig.json ./
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["/entrypoint.sh"]


# FROM node:24-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# RUN apk add --no-cache curl netcat-openbsd

# # Copiar todo el contenido de prisma
# COPY ./prisma/ ./prisma/

# # Generar cliente Prisma
# RUN npx prisma generate

# # Copiar el resto de los archivos
# COPY . .

# RUN npm run build

# FROM node:24-alpine
# # Instalar dependencias necesarias
# RUN apk add --no-cache postgresql-client bash

# WORKDIR /app
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package.json ./
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/generated ./generated
# COPY --from=builder /app/tsconfig.json ./
# COPY entrypoint.sh /entrypoint.sh

# RUN chmod +x /entrypoint.sh
# EXPOSE 4000
# ENTRYPOINT ["/entrypoint.sh"]