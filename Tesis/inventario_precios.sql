--Crea la tabla en PostgreSQL
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY CHECK (id > 0),
    nombre TEXT NOT NULL CHECK (TRIM(nombre) <> ''),
    precio NUMERIC(12, 2) NOT NULL CHECK (precio > 0),
    precio_venta NUMERIC(12, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

ALTER TABLE productos
DROP CONSTRAINT IF EXISTS productos_stock_check;

ALTER TABLE productos
ADD CONSTRAINT productos_stock_check CHECK (stock >= 0);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
ON productos USING GIN (nombre gin_trgm_ops);

--Función para calcular automáticamente el precio de venta (precio / 0.7)
CREATE OR REPLACE FUNCTION calcular_precio_venta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.precio_venta := ROUND(NEW.precio / 0.7, 2);
    RETURN NEW;
END;
$$;

-- 3. Trigger al insertar o actualizar un producto
DROP TRIGGER IF EXISTS trg_productos_precio_venta ON productos;

CREATE TRIGGER trg_productos_precio_venta
BEFORE INSERT OR UPDATE ON productos
FOR EACH ROW
EXECUTE FUNCTION calcular_precio_venta();