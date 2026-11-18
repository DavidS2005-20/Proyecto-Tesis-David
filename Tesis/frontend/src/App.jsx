import ProductForm from "./components/ProductForm.jsx";
import ProductSearch from "./components/ProductSearch.jsx";

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Papelería · Inventario
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Registro de productos
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Guarda los productos y calcula automáticamente el precio de venta a
            partir del costo base.
          </p>
        </header>
        <ProductSearch />
        <ProductForm />
      </div>
    </main>
  );
}