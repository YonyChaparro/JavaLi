import React, { useEffect, useState } from 'react'
import { FiChevronLeft, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Inventario({ onClose, onBack }) {
  const [productos, setProductos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [filas, setFilas] = useState([
    { codigo: '', cantidad: '', tip_codigo: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [rowErrors, setRowErrors] = useState({});

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
    // Clear error for the specific field when it changes
    setRowErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[idx] && newErrors[idx][field]) {
        delete newErrors[idx][field];
        if (Object.keys(newErrors[idx]).length === 0) {
          delete newErrors[idx];
        }
      }
      return newErrors;
    });
  };

  const handleAgregarFila = () => {
    setFilas([...filas, { codigo: '', cantidad: '', tip_codigo: '' }]);
  };

  const handleEliminarFila = (idx) => {
    setFilas(filas.filter((_, i) => i !== idx));
    setRowErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[idx]; // Remove errors for the deleted row
      return newErrors;
    });
  };

  const validateFilas = () => {
    const newErrors = {};
    let isValid = true;

    filas.forEach((fila, idx) => {
      const rowSpecificErrors = {};
      if (!fila.codigo) {
        rowSpecificErrors.codigo = 'Producto es obligatorio.';
        isValid = false;
      }
      if (!fila.cantidad || isNaN(fila.cantidad) || Number(fila.cantidad) <= 0) {
        rowSpecificErrors.cantidad = 'Cantidad debe ser un número positivo.';
        isValid = false;
      }
      if (!fila.tip_codigo) {
        rowSpecificErrors.tip_codigo = 'Tipo de movimiento es obligatorio.';
        isValid = false;
      }
      if (Object.keys(rowSpecificErrors).length > 0) {
        newErrors[idx] = rowSpecificErrors;
      }
    });

    setRowErrors(newErrors);
    return isValid;
  };

  const handleGuardar = async () => {
    setError(null);
    setSuccess(false);

    if (!validateFilas()) {
      setError("Por favor, corrija los errores en las filas de movimiento.");
      return;
    }

    setLoading(true);
    try {
      const movimientosAEnviar = filas.map(fila => ({
        prod_codigo: fila.codigo,
        mov_cantidad: Number(fila.cantidad),
        tip_codigo: fila.tip_codigo
      }));

      const resp = await fetch('http://localhost:3000/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movimientosAEnviar),
      });

      if (resp.ok) {
        setSuccess(true);
        setFilas([{ codigo: '', cantidad: '', tip_codigo: '' }]); // Reset form
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 2000);
      } else {
        const errorData = await resp.json();
        throw new Error(errorData.message || 'Error al registrar movimientos.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Registro de Movimientos de Inventario</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Cerrar formulario de inventario" // Added aria-label
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {success && (
          <div className="bg-green-50 border border-green-500 text-green-800 p-4 rounded-md" role="alert"> {/* Updated styling */}
            Movimientos registrados exitosamente.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-500 text-red-700 p-4 rounded-md" role="alert"> {/* Updated styling */}
            {error}
          </div>
        )}

        <fieldset className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <legend className="text-lg font-semibold text-gray-700 px-2 mb-4">Detalle de Movimientos</legend>
          <div className="space-y-4 mt-2"> {/* Added mt-2 for spacing after legend */}
            {filas.map((fila, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-3 bg-white rounded-md shadow-sm border border-gray-200">
                <div>
                  <label htmlFor={`producto-${idx}`} className="block text-sm font-medium text-gray-700">Producto <span className="text-red-500">*</span></label>
                  <select
                    id={`producto-${idx}`}
                    value={fila.codigo}
                    onChange={(e) => handleChange(idx, 'codigo', e.target.value)}
                    className={`block w-full sm:text-sm border ${rowErrors[idx]?.codigo ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
                  >
                    <option value="">Seleccione...</option>
                    {productos.map(p => (
                      <option key={p.prod_codigo} value={p.prod_codigo}>{p.prod_nombre}</option>
                    ))}
                  </select>
                  {rowErrors[idx]?.codigo && <p className="text-red-500 text-sm mt-1">{rowErrors[idx].codigo}</p>}
                </div>
                <div>
                  <label htmlFor={`cantidad-${idx}`} className="block text-sm font-medium text-gray-700">Cantidad <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    id={`cantidad-${idx}`}
                    value={fila.cantidad}
                    onChange={(e) => handleChange(idx, 'cantidad', e.target.value)}
                    className={`block w-full sm:text-sm border ${rowErrors[idx]?.cantidad ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
                    min="1"
                  />
                  {rowErrors[idx]?.cantidad && <p className="text-red-500 text-sm mt-1">{rowErrors[idx].cantidad}</p>}
                </div>
                <div>
                  <label htmlFor={`tipo-movimiento-${idx}`} className="block text-sm font-medium text-gray-700">Tipo de Movimiento <span className="text-red-500">*</span></label>
                  <select
                    id={`tipo-movimiento-${idx}`}
                    value={fila.tip_codigo}
                    onChange={(e) => handleChange(idx, 'tip_codigo', e.target.value)}
                    className={`block w-full sm:text-sm border ${rowErrors[idx]?.tip_codigo ? 'border-red-500' : 'border-gray-300'} rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`} // Updated styling
                  >
                    <option value="">Seleccione...</option>
                    {tiposMovimiento.map(tm => (
                      <option key={tm.tip_codigo} value={tm.tip_codigo}>{tm.tip_nombre}</option>
                    ))}
                  </select>
                  {rowErrors[idx]?.tip_codigo && <p className="text-red-500 text-sm mt-1">{rowErrors[idx].tip_codigo}</p>}
                </div>
                <div className="flex justify-end">
                  {filas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarFila(idx)}
                      className="text-red-500 hover:text-red-700 p-2"
                      aria-label="Eliminar fila de movimiento" // Added aria-label
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleAgregarFila}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center shadow-sm" // Updated to rounded-md and added shadow-sm
              >
                <FiPlus className="mr-1" />
                Agregar Fila
              </button>
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition shadow" // Updated to rounded-md and added shadow
            disabled={loading}
          >
            <FiChevronLeft className="inline mr-1" /> Volver
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-md transition flex items-center shadow ${ // Updated to rounded-md and added shadow
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}