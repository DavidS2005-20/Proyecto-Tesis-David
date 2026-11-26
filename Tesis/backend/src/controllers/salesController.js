import pool from "../config/db.js";

const MAX_STOCK = 2147483647;

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) return null;

  const quantities = new Map();
  for (const item of items) {
    const id = item?.producto_id;
    const cantidad = item?.cantidad;
    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      id > MAX_STOCK ||
      !Number.isInteger(cantidad) ||
      cantidad <= 0 ||
      cantidad > MAX_STOCK
    ) {
      return null;
    }
    const total = (quantities.get(id) || 0) + cantidad;
    if (total > MAX_STOCK) return null;
    quantities.set(id, total);
  }

  return [...quantities.entries()].map(([id, cantidad]) => ({ id, cantidad }));
}

export async function createSale(req, res, next) {
  const items = normalizeItems(req.body?.items);
  if (!items) {
    return res.status(400).json({
      message: "La venta debe incluir entre 1 y 100 productos con IDs y cantidades enteras mayores que cero.",
    });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const ids = items.map(({ id }) => id);
    const productsResult = await client.query(
      `SELECT id, nombre, precio_venta, stock
       FROM productos
       WHERE id = ANY($1::integer[])
       ORDER BY id
       FOR UPDATE`,
      [ids],
    );
    const products = new Map(productsResult.rows.map((product) => [product.id, product]));
    const missing = items.find(({ id }) => !products.has(id));
    if (missing) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: `No existe un producto con ID ${missing.id}.` });
    }

    for (const item of items) {
      const product = products.get(item.id);
      if (item.cantidad > product.stock) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}; solicitado: ${item.cantidad}.`,
          productoId: product.id,
          stockDisponible: product.stock,
        });
      }
    }

    const saleResult = await client.query(
      "INSERT INTO ventas (total) VALUES (0) RETURNING id",
    );
    const ventaId = saleResult.rows[0].id;
    const stockActualizado = [];

    for (const item of items) {
      const product = products.get(item.id);
      const stockNuevo = product.stock - item.cantidad;
      await client.query(
        `INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [ventaId, item.id, item.cantidad, product.precio_venta],
      );
      await client.query(
        `UPDATE productos
         SET stock = $2
         WHERE id = $1`,
        [item.id, stockNuevo],
      );
      await client.query(
        `INSERT INTO inventario_movimientos
           (producto_id, tipo, cantidad, stock_anterior, stock_posterior, venta_id)
         VALUES ($1, 'SALIDA', $2, $3, $4, $5)`,
        [item.id, item.cantidad, product.stock, stockNuevo, ventaId],
      );
      stockActualizado.push({
        id: product.id,
        nombre: product.nombre,
        stock: stockNuevo,
      });
    }

    const totalResult = await client.query(
      `UPDATE ventas
       SET total = (
         SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
         FROM venta_detalles
         WHERE venta_id = $1
       )
       WHERE id = $1
       RETURNING id, total, creada_en`,
      [ventaId],
    );
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Venta confirmada y stock actualizado correctamente.",
      venta: totalResult.rows[0],
      productos: stockActualizado,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("No se pudo revertir la venta:", rollbackError);
    }
    return next(error);
  } finally {
    client?.release();
  }
}
