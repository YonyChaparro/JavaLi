import React, { useEffect, useState, useRef } from 'react';
import { FiDownload, FiChevronLeft } from 'react-icons/fi'; // Removed unused icons for cleaner code

const defaultFiltros = {
  ingresos: true,
  costos: true,
  utilidades: true,
  iva: true,
  producto: false,
  periodo: false,
};

export default function Reportes({ onClose, onBack }) {
  const [filtros, setFiltros] = useState(defaultFiltros);
  const [producto, setProducto] = useState('');
  const [productos, setProductos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState([]);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tableRef = useRef(null);

  useEffect(() => {
    async function cargarProductosVendidos() {
      try {
        const resp = await fetch('http://localhost:3000/api/productos-vendidos');
        if (!resp.ok) {
          throw new Error('Error al cargar productos vendidos');
        }
        const productos = await resp.json();
        setProductos(productos);
      } catch (e) {
        setError(e.message);
      }
    }
    cargarProductosVendidos();
  }, []);

  const handleFiltroChange = (e) => {
    const { name, checked } = e.target;
    setFiltros(f => ({ ...f, [name]: checked }));
    setMostrarReporte(false); // Reset report visibility when filters change
  };

  const handleProductoChange = (e) => {
    setProducto(e.target.value);
    setMostrarReporte(false); // Reset report visibility when product changes
  };

  const handlePeriodoChange = (e) => {
    if (e.target.name === 'fechaInicio') setFechaInicio(e.target.value);
    else setFechaFin(e.target.value);
    setMostrarReporte(false); // Reset report visibility when period changes
  };

  const handleGenerar = async () => {
    setError('');
    if (filtros.producto && !producto) {
      setError('Por favor seleccione un producto para filtrar');
      return;
    }
    if (filtros.periodo && (!fechaInicio || !fechaFin)) {
      setError('Por favor seleccione un rango de fechas válido');
      return;
    }
    if (fechaInicio > fechaFin) {
      setError('La fecha de inicio no puede ser mayor a la fecha final');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.producto) params.append('producto', producto);
      if (filtros.periodo) {
        params.append('fechaInicio', fechaInicio);
        params.append('fechaFin', fechaFin);
      }
      const resp = await fetch(`http://localhost:3000/api/reportes?${params.toString()}`);
      if (!resp.ok) {
        throw new Error('Error al generar el reporte');
      }
      const datos = await resp.json();
      setReporte(datos);
      setMostrarReporte(true);
    } catch (e) {
      console.error('Error:', e);
      setError('Error al conectar con el servidor: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewReport = () => {
    setFiltros(defaultFiltros);
    setProducto('');
    setFechaInicio('');
    setFechaFin('');
    setReporte([]);
    setMostrarReporte(false);
    setError('');
  };

  const handleDescargarPDF = async () => {
    let jsPDF, autoTable;
    try {
      jsPDF = (await import('jspdf')).jsPDF;
      autoTable = (await import('jspdf-autotable')).default;
    } catch (e) {
      setError('No se pudo cargar el generador de PDF');
      return;
    }
    const doc = new jsPDF();

    let filtersDesc = [];
    if (filtros.producto && producto) {
      filtersDesc.push(`Producto: ${producto}`);
    }
    if (filtros.periodo && fechaInicio && fechaFin) {
      filtersDesc.push(`Periodo: ${fechaInicio} a ${fechaFin}`);
    }
    if (filtersDesc.length > 0) {
      doc.setFontSize(12);
      doc.text('Filtros aplicados:', 14, 16);
      filtersDesc.forEach((f, i) => {
        doc.text(f, 14, 24 + i * 8);
      });
    }

    let startY = filtersDesc.length > 0 ? 32 + (filtersDesc.length - 1) * 8 : 10;
    if (!tableRef.current) {
      setError('No hay datos para exportar');
      return;
    }
    autoTable(doc, { html: tableRef.current, startY });
    doc.save(`reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const formatearPrecio = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(valor);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Reporte General</h2>
        <button
          onClick={onBack || onClose}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition flex items-center"
        >
          <FiChevronLeft className="inline mr-1" /> Volver
        </button>
      </div>

      <div className="space-y-8"> {/* Increased spacing between major sections */}
        {/* Panel de Filtros */}
        <fieldset className="p-4 bg-gray-50 rounded-lg border border-gray-200"> {/* Added fieldset and border */}
          <legend className="text-lg font-semibold text-gray-800 px-2">Configuración del Reporte</legend> {/* Added legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4"> {/* Added mt-4 for spacing after legend */}
            {/* Columna 1: Datos a mostrar */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Datos a Incluir</h3>
              {['ingresos', 'costos', 'utilidades', 'iva'].map((item) => (
                <label key={item} className="flex items-center space-x-2 text-gray-700">
                  <input
                    type="checkbox"
                    name={item}
                    checked={filtros[item]}
                    onChange={handleFiltroChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="capitalize">{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                </label>
              ))}
            </div>

            {/* Columna 2: Filtro por producto */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Filtrar por Producto</h3>
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  name="producto"
                  checked={filtros.producto}
                  onChange={handleFiltroChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Activar filtro</span>
              </label>

              {filtros.producto && (
                <select
                  value={producto}
                  onChange={handleProductoChange}
                  className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated style
                >
                  <option value="">Seleccione producto...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Columna 3: Filtro por periodo */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Filtrar por Periodo</h3>
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  name="periodo"
                  checked={filtros.periodo}
                  onChange={handleFiltroChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Activar filtro</span>
              </label>

              {filtros.periodo && (
                <div className="space-y-2 mt-2">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={fechaInicio}
                      onChange={handlePeriodoChange}
                      className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated style
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={fechaFin}
                      onChange={handlePeriodoChange}
                      className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated style
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-center space-x-3 mt-6">
          {!mostrarReporte && ( // Show "Generar Reporte" only if no report is displayed
            <button
              onClick={handleGenerar}
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center ${loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                'Generar Reporte'
              )}
            </button>
          )}

          {mostrarReporte && ( // Show "Generar Nuevo Reporte" only if a report is displayed
            <button
              onClick={handleNewReport}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition flex items-center"
            >
              Generar Nuevo Reporte
            </button>
          )}
        </div>

        {/* Resultados del Reporte */}
        {mostrarReporte && (
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Resultados del Reporte</h3>
              <button
                onClick={handleDescargarPDF}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center"
              >
                <FiDownload className="mr-2" />
                Descargar PDF
              </button>
            </div>

            <div className="overflow-x-auto">
              <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    {filtros.ingresos && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingresos
                      </th>
                    )}
                    {filtros.costos && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costos
                      </th>
                    )}
                    {filtros.utilidades && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilidades
                      </th>
                    )}
                    {filtros.iva && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IVA
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporte.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.producto}
                      </td>
                      {filtros.ingresos && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatearPrecio(item.ingresos)}
                        </td>
                      )}
                      {filtros.costos && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatearPrecio(item.costos)}
                        </td>
                      )}
                      {filtros.utilidades && (
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${item.utilidades >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {formatearPrecio(item.utilidades)}
                        </td>
                      )}
                      {filtros.iva && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatearPrecio(item.iva)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}