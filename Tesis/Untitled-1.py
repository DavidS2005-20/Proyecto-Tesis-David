import sqlite3


# ==========================================
# FASE 1: CONEXIÓN Y CREACIÓN DE BASE DE DATOS
# ==========================================
def iniciar_base_datos():
    """Crea la base de datos y la tabla si no existen."""
    conexion = sqlite3.connect("inventario_precios.db")
    cursor = conexion.cursor()
    # Creamos la tabla con ID, Nombre y Precio
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            precio REAL NOT NULL,
            precio_venta REAL
        )
    """
    )
    # Intentar añadir la columna precio_venta si la base ya existía sin ella
    try:
        cursor.execute("ALTER TABLE productos ADD COLUMN precio_venta REAL")
    except sqlite3.OperationalError:
        # Ignorar si la columna ya existe
        pass
    conexion.commit()
    conexion.close()


# ==========================================
# FASE 2: LAS FUNCIONES LÓGICAS (CRUD)
# ==========================================
def agregar_producto(id_prod, nombre, precio):
    """Agrega un producto o actualiza su precio si ya existe."""
    conexion = sqlite3.connect("inventario_precios.db")
    cursor = conexion.cursor()

    # Calcular precio de venta: dividir el precio ingresado por 0.7
    try:
        precio_venta = float(precio) / 0.7
    except Exception:
        precio_venta = None

    try:
        # Intentamos insertar el producto (incluye precio de venta)
        cursor.execute(
            "INSERT INTO productos (id, nombre, precio, precio_venta) VALUES (?, ?, ?, ?)",
            (id_prod, nombre, precio, precio_venta),
        )
        conexion.commit()
        print(f"\n✅ ¡Éxito! '{nombre}' agregado correctamente.")
    except sqlite3.IntegrityError:
        # Si el ID ya existe, saltará este error. Ofrecemos actualizar.
        print(
            f"\n⚠️ El ID {id_prod} ya existe. Actualizando el precio a ${precio:.2f}..."
        )
        cursor.execute(
            "UPDATE productos SET precio = ?, precio_venta = ? WHERE id = ?", (precio, precio_venta, id_prod)
        )
        conexion.commit()
        print("✅ Precio actualizado con éxito.")

    conexion.close()


def eliminar_producto(id_prod):
    """Elimina un producto por su ID."""
    conexion = sqlite3.connect("inventario_precios.db")
    cursor = conexion.cursor()

    # Primero verificamos si el producto existe
    cursor.execute("SELECT nombre FROM productos WHERE id = ?", (id_prod,))
    producto = cursor.fetchone()

    if producto:
        # Si existe, pedimos confirmación antes de borrar (Buena práctica)
        confirmar = input(
            f"¿Seguro que deseas eliminar '{producto[0]}' del registro? (s/n): "
        )
        if confirmar.lower() == "s":
            cursor.execute("DELETE FROM productos WHERE id = ?", (id_prod,))
            conexion.commit()
            print("❌ Producto eliminado correctamente.")
        else:
            print("Acción cancelada.")
    else:
        print("\n❌ Error: No se encontró ningún producto con ese ID.")

    conexion.close()


def mostrar_inventario():
    """Trae todos los productos y los muestra en una lista."""
    conexion = sqlite3.connect("inventario_precios.db")
    cursor = conexion.cursor()
    cursor.execute("SELECT id, nombre, precio, precio_venta FROM productos")
    productos = cursor.fetchall()

    print("\n========= LISTA DE PRECIOS =========")
    if not productos:
        print("El guardador está vacío. ¡Agrega tu primer producto!")
    else:
        # Formateamos la salida en columnas legibles
        print(f"{'ID':<6} | {'Nombre':<20} | {'Precio':<12} | {'Precio a vender':<15}")
        print("-" * 62)
        for prod in productos:
            id_p, nombre, precio, precio_venta = prod
            precio_str = f"${precio:>8.2f}" if precio is not None else "N/A"
            venta_str = f"${precio_venta:>8.2f}" if precio_venta is not None else "N/A"
            print(f"{id_p:<6} | {nombre:<20} | {precio_str:<12} | {venta_str:<15}")
    print("=====================================")

    conexion.close()


# ==========================================
# FASE 3: INTERFAZ DE USUARIO (MENÚ)
# ==========================================
def menu_principal():
    iniciar_base_datos()

    while True:
        print("\n--- GESTOR DE PRECIOS ---")
        print("1. Ver lista de precios")
        print("2. Agregar / Modificar producto")
        print("3. Eliminar un producto")
        print("4. Salir")

        opcion = input("Selecciona una opción (1-4): ")

        if opcion == "1":
            mostrar_inventario()

        elif opcion == "2":
            print("\n--- Registrar Producto ---")
            try:
                id_prod = int(input("Introduce el ID (número entero): "))
                nombre = input("Nombre del producto: ")
                precio = float(input("Precio: $"))
                agregar_producto(id_prod, nombre, precio)
            except ValueError:
                print(
                    "\n❌ Error: El ID debe ser un número entero y el precio un número válido."
                )

        elif opcion == "3":
            print("\n--- Eliminar Producto ---")
            try:
                id_prod = int(input("Introduce el ID del producto a borrar: "))
                eliminar_producto(id_prod)
            except ValueError:
                print("\n❌ Error: El ID debe ser un número entero.")

        elif opcion == "4":
            print("\n¡Gracias por usar el guardador de precios! Saliendo...")
            break
        else:
            print("\n❌ Opción no válida. Intenta de nuevo.")


# Ejecutar el programa
if __name__ == "__main__":
    menu_principal()