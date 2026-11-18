# Inventario de productos

La aplicación tiene un frontend React/Vite, una API Express y una base de datos PostgreSQL. El archivo `inventario_precios.sql` crea la tabla `productos` y un trigger que calcula `precio_venta = precio / 0.7` antes de cada inserción o actualización.

## Requisitos

- Node.js 18 o superior y npm
- PostgreSQL

## Preparar la base de datos

1. Crea una base de datos, por ejemplo `papeleria`.
2. Ejecuta el contenido de `inventario_precios.sql` en esa base. Puedes usar `psql -d papeleria -f inventario_precios.sql` desde la carpeta `Tesis`.

## Iniciar el backend

Desde `Tesis/backend`, instala dependencias con `npm install`. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` con el usuario, contraseña, host y nombre de tu base de datos PostgreSQL. Luego ejecuta `npm run dev`.

La API estará disponible en `http://localhost:3000`. Los endpoints son:

- `POST /api/productos`: crea un producto o actualiza solo el precio base cuando el ID ya existe.
- `PUT /api/productos/:id`: actualiza un producto existente.
- `GET /api/productos/search?name=texto`: busca coincidencias parciales por nombre.
- `GET /api/productos/search?code=1001`: busca un producto por código exacto.

Los endpoints de escritura reciben JSON con `id`, `nombre`, `precio` y `stock`. La base calcula el precio de venta.

## Iniciar el frontend

Desde `Tesis/frontend`, ejecuta `npm install` y `npm run dev`. Abre la dirección que indique Vite (por defecto `http://localhost:5173`). Si la API está en otra dirección, copia `.env.example` a `.env` y ajusta `VITE_API_URL`.
