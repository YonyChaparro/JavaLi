import React, { useEffect, useState } from 'react';
import { FiChevronLeft } from 'react-icons/fi';

export default function Inventario({ onClose, onBack }) {
  const [productos, setProductos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [filas, setFilas] = useState([
    { codigo: '', cantidad: '', codigo_tipo_movimiento: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [respProd, respMov] = await Promise.all([
          fetch('http://localhost:3000/api/productos'),
          fetch('http://localhost:3000/api/tipos-movimiento')
        ]);
        setProductos(respProd.ok ? await respProd.json() : []);
        setTiposMovimiento(respMov.ok ? await respMov.json() : []);
      } catch (e) {
        setError('Error al cargar productos o tipos de movimiento.');
      }
    }
    cargarDatos();
  }, []);

  const handleChange = (idx, field, value) => {
    setFilas(filas =>
      filas.map((fila, i) =>
        i === idx ? { ...fila, [field]: value } : fila
      )
    );
  };

  const handleAgregarFila = () => {
    setFilas(filas => [...filas, { codigo: '', cantidad: '', codigo_tipo_movimiento: '' }]);
  };

  const handleEliminarFila = idx => {
    setFilas(filas => filas.filter((_, i) => i !== idx));
  };


  const handleGuardar = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const movimientosData = filas.filter(f => f.codigo && f.cantidad > 0 && f.codigo_tipo_movimiento);
      if (movimientosData.length === 0) {
        setError('No hay movimientos válidos para guardar.');
        setLoading(false);
        return;
      }
      const combinaciones = new Set();
      for (const mov of movimientosData) {
        const clave = mov.codigo + '|' + mov.codigo_tipo_movimiento;
        if (combinaciones.has(clave)) {
          setError('No puede haber dos filas con el mismo producto y el mismo tipo de movimiento.');
          setLoading(false);
          return;
        }
        combinaciones.add(clave);
      }
      for (const mov of movimientosData) {
        const tipo = tiposMovimiento.find(t => String(t.codigo) === String(mov.codigo_tipo_movimiento));
        if (
          tipo &&
          (tipo.nombre &&
            (tipo.nombre.toLowerCase().includes('salida') ||
             tipo.nombre.toLowerCase().includes('deterioro') ||
             tipo.nombre.toLowerCase().includes('venta')))
        ) {
          const resp = await fetch(`http://localhost:3000/api/existencias/${encodeURIComponent(mov.codigo)}`);
          if (!resp.ok) {
            setError('Error al consultar existencias del producto.');
            setLoading(false);
            return;
          }
          const data = await resp.json();
          if (Number(data.existencias) < Number(mov.cantidad)) {
            setError(`No hay existencias suficientes para retirar ${mov.cantidad} unidades del producto seleccionado (existencias actuales: ${data.existencias}).`);
            setLoading(false);
            return;
          }
        }
      }
      const payload = movimientosData.map(mov => ({
        codigo_producto: mov.codigo,
        cantidad: mov.cantidad,
        codigo_tipo_movimiento: mov.codigo_tipo_movimiento,
      }));
      const resp = await fetch('http://localhost:3000/api/movimientos-inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        setFilas([{ codigo: '', cantidad: '', codigo_tipo_movimiento: '' }]);
      } else {
        setError('Error al guardar los movimientos.');
      }
    } catch (e) {
      setError(e.message || 'Error inesperado al guardar.');
    }
    setLoading(false);
  };

  const getTipoFlujo = (tipCodigo) => {
    const tipo = tiposMovimiento.find(t => String(t.codigo) === String(tipCodigo));
    return tipo ? tipo.tipo_flujo : '';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Inventario</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition rounded-md p-2 shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {(success || error) && (
        <div className={`mb-4 p-3 rounded-md shadow-sm ${
          success
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {success ? 'Movimientos guardados correctamente.' : error}
        </div>
      )}

      <div className="mb-4">
        <button
          type="button"
          onClick={handleAgregarFila}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Agregar Fila
        </button>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Movimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Flujo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filas.map((fila, idx) => {
              const combosUsados = filas
                .filter((_, i) => i !== idx)
                .map(f => `${f.codigo}|${f.codigo_tipo_movimiento}`);

              const productosDisponibles = productos.filter(p =>
                !combosUsados.includes(`${p.codigo}|${fila.codigo_tipo_movimiento}`) || p.codigo === fila.codigo
              );

              const movimientosDisponibles = tiposMovimiento.filter(m =>
                !combosUsados.includes(`${fila.codigo}|${m.codigo}`) || m.codigo === fila.codigo_tipo_movimiento
              );

              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <select
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={fila.codigo}
                      onChange={e => handleChange(idx, 'codigo', e.target.value)}
                      required
                    >
                      <option value="">Seleccione producto</option>
                      {productosDisponibles.map(p => (
                        <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="1"
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={fila.cantidad}
                      onChange={e => handleChange(idx, 'cantidad', e.target.value)}
                      required
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={fila.codigo_tipo_movimiento}
                      onChange={e => handleChange(idx, 'codigo_tipo_movimiento', e.target.value)}
                      required
                    >
                      <option value="">Seleccione movimiento</option>
                      {movimientosDisponibles.map(m => (
                        <option key={m.codigo} value={m.codigo}>{m.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="block w-full border border-gray-300 rounded-md py-2 px-3 shadow-sm bg-gray-50">
                      {getTipoFlujo(fila.codigo_tipo_movimiento) || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800 transition rounded-md p-2 shadow"
                      onClick={() => handleEliminarFila(idx)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition shadow flex items-center"
        >
          <FiChevronLeft className="inline mr-1" /> Volver
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-md transition flex items-center shadow ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Guardar Movimientos
            </>
          )}
        </button>
      </div>
    </div>
  );
}