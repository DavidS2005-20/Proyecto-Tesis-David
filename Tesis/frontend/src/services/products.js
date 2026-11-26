const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function postJson(path, body, fallbackMessage) {
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con la API. Verifica que el backend esté activo.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("La API devolvió una respuesta inválida.");
  }

  if (!response.ok) throw new Error(result.message || fallbackMessage);
  return result;
}

export async function saveProduct(product) {
  let response;

  try {
    response = await fetch(`${apiUrl}/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
  } catch {
    throw new Error("No se pudo conectar con la API. Verifica que el backend esté activo.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("La API devolvió una respuesta inválida.");
  }

  if (!response.ok) {
    throw new Error(result.message || "No se pudo guardar el producto.");
  }

  return result;
}

export async function receiveStock(id, cantidad, referencia) {
  return postJson(
    `/productos/${id}/entradas`,
    { cantidad, referencia },
    "No se pudo registrar la entrada de inventario.",
  );
}

export async function createSale(items) {
  return postJson("/ventas", { items }, "No se pudo confirmar la venta.");
}

export async function updateProduct(id, product) {
  let response;

  try {
    response = await fetch(`${apiUrl}/productos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
  } catch {
    throw new Error("No se pudo conectar con la API. Verifica que el backend esté activo.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("La API devolvió una respuesta inválida.");
  }

  if (!response.ok) {
    throw new Error(result.message || "No se pudo actualizar el producto.");
  }

  return result;
}

export async function searchProducts(query, signal) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const parameter = /^\d+$/.test(trimmed)
    ? `code=${encodeURIComponent(trimmed)}`
    : `name=${encodeURIComponent(trimmed)}`;

  let response;
  try {
    response = await fetch(`${apiUrl}/productos/search?${parameter}`, {
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") return null;
    throw new Error("No se pudo conectar con la API. Verifica que el backend esté activo.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("La API devolvió una respuesta inválida.");
  }

  if (!response.ok) {
    throw new Error(result.message || "No se pudo realizar la búsqueda.");
  }

  return result;
}
