import React, { useEffect, useState } from 'react';

export default function Inventario({ onClose }) {
  const [productos, setProductos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [filas, setFilas] = useState([
    { pro_codigo: '', cantidad: '', tip_codigo: '' }
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
    setFilas(filas => [...filas, { pro_codigo: '', cantidad: '', tip_codigo: '' }]);
  };

  const handleEliminarFila = idx => {
    setFilas(filas => filas.filter((_, i) => i !== idx));
  };

  const handleGuardar = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Validar filas
      const movimientosData = filas.filter(f => f.pro_codigo && f.cantidad > 0 && f.tip_codigo);
      if (movimientosData.length === 0) {
        setError('No hay movimientos válidos para guardar.');
        setLoading(false);
        return;
      }
      // Validar duplicados producto + tipo de movimiento
      const combinaciones = new Set();
      for (const mov of movimientosData) {
        const clave = mov.pro_codigo + '|' + mov.tip_codigo;
        if (combinaciones.has(clave)) {
          setError('No puede haber dos filas con el mismo producto y el mismo tipo de movimiento.');
          setLoading(false);
          return;
        }
        combinaciones.add(clave);
      }

      // Validar existencias para salidas, deterioro y venta (por cada movimiento individual)
      for (const mov of movimientosData) {
        // Buscar el tipo de movimiento por tip_codigo (puede ser string o number)
        const tipo = tiposMovimiento.find(t => String(t.tip_codigo) === String(mov.tip_codigo));
        if (
          tipo &&
          (tipo.tip_nombre &&
            (tipo.tip_nombre.toLowerCase().includes('salida') ||
             tipo.tip_nombre.toLowerCase().includes('deterioro') ||
             tipo.tip_nombre.toLowerCase().includes('venta')))
        ) {
          const resp = await fetch(`http://localhost:3000/api/existencias/${encodeURIComponent(mov.pro_codigo)}`);
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

      // Si pasa la validación, guardar
      const resp = await fetch('http://localhost:3000/api/movimientos-inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movimientosData)
      });
      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        setFilas([{ pro_codigo: '', cantidad: '', tip_codigo: '' }]);
      } else {
        setError('Error al guardar los movimientos.');
      }
    } catch (e) {
      setError(e.message || 'Error inesperado al guardar.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold">×</button>
      )}
      <h2 className="text-2xl font-bold mb-6 text-center">Gestión de Inventario</h2>
      <table className="min-w-full border-collapse mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4">Producto</th>
            <th className="py-2 px-4">Cantidad</th>
            <th className="py-2 px-4">Tipo de Movimiento</th>
            <th className="py-2 px-4">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, idx) => {
            // Combinaciones de producto y movimiento ya usadas en OTRAS filas
            const combosUsados = filas
              .filter((_, i) => i !== idx)
              .map(f => `${f.pro_codigo}|${f.tip_codigo}`);

            // Filtrar productos: un producto no está disponible si ya se usó con el tipo de movimiento de la fila actual
            const productosDisponibles = productos.filter(p => 
                !combosUsados.includes(`${p.pro_codigo}|${fila.tip_codigo}`) || p.pro_codigo === fila.pro_codigo
            );

            // Filtrar movimientos: un movimiento no está disponible si ya se usó con el producto de la fila actual
            const movimientosDisponibles = tiposMovimiento.filter(m => 
                !combosUsados.includes(`${fila.pro_codigo}|${m.tip_codigo}`) || m.tip_codigo === fila.tip_codigo
            );

            return (
              <tr key={idx}>
                <td className="py-1 px-2">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={fila.pro_codigo}
                    onChange={e => handleChange(idx, 'pro_codigo', e.target.value)}
                    required
                  >
                    <option value="">Seleccione producto</option>
                    {productosDisponibles.map(p => (
                      <option key={p.pro_codigo} value={p.pro_codigo}>{p.pro_nombre}</option>
                    ))}
                  </select>
                </td>
                <td className="py-1 px-2">
                  <input
                    type="number"
                    min="1"
                    className="border rounded px-2 py-1 w-full"
                    value={fila.cantidad}
                    onChange={e => handleChange(idx, 'cantidad', e.target.value)}
                    required
                  />
                </td>
                <td className="py-1 px-2">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={fila.tip_codigo}
                    onChange={e => handleChange(idx, 'tip_codigo', e.target.value)}
                    required
                  >
                    <option value="">Seleccione movimiento</option>
                    {movimientosDisponibles.map(m => (
                      <option key={m.tip_codigo} value={m.tip_codigo}>{m.tip_nombre}</option>
                    ))}
                  </select>
                </td>
                <td className="py-1 px-2 text-center">
                  <button type="button" className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleEliminarFila(idx)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex gap-4 justify-end mb-4">
        <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded" onClick={handleAgregarFila}>
          Agregar Fila
        </button>
        <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold" onClick={handleGuardar} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
      {success && <div className="text-green-600 mt-2">Movimientos guardados correctamente.</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
