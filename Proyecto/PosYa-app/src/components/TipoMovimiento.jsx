import { useEffect, useState } from 'react';
import EditarTipoMovimiento from './EditarTipoMovimiento';

function TipoMovimientoRow({ row, onEdit, onDelete }) {
  return (
    <tr>
      <td className="py-2 px-4 border-b">{row.tip_codigo}</td>
      <td className="py-2 px-4 border-b">{row.tip_nombre}</td>
      <td className="py-2 px-4 border-b">{row.tip_tipo_flujo}</td>
      <td className="py-2 px-4 border-b text-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded mr-2"
          onClick={() => onEdit(row)}
        >Editar</button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
          onClick={() => onDelete(row)}
        >Eliminar</button>
      </td>
    </tr>
  );
}

function CrearTipoMovimientoModal({ onClose, onSuccess }) {
  const [nombre, setNombre] = useState('');
  const [flujo, setFlujo] = useState('Entrada');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        onClose();
        // La notificación ahora se maneja en el componente padre.
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

function ConfirmationModal({ title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-auto">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TipoMovimiento() {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCrear, setShowCrear] = useState(false);
  // Nuevo estado para edición
  const [showEditar, setShowEditar] = useState(false);
  const [codigoEditar, setCodigoEditar] = useState(null);
  const [crearKey, setCrearKey] = useState(0);
  const [editarKey, setEditarKey] = useState(0);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchTipos = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('http://localhost:3000/api/tipos-movimiento');
      const data = await resp.json();
      setTipos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000);
  };

  const handleDelete = (row) => {
    setItemToDelete(row);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const resp = await fetch(`http://localhost:3000/api/tipos-movimiento/${itemToDelete.tip_codigo}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        showNotification('Tipo de movimiento eliminado correctamente.');
        fetchTipos();
      } else {
        const data = await resp.json();
        showNotification('Error al eliminar: ' + (data.error || 'Error desconocido'), 'error');
      }
    } catch (err) {
      showNotification('Error de red al eliminar: ' + err, 'error');
    } finally {
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  // Ahora abre el modal de edición
  const handleEdit = (row) => {
    setCodigoEditar(row.tip_codigo);
    setEditarKey(Date.now()); // Forzar re-montaje del modal para resetear su estado
    setShowEditar(true);
  };

  return (
    <div className="bg-gray-50 p-8 min-h-screen">
      {/* Contenedor de Notificación */}
      {notification.message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Tipos de Movimiento de Inventario</h1>
      <div className="mb-4 flex justify-end">
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            setCrearKey(Date.now());
            setShowCrear(true);
          }}
        >
          Crear tipo de movimiento
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Código</th>
              <th className="py-2 px-4 border-b">Nombre</th>
              <th className="py-2 px-4 border-b">Tipo de Flujo</th>
              <th className="py-2 px-4 border-b text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-4">Cargando...</td></tr>
            ) : tipos.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4">No hay registros</td></tr>
            ) : (
              tipos.map(row => (
                <TipoMovimientoRow
                  key={row.tip_codigo}
                  row={row}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      {showCrear && (
        <CrearTipoMovimientoModal
          key={crearKey}
          onClose={() => setShowCrear(false)}
          onSuccess={() => {
            fetchTipos();
            showNotification('Tipo de movimiento creado correctamente.');
          }}
        />
      )}
      {showEditar && (
        <EditarTipoMovimiento
          key={codigoEditar ? `editar-${codigoEditar}-${editarKey}` : undefined}
          codigo={codigoEditar}
          onClose={() => setShowEditar(false)}
          onSuccess={() => {
            setShowEditar(false);
            showNotification('Tipo de movimiento actualizado correctamente.');
            fetchTipos();
          }}
        />
      )}
      {showConfirmDelete && itemToDelete && (
        <ConfirmationModal
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que deseas eliminar el tipo de movimiento "${itemToDelete.tip_nombre}" (Código: ${itemToDelete.tip_codigo})? Esta acción no se puede deshacer.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirmDelete(false);
            setItemToDelete(null);
          }}
          confirmText="Sí, eliminar"
          cancelText="No, cancelar"
        />
      )}
      {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
    </div>
  );
}
