import React, { useEffect, useState, useRef } from 'react';
import { FiDownload, FiChevronLeft, FiFilter, FiX, FiFileText } from 'react-icons/fi';

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
        const productos = await resp.json();
        setProductos(productos);
      } catch (e) {
        setError('Error al cargar productos vendidos');
      }
    }
    cargarProductosVendidos();
  }, []);

  const handleFiltroChange = (e) => {
    const { name, checked } = e.target;
    setFiltros(f => ({ ...f, [name]: checked }));
    setMostrarReporte(false);
  };

  const handleProductoChange = (e) => {
    setProducto(e.target.value);
    setMostrarReporte(false);
  };

  const handlePeriodoChange = (e) => {
    if (e.target.name === 'fechaInicio') setFechaInicio(e.target.value);
    else setFechaFin(e.target.value);
    setMostrarReporte(false);
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
      const datos = await resp.json();
      setReporte(datos);
      setMostrarReporte(true);
    } catch (e) {
      setError('Error al conectar con el servidor: ' + e.message);
    } finally {
      setLoading(false);
    }
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

    // Construir descripción de filtros activos
    let filtrosDesc = [];
    if (filtros.producto && producto) {
      filtrosDesc.push(`Producto: ${producto}`);
    }
    if (filtros.periodo && fechaInicio && fechaFin) {
      filtrosDesc.push(`Periodo: ${fechaInicio} a ${fechaFin}`);
    }
    if (filtrosDesc.length > 0) {
      doc.setFontSize(12);
      doc.text('Filtros aplicados:', 14, 16);
      filtrosDesc.forEach((f, i) => {
        doc.text(f, 14, 24 + i * 8);
      });
    }

    // Ajustar el inicio de la tabla si hay filtros
    let startY = filtrosDesc.length > 0 ? 32 + (filtrosDesc.length - 1) * 8 : 10;
    if (!tableRef.current) {
      setError('No hay datos para exportar');
      return;
    }
    autoTable(doc, { html: tableRef.current, startY });
    doc.save(`reporte_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const resetFiltros = () => {
    setFiltros(defaultFiltros);
    setProducto('');
    setFechaInicio('');
    setFechaFin('');
    setMostrarReporte(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto relative p-8">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <h2 className="text-2xl font-bold mb-6 text-center">REPORTE GENERAL</h2>
        
        {/* Contenido mejorado */}
        <div className="space-y-6">
          {/* Panel de Filtros Mejorado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-xl">
            {/* Columna 1: Datos a mostrar */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Datos a Incluir</h3>
              {['ingresos', 'costos', 'utilidades', 'iva'].map((item) => (
                <label key={item} className="flex items-center space-x-2">
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
              <h3 className="font-semibold text-gray-700 border-b pb-2">Filtrar por Producto</h3>
              <label className="flex items-center space-x-2">
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mt-2"
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
              <h3 className="font-semibold text-gray-700 border-b pb-2">Filtrar por Periodo</h3>
              <label className="flex items-center space-x-2">
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
                    <label className="block text-sm text-gray-600 mb-1">Desde</label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={fechaInicio}
                      onChange={handlePeriodoChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hasta</label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={fechaFin}
                      onChange={handlePeriodoChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4"> {/* Cambiado a flex-end y space-x-4 */}
            <button 
              onClick={onBack || onClose}
              className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
            >
              <FiChevronLeft className="mr-2" />
              Volver
            </button>
            
            <button
              onClick={handleGenerar}
              disabled={loading}
              className={`flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
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
          </div>

          {/* Resultados del Reporte */}
          {mostrarReporte && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Resultados</h3>
                <button
                  onClick={handleDescargarPDF}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow"
                >
                  <FiDownload className="mr-2" />
                  Descargar PDF
                </button>
              </div>
              
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      {filtros.ingresos && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ingresos
                        </th>
                      )}
                      {filtros.costos && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Costos
                        </th>
                      )}
                      {filtros.utilidades && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilidades
                        </th>
                      )}
                      {filtros.iva && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IVA
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reporte.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.producto}
                        </td>
                        {filtros.ingresos && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                            ${Number(item.ingresos).toFixed(2)}
                          </td>
                        )}
                        {filtros.costos && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                            ${Number(item.costos).toFixed(2)}
                          </td>
                        )}
                        {filtros.utilidades && (
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                            item.utilidades >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${Number(item.utilidades).toFixed(2)}
                          </td>
                        )}
                        {filtros.iva && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                            ${Number(item.iva).toFixed(2)}
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
    </div>
  );
} 