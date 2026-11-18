import "dotenv/config";
import cors from "cors";
import express from "express";
import pool from "./config/db.js";
import productsRoutes from "./routes/productsRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "10kb" }));

app.use("/api/productos", productsRoutes);
app.use("/api/products", productsRoutes);

app.use((error, _req, res, _next) => {
  console.error("Error en la API:", error);

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "El cuerpo de la solicitud debe ser JSON válido." });
  }

  if (error.status === 413) {
    return res.status(413).json({ message: "El cuerpo de la solicitud es demasiado grande." });
  }

  if (error.code === "23505") {
    return res.status(409).json({ message: "Ya existe un producto con ese ID." });
  }

  if (error.code === "23514" || error.code === "22P02") {
    return res.status(400).json({ message: "Los datos del producto no son válidos." });
  }

  return res.status(500).json({ message: "Ocurrió un error al procesar la solicitud." });
});

try {
  await pool.query("SELECT 1");
  app.listen(port, () => {
    console.log(`API lista en http://localhost:${port}`);
  });
} catch (error) {
  console.error("No se pudo conectar con PostgreSQL:", error);
  process.exitCode = 1;
}