import { useState } from "react";

export default function FormVendedor() {
    const [formData, setFormData] = useState({
        nombre: "",
        cedula: "",
        correo: "",
        telefono: "",
        comision: "",
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
        console.log("Vendedor guardado:", formData);
        // Aquí puedes integrar la lógica para guardar el vendedor en la base de datos
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Registrar Vendedor</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    <label className="block text-sm font-semibold mb-1">Nombre completo</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Ana Gómez"
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Cédula</label>
                    <input
                        type="text"
                        name="cedula"
                        value={formData.cedula}
                        onChange={handleChange}
                        placeholder="Ej: 1098765432"
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Correo electrónico</label>
                    <input
                        type="email"
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        placeholder="Ej: ana@example.com"
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Teléfono</label>
                    <input
                        type="text"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Ej: 3111234567"
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-1">Comisión (%)</label>
                    <input
                        type="number"
                        name="comision"
                        value={formData.comision}
                        onChange={handleChange}
                        placeholder="Ej: 5"
                        className="w-full border p-2 rounded"
                        min="0"
                        max="100"
                    />
                </div>

                <div className="text-center">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Guardar Vendedor
                    </button>
                </div>
            </form>
        </div>
    );
}
