PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Crear la tabla 'productos' solo si no existe
CREATE TABLE IF NOT EXISTS productos (
	id INTEGER PRIMARY KEY,
	nombre TEXT NOT NULL,
	precio REAL NOT NULL,
	precio_venta REAL
);

-- Trigger: calcular precio_venta al insertar
CREATE TRIGGER IF NOT EXISTS trg_productos_insert
AFTER INSERT ON productos
BEGIN
	UPDATE productos SET precio_venta = NEW.precio / 0.7 WHERE id = NEW.id;
END;

-- Trigger: recalcular precio_venta al actualizar el precio
CREATE TRIGGER IF NOT EXISTS trg_productos_update
AFTER UPDATE OF precio ON productos
BEGIN
	UPDATE productos SET precio_venta = NEW.precio / 0.7 WHERE id = NEW.id;
END;

COMMIT;
