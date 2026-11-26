import { useState } from "react";
import { saveProduct } from "../services/products.js";

const initialForm = { id: "", nombre: "", precio: "", stock: "0" };

export default function ProductForm() {
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  const precioVenta = Number(form.precio) > 0 ? Number(form.precio) / 0.7 : null;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);
    setSaving(true);

    try {
      const result = await saveProduct({
        id: Number(form.id),
        nombre: form.nombre.trim(),
        precio: Number(form.precio),
        stock: Number(form.stock),
      });
      setNotice({ type: "success", text: result.message });
      setForm(initialForm);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-7">
        <h2 className="text-xl font-semibold text-slate-900">Datos del producto</h2>
        <p className="mt-1 text-sm text-slate-500">
          Si el ID ya existe, se actualizan el nombre y el precio base; el stock solo se define al crear el producto.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            ID del producto
            <input
              className="form-input mt-2"
              type="number"
              name="id"
              min="1"
              step="1"
              value={form.id}
              onChange={handleChange}
              placeholder="Ej. 1001"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Nombre
            <input
              className="form-input mt-2"
              type="text"
              name="nombre"
              maxLength="200"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej. Cuaderno universitario"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Precio base
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                $
              </span>
              <input
                className="form-input pl-8"
                type="number"
                name="precio"
                min="0.01"
                step="0.01"
                value={form.precio}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Stock inicial (solo al crear)
            <input
              className="form-input mt-2"
              type="number"
              name="stock"
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              placeholder="0"
              required
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Para productos existentes, registra cambios desde Recepción de mercancía.
            </span>
          </label>
        </div>

        <div className="rounded-xl bg-indigo-50 px-4 py-4 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-900">Precio de venta estimado</p>
            <p className="mt-1 text-xs text-indigo-700">
              Precio base ÷ 0.7 (margen esperado)
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-700 sm:mt-0">
            {precioVenta === null
              ? "$0.00"
              : `$${precioVenta.toLocaleString("es-EC", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </p>
        </div>

        {notice && (
          <p
            className={`rounded-lg px-4 py-3 text-sm ${
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}

        <button
          className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          type="submit"
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar producto"}
        </button>
      </form>
    </section>
  );
}
