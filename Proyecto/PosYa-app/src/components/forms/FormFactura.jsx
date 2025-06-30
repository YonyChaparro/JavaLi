import { useState } from "react";

export default function FormFactura() {
    const [productos, setProductos] = useState([{ nombre: "", cantidad: 1, precio: 0 }]);

    const handleChange = (index, field, value) => {
        const updated = [...productos];
        updated[index][field] = value;
        setProductos(updated);
    };

    const agregarProducto = () => {
        setProductos([...productos, { nombre: "", cantidad: 1, precio: 0 }]);
    };

    const total = productos.reduce((acc, p) => acc + p.cantidad * p.precio, 0);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Factura Ordinaria</h2>

            <form className="space-y-6">
                {/* Cliente */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Cliente</label>
                    <input type="text" placeholder="Nombre del cliente" className="w-full border p-2 rounded" />
                </div>

                {/* Productos */}
                <div>
                    <label className="block text-sm font-semibold mb-2">Productos</label>
                    {productos.map((p, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Producto"
                                value={p.nombre}
                                onChange={(e) => handleChange(index, "nombre", e.target.value)}
                                className="border p-2 rounded"
                            />
                            <input
                                type="number"
                                placeholder="Cantidad"
                                value={p.cantidad}
                                onChange={(e) => handleChange(index, "cantidad", parseInt(e.target.value))}
                                className="border p-2 rounded"
                            />
                            <input
                                type="number"
                                placeholder="Precio"
                                value={p.precio}
                                onChange={(e) => handleChange(index, "precio", parseFloat(e.target.value))}
                                className="border p-2 rounded"
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={agregarProducto}
                        className="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        + Agregar producto
                    </button>
                </div>

                {/* Total */}
                <div className="text-right font-bold text-lg">
                    Total: ${total.toFixed(2)}
                </div>

                {/* Botón Guardar */}
                <div className="text-center">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Guardar Factura
                    </button>
                </div>
            </form>
        </div>
    );
}
