import { useState } from "react";

export default function FormPendiente() {
    const [cliente, setCliente] = useState("");
    const [comentario, setComentario] = useState("");
    const [productos, setProductos] = useState([{ nombre: "", cantidad: 1 }]);

    const handleProductoChange = (index, campo, valor) => {
        const nuevos = [...productos];
        nuevos[index][campo] = valor;
        setProductos(nuevos);
    };

    const agregarProducto = () => {
        setProductos([...productos, { nombre: "", cantidad: 1 }]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { cliente, comentario, productos };
        console.log("Venta pendiente guardada:", data);
        // Aquí puedes guardar en una API o en localStorage
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Guardar Venta Pendiente</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Cliente */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Nombre del cliente</label>
                    <input
                        type="text"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full border p-2 rounded"
                    />
                </div>

                {/* Productos */}
                <div>
                    <label className="block text-sm font-semibold mb-2">Productos</label>
                    {productos.map((prod, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Nombre del producto"
                                value={prod.nombre}
                                onChange={(e) => handleProductoChange(i, "nombre", e.target.value)}
                                className="border p-2 rounded"
                            />
                            <input
                                type="number"
                                placeholder="Cantidad"
                                value={prod.cantidad}
                                onChange={(e) => handleProductoChange(i, "cantidad", parseInt(e.target.value))}
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

                {/* Comentario */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Comentario (opcional)</label>
                    <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Ej: Cliente se fue a retirar dinero..."
                        className="w-full border p-2 rounded"
                        rows={2}
                    />
                </div>

                {/* Guardar */}
                <div className="text-center">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                        Guardar como pendiente
                    </button>
                </div>
            </form>
        </div>
    );
}
