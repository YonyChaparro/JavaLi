import { useState, useEffect } from 'react';

export default function CrearTipoMovimiento({ onClose, onSuccess }) {
  const [nombre, setNombre] = useState('');
  const [flujo, setFlujo] = useState('Entrada');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reinicia el formulario cada vez que se muestre el modal
  useEffect(() => {
    setNombre('');
    setFlujo('Entrada');
    setError('');
    setLoading(false);
  }, [onClose]); // Dependencia: cada vez que cambie la función onClose (es decir, cada vez que se muestre el modal)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (nombre.trim().length < 3 || nombre.trim().length > 50) {
      setError('El nombre debe tener entre 3 y 50 caracteres.');
      return;
    }
    if (flujo !== 'Entrada' && flujo !== 'Salida') {
      setError('Tipo de flujo inválido.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:3000/api/tipos-movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip_nombre: nombre.trim(), tip_tipo_flujo: flujo })
      });
      if (resp.ok) {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
        alert('Tipo de movimiento creado correctamente');
      } else {
        const data = await resp.json();
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError('Error de red al crear: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-auto">
        <h2 className="text-xl font-bold mb-4">Crear tipo de movimiento de inventario</h2>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Nombre</label>
          <input
            type="text"
            name="nombre"
            className="w-full border rounded px-3 py-2"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            minLength={3}
            maxLength={50}
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Tipo de flujo</label>
          <select
            name="flujo"
            className="w-full border rounded px-3 py-2"
            value={flujo}
            onChange={e => setFlujo(e.target.value)}
            required
            disabled={loading}
          >
            <option value="Entrada">Entrada</option>
            <option value="Salida">Salida</option>
          </select>
        </div>
        {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
