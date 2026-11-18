import { useEffect, useRef, useState } from "react";
import { searchProducts } from "../services/products.js";

export default function ProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      abortRef.current?.abort();
      setResults([]);
      setError("");
      setLoading(false);
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError("");

      try {
        const found = await searchProducts(trimmed, controller.signal);
        if (found !== null) setResults(found);
      } catch (searchError) {
        if (searchError.name !== "AbortError") setError(searchError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function formatPrice(value) {
    return Number(value).toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
    });
  }

  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">
            Consulta rápida de productos
          </span>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>
            <input
              className="form-input pl-10"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre o código de barras"
              autoComplete="off"
              aria-label="Buscar producto por nombre o código"
              autoFocus
            />
          </div>
        </label>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
      </div>

      {query.trim() && (
        <div className="mt-4" aria-live="polite">
          {loading ? (
            <p className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
              Buscando productos...
            </p>
          ) : results.length === 0 && !error ? (
            <p className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
              No se encontraron productos.
            </p>
          ) : (
            <div className="grid gap-3">
              {results.map((product) => (
                <article
                  key={product.id}
                  className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto_auto]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Código {product.id}
                    </p>
                    <h3 className="mt-1 truncate text-lg font-bold text-slate-900">
                      {product.nombre}
                    </h3>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Precio</p>
                    <p className="mt-1 text-xl font-bold text-indigo-700">
                      {formatPrice(product.precio_venta)}
                    </p>
                  </div>
                  <div className="sm:min-w-24 sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stock</p>
                    <p className={`mt-1 text-xl font-bold ${product.stock > 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {product.stock} {Number(product.stock) === 1 ? "unidad" : "unidades"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
