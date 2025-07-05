import React, { useEffect, useState, useRef } from 'react';

const defaultFiltros = {
  ingresos: true,
  costos: true,
  utilidades: true,
  iva: true,
  producto: false,
  periodo: false,
};

export default function Reportes({ onClose }) {
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
      setError('Seleccione un producto');
      return;
    }
    if (filtros.periodo && (!fechaInicio || !fechaFin)) {
      setError('Seleccione un periodo válido');
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
      setError('Error al obtener datos del servidor: ' + e.message);
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
      alert('No se pudo cargar jsPDF o autoTable. Asegúrate de tenerlos instalados.');
      return;
    }
    const doc = new jsPDF();
    
    if (!tableRef.current) {
      alert('No se encontró la tabla para exportar.');
      return;
    }
    autoTable(doc, { html: tableRef.current });
    doc.save('reporte.pdf');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto relative p-8">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold">×</button>
        )}
        <h2 className="text-2xl font-bold mb-6 text-center">REPORTE GENERAL</h2>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="filtro-group flex flex-col gap-2">
            <strong>El informe muestra por producto:</strong>
            <label><input type="checkbox" name="ingresos" checked={filtros.ingresos} onChange={handleFiltroChange} /> Ingresos</label>
            <label><input type="checkbox" name="costos" checked={filtros.costos} onChange={handleFiltroChange} /> Costos</label>
            <label><input type="checkbox" name="utilidades" checked={filtros.utilidades} onChange={handleFiltroChange} /> Utilidades</label>
            <label><input type="checkbox" name="iva" checked={filtros.iva} onChange={handleFiltroChange} /> IVA</label>
          </div>
          <div className="filtro-group flex flex-col gap-2">
            <label><input type="checkbox" name="producto" checked={filtros.producto} onChange={handleFiltroChange} /> Filtro por producto</label>
            <select disabled={!filtros.producto} value={producto} onChange={handleProductoChange} className="border rounded px-2 py-1">
              <option value="">-- Selecciona --</option>
              {productos.map((p, i) => (
                <option key={i} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="filtro-group flex flex-col gap-2">
            <label><input type="checkbox" name="periodo" checked={filtros.periodo} onChange={handleFiltroChange} /> Filtro por periodo</label>
            <input type="date" name="fechaInicio" disabled={!filtros.periodo} value={fechaInicio} onChange={handlePeriodoChange} className="border rounded px-2 py-1" />
            <input type="date" name="fechaFin" disabled={!filtros.periodo} value={fechaFin} onChange={handlePeriodoChange} className="border rounded px-2 py-1" />
          </div>
        </div>
        <button onClick={handleGenerar} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow mb-4">Generar</button>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading && <div className="mb-4">Cargando...</div>}
        {mostrarReporte && (
          <div className="mt-4">
            <table ref={tableRef} id="tabla-reporte" className="min-w-full border border-gray-300 rounded mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">PRODUCTO</th>
                  {filtros.ingresos && <th className="py-2 px-4 border">INGRESOS</th>}
                  {filtros.costos && <th className="py-2 px-4 border">COSTOS</th>}
                  {filtros.utilidades && <th className="py-2 px-4 border">UTILIDADES</th>}
                  {filtros.iva && <th className="py-2 px-4 border">IVA</th>}
                </tr>
              </thead>
              <tbody>
                {reporte.map((d, i) => (
                  <tr key={i}>
                    <td className="py-2 px-4 border">{d.producto}</td>
                    {filtros.ingresos && <td className="py-2 px-4 border">{Number(d.ingresos).toFixed(2)}</td>}
                    {filtros.costos && <td className="py-2 px-4 border">{Number(d.costos).toFixed(2)}</td>}
                    {filtros.utilidades && <td className="py-2 px-4 border">{Number(d.utilidades).toFixed(2)}</td>}
                    {filtros.iva && <td className="py-2 px-4 border">{Number(d.iva).toFixed(2)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleDescargarPDF} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded shadow" id="btnPDF">Descargar PDF</button>
          </div>
        )}
      </div>
    </div>
  );
}
