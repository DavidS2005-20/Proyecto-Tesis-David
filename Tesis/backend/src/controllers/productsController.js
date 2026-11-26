import pool from "../config/db.js";

const isValidProduct = ({ id, nombre, precio, stock }) =>
  Number.isInteger(Number(id)) &&
  Number(id) > 0 &&
  Number(id) <= 2147483647 &&
  typeof nombre === "string" &&
  nombre.trim().length > 0 &&
  nombre.trim().length <= 200 &&
  Number.isFinite(Number(precio)) &&
  Number(precio) > 0 &&
  Number(precio) <= 9999999999.99 &&
  Number.isInteger(Number(stock)) &&
  Number(stock) >= 0 &&
  Number(stock) <= 2147483647;

export async function saveProduct(req, res, next) {
  const { id, nombre, precio, stock } = req.body ?? {};

  if (!isValidProduct({ id, nombre, precio, stock })) {
    return res.status(400).json({
      message: "Ingresa un ID válido, un nombre, un precio base mayor que cero y un stock válido.",
    });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO productos (id, nombre, precio, precio_venta, stock)
       VALUES ($1, $2, $3, 0, $4)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, nombre, precio, precio_venta, stock`,
      [Number(id), nombre.trim(), Number(precio), Number(stock)],
    );

    let result = inserted;
    if (inserted.rowCount > 0) {
      if (Number(stock) > 0) {
        await client.query(
          `INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, stock_anterior, stock_posterior, referencia)
           VALUES ($1, 'ENTRADA', $2, 0, $2, 'Inventario inicial')`,
          [Number(id), Number(stock)],
        );
      }
    } else {
      result = await client.query(
        `UPDATE productos
         SET nombre = $1, precio = $2
         WHERE id = $3
         RETURNING id, nombre, precio, precio_venta, stock`,
        [nombre.trim(), Number(precio), Number(id)],
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: inserted.rowCount > 0
        ? "Producto guardado correctamente."
        : "Producto actualizado correctamente. El stock se modifica desde los movimientos de inventario.",
      producto: result.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("No se pudo revertir el registro del producto:", rollbackError);
      }
    }
    return next(error);
  } finally {
    client?.release();
  }
}

export async function updateProduct(req, res, next) {
  const id = Number(req.params.id);
  const { nombre, precio } = req.body ?? {};

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    id > 2147483647 ||
    !isValidProduct({ id, nombre, precio, stock: 0 })
  ) {
    return res.status(400).json({
      message: "Ingresa un ID válido, un nombre y un precio base mayor que cero.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE productos
       SET nombre = $1, precio = $2
       WHERE id = $3
       RETURNING id, nombre, precio, precio_venta, stock`,
      [nombre.trim(), Number(precio), id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No existe un producto con ese ID." });
    }

    return res.json({
      message: "Producto actualizado correctamente.",
      producto: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

export async function searchProducts(req, res, next) {
  const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
  const codeParam = typeof req.query.code === "string" ? req.query.code.trim() : "";

  if (!name && !codeParam) {
    return res.status(400).json({
      message: "Debes indicar al menos el nombre o el código del producto.",
    });
  }

  if (name.length > 200) {
    return res.status(400).json({
      message: "El nombre no puede superar los 200 caracteres.",
    });
  }

  if (codeParam) {
    if (!/^\d+$/.test(codeParam)) {
      return res.status(400).json({
        message: "El código debe contener solo números.",
      });
    }

    const code = Number(codeParam);
    if (!Number.isSafeInteger(code) || code <= 0 || code > 2147483647) {
      return res.status(400).json({
        message: "El código no corresponde a un ID válido.",
      });
    }
  }

  try {
    let result;

    if (codeParam) {
      result = await pool.query(
        `SELECT id, nombre, precio, precio_venta, stock
         FROM productos
         WHERE id = $1
         LIMIT 1`,
        [Number(codeParam)],
      );
    } else {
      result = await pool.query(
        `SELECT id, nombre, precio, precio_venta, stock
         FROM productos
         WHERE nombre ILIKE $1
         ORDER BY
           CASE WHEN LOWER(nombre) = LOWER($2) THEN 0 ELSE 1 END,
           nombre ASC
         LIMIT 50`,
        [`%${name}%`, name],
      );
    }

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
}
