import { useState } from "react";
import { createSale, searchProducts } from "../services/products.js";

export default function SalesCart() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selling, setSelling] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  function formatPrice(value) {
    return Number(value).toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
    });
  }

  async function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setHasSearched(true);
    setResults([]);
    setNotice(null);
    try {
      const found = await searchProducts(trimmed);
      setResults(found);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product) {
    if (Number(product.stock) < 1) {
      setNotice({ type: "error", text: `${product.nombre} no tiene unidades disponibles.` });
      return;
    }
    const existing = cart.find((item) => item.id === product.id);
    if (existing && Number(existing.cantidad) >= Number(product.stock)) {
      setNotice({ type: "error", text: `No hay más unidades disponibles de ${product.nombre}.` });
      return;
    }
    if (existing) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, cantidad: Number(item.cantidad) + 1 } : item,
      ));
    } else {
      setCart([...cart, { ...product, cantidad: 1 }]);
    }
    setNotice(null);
  }

  function updateQuantity(id, value) {
    setCart((current) => current.map((item) => (
      item.id === id ? { ...item, cantidad: value } : item
    )));
    setNotice(null);
  }

  function removeProduct(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  async function handleSale() {
    setSelling(true);
    setNotice(null);
    try {
      const result = await createSale(
        cart.map(({ id, cantidad }) => ({ producto_id: id, cantidad: Number(cantidad) })),
      );
      setCart([]);
      setNotice({
        type: "success",
        text: `Venta #${result.venta.id} confirmada por ${formatPrice(result.venta.total)}.`,
      });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setSelling(false);
    }
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.precio_venta) * (Number(item.cantidad) || 0),
    0,
  );
  const cartIsValid = cart.length > 0 && cart.every((item) => (
    Number.isInteger(Number(item.cantidad)) &&
    Number(item.cantidad) > 0 &&
    Number(item.cantidad) <= Number(item.stock)
  ));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Venta</h2>
        <p className="mt-1 text-sm text-slate-500">
          Agrega productos al carrito y confirma para descontar el stock de forma segura.
        </p>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
        <input
          className="form-input"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHasSearched(false);
            setResults([]);
          }}
          placeholder="Buscar por nombre o código"
          aria-label="Buscar producto para la venta"
        />
        <button
          className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          type="submit"
          disabled={searching || !query.trim()}
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-4 grid gap-2">
          {results.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{product.nombre}</p>
                <p className="text-sm text-slate-500">
                  ID {product.id} · {formatPrice(product.precio_venta)} · Stock: {product.stock}
                </p>
              </div>
              <button
                className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                type="button"
                onClick={() => addProduct(product)}
                disabled={Number(product.stock) < 1}
              >
                Agregar
              </button>
            </div>
          ))}
        </div>
      )}
      {hasSearched && query.trim() && !searching && results.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No se encontraron productos.</p>
      )}

      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="font-semibold text-slate-900">Carrito ({cart.length})</h3>
        {cart.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aún no hay productos en la venta.</p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-slate-100">
              {cart.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-40 flex-1">
                    <p className="font-medium text-slate-900">{item.nombre}</p>
                    <p className="text-sm text-slate-500">{formatPrice(item.precio_venta)} c/u</p>
                  </div>
                  <label className="text-sm text-slate-600">
                    Cantidad
                    <input
                      className="form-input ml-2 w-20"
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.cantidad}
                      onChange={(event) => updateQuantity(item.id, event.target.value)}
                      aria-label={`Cantidad de ${item.nombre}`}
                    />
                  </label>
                  <button
                    className="text-sm font-medium text-red-700 hover:text-red-900"
                    type="button"
                    onClick={() => removeProduct(item.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg font-bold text-slate-900">Total: {formatPrice(total)}</p>
              <button
                className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleSale}
                disabled={selling || !cartIsValid}
              >
                {selling ? "Confirmando..." : "Confirmar venta"}
              </button>
            </div>
          </>
        )}
      </div>

      {notice && (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            notice.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}
    </section>
  );
}
