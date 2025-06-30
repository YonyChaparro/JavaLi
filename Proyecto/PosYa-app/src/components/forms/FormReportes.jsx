import { useState } from "react";

export default function FormReportes() {
    const [tipoReporte, setTipoReporte] = useState("ventas");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [generado, setGenerado] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setGenerado(true);
        console.log("Generando reporte:", {
            tipoReporte,
            fechaInicio,
            fechaFin,
        });
        // Aquí iría una llamada a tu API o lógica de generación
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Generar Reporte</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tipo de reporte */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Tipo de reporte</label>
                    <select
                        value={tipoReporte}
                        onChange={(e) => setTipoReporte(e.target.value)}
                        className="w-full border p-2 rounded"
                    >
                        <option value="ventas">Ventas</option>
                        <option value="productos">Productos más vendidos</option>
                        <option value="clientes">Clientes frecuentes</option>
                        <option value="ingresos">Ingresos por día</option>
                    </select>
                </div>

                {/* Rango de fechas */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Desde</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1">Hasta</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                </div>

                {/* Botón */}
                <div className="text-center">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Generar Reporte
                    </button>
                </div>
            </form>

            {generado && (
                <div className="mt-6 bg-gray-100 p-4 rounded text-center">
                    <p className="text-sm text-gray-700">
                        📊 Reporte de <strong>{tipoReporte}</strong> generado para el rango del{" "}
                        <strong>{fechaInicio}</strong> al <strong>{fechaFin}</strong>.
                    </p>
                </div>
            )}
        </div>
    );
}
