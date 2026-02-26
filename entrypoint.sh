#!/bin/sh
set -e

echo "[1/2] - Variables de entorno:"
echo "DB_HOST: $DB_HOST"
echo "DB_USER: $DB_USER"
echo "DB_NAME: $DB_NAME"
echo "DB_PASSWORD: [protegido]"
# Obtener el nombre del servicio de DB basado en NODE_ENV
if [ "$NODE_ENV" = "local" ]; then
    echo "Entorno local detectado. Usando variables de entorno proporcionadas."
    # No sobrescribir variables, usar las del docker-compose
elif [ "$NODE_ENV" = "development" ]; then
    DB_HOST="db-develop"
    DB_NAME="inmohub_develop"  # Nombre exacto para desarrollo
elif [ "$NODE_ENV" = "staging" ]; then
    DB_HOST="db-staging"
    DB_NAME="inmohub_staging"  # Nombre exacto para staging
elif [ "$NODE_ENV" = "production" ]; then
    DB_HOST="db-production"
    DB_NAME="inmohub_production"  # Nombre exacto para producción
else
    echo "Entorno no válido: $NODE_ENV"
    exit 1
fi

echo "[2/2] - Variables de entorno:"
echo "DB_HOST: $DB_HOST"
echo "DB_USER: $DB_USER"
echo "DB_NAME: $DB_NAME"
echo "DB_PASSWORD: [protegido]"

# Esperar a que PostgreSQL esté lista
echo "Esperando a PostgreSQL en $DB_HOST..."
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  echo "PostgreSQL no disponible, esperando..."
  sleep 2
done


echo "PostgreSQL disponible, continuando..."

# Migraciones
echo "Aplicando migraciones..."
npx prisma migrate deploy

# Seeding solo para desarrollo
#if [ "$NODE_ENV" = "development" ]; then
#  echo "Ejecutando seeding..."
#  npx prisma db seed
#fi


# Iniciar aplicación
echo "Iniciando aplicación..."
# exec node dist/server.js
exec npm start
