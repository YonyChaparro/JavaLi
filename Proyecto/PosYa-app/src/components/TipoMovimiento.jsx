import { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiChevronLeft, FiPlus } from 'react-icons/fi';
import EditarTipoMovimiento from './EditarTipoMovimiento';

function TipoMovimientoRow({ row, onEdit, onDelete }) {
  const isDefault = row.codigo <= 4;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.codigo}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.nombre}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.tipo_flujo}</td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={e => { e.stopPropagation(); onEdit(row); }}
          className="text-blue-600 hover:text-blue-900 mr-4"
          title="Editar tipo de movimiento"
        >
          <FiEdit2 />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(row); }}
          className={`text-red-600 ${isDefault ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-900'}`}
          title={isDefault ? 'Este tipo de movimiento no se puede eliminar' : 'Eliminar tipo de movimiento'}
          disabled={isDefault}
        >
          <FiTrash2 />
        </button>
      </td>
    </tr>
  );
}

function CrearTipoMovimientoModal({ onClose, onSuccess }) {
  const [nombre, setNombre] = useState('');
  const [flujo, setFlujo] = useState('Entrada');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    try {
      const resp = await fetch('http://localhost:3000/api/tipos-movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), tipo_flujo: flujo })
      });
      if (resp.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const data = await resp.json();
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError('Error de red al crear: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Crear tipo de movimiento</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre*
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="flujo" className="block text-sm font-medium text-gray-700">
              Tipo de flujo*
            </label>
            <select
              id="flujo"
              name="flujo"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={flujo}
              onChange={e => setFlujo(e.target.value)}
              required
              disabled={isSubmitting}
            >
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded transition flex items-center ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmationModal({ title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TipoMovimiento({ onBack }) {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCrear, setShowCrear] = useState(false);
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
      if (Array.isArray(data)) {
        data.sort((a, b) => a.codigo - b.codigo);
        setTipos(data);
      } else {
        setTipos([]);
      }
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
      const resp = await fetch(`http://localhost:3000/api/tipos-movimiento/${itemToDelete.codigo}`, {
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

  const handleEdit = (row) => {
    setCodigoEditar(row.codigo);
    setEditarKey(Date.now());
    setShowEditar(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {notification.message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Tipos de Movimiento</h2>
        <div className="flex space-x-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            <FiChevronLeft className="inline mr-1" /> Volver
          </button>
          <button
            onClick={() => {
              setCrearKey(Date.now());
              setShowCrear(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
          >
            <FiPlus className="mr-2" />
            Crear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Flujo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">Cargando tipos de movimiento...</td>
              </tr>
            ) : tipos.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No hay tipos de movimiento registrados</td>
              </tr>
            ) : (
              tipos.map(row => (
                <TipoMovimientoRow
                  key={row.codigo}
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
          message={`¿Estás seguro de que deseas eliminar el tipo de movimiento "${itemToDelete.nombre}" (Código: ${itemToDelete.codigo})? Esta acción no se puede deshacer.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirmDelete(false);
            setItemToDelete(null);
          }}
          confirmText="Sí, eliminar"
          cancelText="No, cancelar"
        />
      )}
    </div>
  );
}