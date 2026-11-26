# Inventario de productos

La aplicación tiene un frontend React/Vite, una API Express y una base de datos PostgreSQL. El archivo `inventario_precios.sql` crea el catálogo, registra entradas y salidas, y define ventas con sus detalles. Las actualizaciones de stock se ejecutan dentro de transacciones y quedan asociadas a movimientos.

## Requisitos

- Node.js 18 o superior y npm
- PostgreSQL

## Preparar la base de datos

1. Crea una base de datos, por ejemplo `papeleria`.
2. Ejecuta el contenido de `inventario_precios.sql` en esa base. Puedes usar `psql -d papeleria -f inventario_precios.sql` desde la carpeta `Tesis`. El script es repetible e incluye una entrada inicial para el stock de productos preexistentes.

## Iniciar el backend

Desde `Tesis/backend`, instala dependencias con `npm install`. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` con el usuario, contraseña, host y nombre de tu base de datos PostgreSQL. Luego ejecuta `npm run dev`.

La API estará disponible en `http://localhost:3000`. Los endpoints son:

- `POST /api/productos`: crea un producto o actualiza solo el precio base cuando el ID ya existe.
- `PUT /api/productos/:id`: actualiza el nombre y precio base; el stock solo cambia mediante un movimiento.
- `GET /api/productos/search?name=texto`: busca coincidencias parciales por nombre.
- `GET /api/productos/search?code=1001`: busca un producto por código exacto.
- `POST /api/productos/:id/entradas`: recibe `{ "cantidad": 12, "referencia": "Factura proveedor" }`.
- `POST /api/productos/:id/salidas`: registra una salida manual con `{ "cantidad": 2 }`.
- `POST /api/ventas`: confirma una venta; recibe `{ "items": [{ "producto_id": 1001, "cantidad": 2 }] }`. La respuesta incluye el total de la venta y el stock actualizado de cada producto.

Las cantidades de movimientos deben ser enteros mayores que cero. Una venta se rechaza si falta algún producto o no hay stock suficiente; sus detalles, salidas y actualizaciones de stock se confirman juntos o se revierten juntos. Al crear un producto, el stock inicial positivo también se registra como entrada. El precio de venta se calcula en la base (`precio / 0.7`).

## Iniciar el frontend

Desde `Tesis/frontend`, ejecuta `npm install` y `npm run dev`. Abre la dirección que indique Vite (por defecto `http://localhost:5173`). Si la API está en otra dirección, copia `.env.example` a `.env` y ajusta `VITE_API_URL`.
