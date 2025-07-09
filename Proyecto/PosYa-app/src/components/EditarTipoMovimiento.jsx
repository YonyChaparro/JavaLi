import { useEffect, useState } from 'react';

export default function EditarTipoMovimiento({ codigo, onClose, onSuccess }) {
  const [nombre, setNombre] = useState('');
  const [flujo, setFlujo] = useState('Entrada');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codigoTipo, setCodigoTipo] = useState(codigo || '');

  useEffect(() => {
    if (!codigo) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/tipos-movimiento/${codigo}`)
      .then(resp => {
        if (!resp.ok) throw new Error('No se pudo obtener el registro');
        return resp.json();
      })
      .then(data => {
        setCodigoTipo(data.codigo);
        setNombre(data.nombre);
        setFlujo(data.tipo_flujo);
      })
      .catch(err => {
        setError('Error al cargar los datos: ' + err);
      })
      .finally(() => setLoading(false));
  }, [codigo]);

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
      const resp = await fetch(`http://localhost:3000/api/tipos-movimiento/${codigo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), tipo_flujo: flujo })
      });
      if (resp.ok) {
        onSuccess && onSuccess();
      } else {
        const data = await resp.json();
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError('Error de red al actualizar: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-auto">
        <h2 className="text-xl font-bold mb-4">Editar tipo de movimiento de inventario</h2>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Código</label>
          <input
            type="text"
            name="codigo"
            className="w-full border rounded px-3 py-2 bg-gray-100"
            value={codigoTipo}
            readOnly
          />
        </div>
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
