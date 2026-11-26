import { useState } from "react";
import { receiveStock } from "../services/products.js";

export default function InventoryEntry() {
  const [form, setForm] = useState({ id: "", cantidad: "", referencia: "" });
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const result = await receiveStock(
        Number(form.id),
        Number(form.cantidad),
        form.referencia.trim() || undefined,
      );
      setNotice({
        type: "success",
        text: `${result.message} ${result.producto.nombre}: ${result.producto.stock} unidades disponibles.`,
      });
      setForm({ id: "", cantidad: "", referencia: "" });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Recepción de mercancía</h2>
        <p className="mt-1 text-sm text-slate-500">
          Registra cada entrada para actualizar el stock y conservar su trazabilidad.
        </p>
      </div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          ID del producto
          <input
            className="form-input mt-2"
            type="number"
            name="id"
            min="1"
            step="1"
            value={form.id}
            onChange={handleChange}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Cantidad recibida
          <input
            className="form-input mt-2"
            type="number"
            name="cantidad"
            min="1"
            step="1"
            value={form.cantidad}
            onChange={handleChange}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Proveedor o referencia <span className="font-normal text-slate-500">(opcional)</span>
          <input
            className="form-input mt-2"
            type="text"
            name="referencia"
            maxLength="200"
            value={form.referencia}
            onChange={handleChange}
            placeholder="Ej. Factura o nombre del proveedor"
          />
        </label>
        {notice && (
          <p
            className={`rounded-lg px-4 py-3 text-sm sm:col-span-2 ${
              notice.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}
        <button
          className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
          type="submit"
          disabled={saving}
        >
          {saving ? "Registrando..." : "Registrar entrada"}
        </button>
      </form>
    </section>
  );
}
