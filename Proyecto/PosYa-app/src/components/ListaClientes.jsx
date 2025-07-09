import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import FormularioCliente from './FormularioCliente';
import DetalleCliente from './DetalleCliente';

function ConfirmationModal({ title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
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

const ListaClientes = ({ 
  onAddClient, 
  onEditClient, 
  onDeleteClient,
  onBack 
}) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const clientesPorPagina = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/clientes')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setClientes(data))
      .catch(error => {
        console.error("Error fetching clients:", error);
        setError('No se pudieron cargar los clientes. Intente de nuevo.');
        setClientes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const handleEliminarCliente = (cliente) => {
    setItemToDelete(cliente);
    setShowConfirmDelete(true);
  };

  const confirmDeleteClient = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/clientes/${itemToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error al eliminar el cliente.' }));
        throw new Error(errorData.error || 'Error desconocido al eliminar.');
      }
      showNotification('Cliente eliminado correctamente.', 'success');
      setClientes(prev => prev.filter(c => c.id !== itemToDelete.id));
      onDeleteClient && onDeleteClient(itemToDelete.id);
    } catch (e) {
      console.error("Error deleting client:", e);
      showNotification(e.message, 'error');
    } finally {
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const termino = (busqueda || '').toLowerCase();
    if (!cliente || !termino) return true;
    if (cliente.tipo === 'natural') {
      const nombreCompleto = `${cliente.primerNombre || ''} ${cliente.primerApellido || ''}`.toLowerCase();
      return nombreCompleto.includes(termino) || (cliente.numeroDocumento || '').toLowerCase().includes(termino);
    }
    return (cliente.razonSocial || '').toLowerCase().includes(termino) || (cliente.numeroDocumento || '').toLowerCase().includes(termino);
  });

  const indiceUltimoCliente = paginaActual * clientesPorPagina;
  const indicePrimerCliente = indiceUltimoCliente - clientesPorPagina;
  const clientesPaginaActual = clientesFiltrados.slice(indicePrimerCliente, indiceUltimoCliente);
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

  const formatearNombre = (cliente) => cliente.tipo === 'natural' 
    ? `${cliente.primerNombre || ''} ${cliente.primerApellido || ''}`.trim() || '-' 
    : cliente.razonSocial || '-';

  const formatearDocumento = (cliente) => `${cliente.tipoDocumento || ''}: ${cliente.numeroDocumento || ''}`.trim();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {notification.message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-[60] ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Clientes Registrados</h2>
        <div className="flex space-x-2">
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            <FiChevronLeft className="inline mr-1" /> Volver
          </button>
          <button 
            onClick={() => setMostrarFormulario(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
          >
            <FiPlus className="mr-2" />
            Crear Cliente
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            className="pl-10 pr-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre / Razón Social</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">correo electronico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  Cargando clientes...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-red-500">
                  {error}
                </td>
              </tr>
            ) : clientesPaginaActual.length > 0 ? (
              clientesPaginaActual.map((cliente, idx) => (
                <tr 
                  key={cliente.id || cliente.numeroDocumento || idx} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setClienteDetalle(cliente);
                    setMostrarDetalle(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    15/06/2025 20:53:55
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatearDocumento(cliente)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearNombre(cliente)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.correo_electronico}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.numero_telefonico || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setClienteSeleccionado(cliente);
                        setMostrarFormulario(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Editar cliente"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleEliminarCliente(cliente);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar cliente"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  {busqueda ? 'No se encontraron coincidencias' : 'No hay clientes registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{indicePrimerCliente + 1}</span> a{' '}
            <span className="font-medium">{Math.min(indiceUltimoCliente, clientesFiltrados.length)}</span> de{' '}
            <span className="font-medium">{clientesFiltrados.length}</span> clientes
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
              className={`px-3 py-1 rounded-md ${paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <FiChevronLeft />
            </button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              let pagina;
              if (totalPaginas <= 5) {
                pagina = i + 1;
              } else if (paginaActual <= 3) {
                pagina = i + 1;
              } else if (paginaActual >= totalPaginas - 2) {
                pagina = totalPaginas - 4 + i;
              } else {
                pagina = paginaActual - 2 + i;
              }
              
              return (
                <button
                  key={pagina}
                  onClick={() => setPaginaActual(pagina)}
                  className={`px-3 py-1 rounded-md ${paginaActual === pagina ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {pagina}
                </button>
              );
            })}
            <button
              onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className={`px-3 py-1 rounded-md ${paginaActual === totalPaginas ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <FormularioCliente
            cliente={clienteSeleccionado}
            onClose = {() => {
              setMostrarFormulario(false); 
              setClienteSeleccionado(null);
              onBack && onBack();
            }}
            onBack={() => {
              setMostrarFormulario(false);
              setClienteSeleccionado(null);
            }}
            onSave={async (datosFormulario) => {
              const esEdicion = !!clienteSeleccionado;
              const url = esEdicion ? `/api/clientes/${clienteSeleccionado.id}` : '/api/clientes';
              const method = esEdicion ? 'PUT' : 'POST';

              try {
                const res = await fetch(url, {
                  method: method,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(datosFormulario)
                });
                if (!res.ok) {
                  const errorData = await res.json();
                  throw new Error(errorData.error || 'Error al guardar el cliente');
                }
                const clienteGuardado = await res.json();

                if (esEdicion) {
                  setClientes(prev => prev.map(c => c.id === clienteGuardado.id ? clienteGuardado : c));
                  onEditClient && onEditClient(clienteGuardado);
                } else {
                  setClientes(prev => [clienteGuardado, ...prev]);
                  onAddClient && onAddClient(clienteGuardado);
                }
              } catch (e) {
                showNotification(`No se pudo guardar el cliente: ${e.message}`, 'error');
              }
              setMostrarFormulario(false);
              setClienteSeleccionado(null);
            }}
          />
        </div>
      )}

      {showConfirmDelete && itemToDelete && (
        <ConfirmationModal
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que deseas eliminar al cliente "${formatearNombre(itemToDelete)}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmDeleteClient}
          onCancel={() => {
            setShowConfirmDelete(false);
            setItemToDelete(null);
          }}
          confirmText="Sí, eliminar"
          cancelText="No, cancelar"
        />
      )}

      {mostrarDetalle && clienteDetalle && (
        <DetalleCliente
          cliente={clienteDetalle}
          onClose={() => {
            setMostrarDetalle(false);
            setClienteDetalle(null);
          }}
          onEdit={(cliente) => {
            setClienteSeleccionado(cliente);
            setMostrarDetalle(false);
            setMostrarFormulario(true);
          }}
          onDelete={(cliente) => {
            setMostrarDetalle(false);
            handleEliminarCliente(cliente);
          }}
        />
      )}
    </div>
  );
};

export default ListaClientes;