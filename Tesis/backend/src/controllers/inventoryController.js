import pool from "../config/db.js";

const MAX_STOCK = 2147483647;

function parseProductId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= MAX_STOCK ? id : null;
}

function parseQuantity(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_STOCK ? value : null;
}

async function adjustStock(req, res, next, direction, type) {
  const id = parseProductId(req.params.id);
  const cantidad = parseQuantity(req.body?.cantidad);
  const referencia = req.body?.referencia ?? null;

  if (id === null || cantidad === null) {
    return res.status(400).json({
      message: "Indica un ID de producto válido y una cantidad entera mayor que cero.",
    });
  }

  if (referencia !== null && (typeof referencia !== "string" || referencia.trim().length > 200)) {
    return res.status(400).json({ message: "La referencia debe ser texto de hasta 200 caracteres." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const productResult = await client.query(
      "SELECT id, stock FROM productos WHERE id = $1 FOR UPDATE",
      [id],
    );

    if (productResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "No existe un producto con ese ID." });
    }

    const stockActual = productResult.rows[0].stock;
    if (direction < 0 && cantidad > stockActual) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: `Stock insuficiente. Disponible: ${stockActual}; solicitado: ${cantidad}.`,
        stockDisponible: stockActual,
      });
    }
    if (direction > 0 && stockActual + cantidad > MAX_STOCK) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "La cantidad supera el límite de stock permitido." });
    }

    const updated = await client.query(
      `UPDATE productos
       SET stock = stock ${direction > 0 ? "+" : "-"} $2
       WHERE id = $1
       RETURNING id, nombre, stock`,
      [id, cantidad],
    );
    await client.query(
      `INSERT INTO inventario_movimientos
         (producto_id, tipo, cantidad, stock_anterior, stock_posterior, referencia)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        type,
        cantidad,
        stockActual,
        updated.rows[0].stock,
        typeof referencia === "string" ? referencia.trim() || null : null,
      ],
    );
    await client.query("COMMIT");

    return res.json({
      message: type === "ENTRADA" ? "Entrada de inventario registrada." : "Salida de inventario registrada.",
      producto: updated.rows[0],
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("No se pudo revertir el movimiento de inventario:", rollbackError);
    }
    return next(error);
  } finally {
    client?.release();
  }
}

export function receiveStock(req, res, next) {
  return adjustStock(req, res, next, 1, "ENTRADA");
}

export function removeStock(req, res, next) {
  return adjustStock(req, res, next, -1, "SALIDA");
}
