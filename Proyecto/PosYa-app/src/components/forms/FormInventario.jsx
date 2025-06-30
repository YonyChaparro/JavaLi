import React, { useState } from "react";

export default function FormInventario() {
    const [formData, setFormData] = useState({
        nombre: "",
        categoria: "",
        cantidad: 0,
        precioCompra: 0,
        precioVenta: 0,
        unidadMedida: "",
        codigoBarras: "",
        descripcion: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Producto guardado:", formData);
        // Aquí puedes hacer un POST a tu backend
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Registrar Producto</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold mb-1">Nombre del producto</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Categoría</label>
                    <input
                        type="text"
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Cantidad</label>
                    <input
                        type="number"
                        name="cantidad"
                        value={formData.cantidad}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Unidad de medida</label>
                    <input
                        type="text"
                        name="unidadMedida"
                        value={formData.unidadMedida}
                        onChange={handleChange}
                        placeholder="ej. unidad, kg, litro"
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Precio de compra</label>
                    <input
                        type="number"
                        name="precioCompra"
                        value={formData.precioCompra}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Precio de venta</label>
                    <input
                        type="number"
                        name="precioVenta"
                        value={formData.precioVenta}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-semibold mb-1">Código de barras</label>
                    <input
                        type="text"
                        name="codigoBarras"
                        value={formData.codigoBarras}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-semibold mb-1">Descripción</label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        rows="3"
                    />
                </div>

                <div className="col-span-2 text-center mt-4">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Guardar producto
                    </button>
                </div>
            </form>
        </div>
    );
}
