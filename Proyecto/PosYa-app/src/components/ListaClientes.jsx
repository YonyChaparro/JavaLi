import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import FormularioCliente from './FormularioCliente';
import DetalleCliente from './DetalleCliente';

function ConfirmationModal({ title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
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

  // Cargar clientes desde la base de datos al abrir la lista
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/clientes')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
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
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000);
  };

  const handleEliminarCliente = (cliente) => {
    setItemToDelete(cliente);
    setShowConfirmDelete(true);
  };

  const confirmDeleteClient = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/clientes/${itemToDelete.id}`, {
        method: 'DELETE',
      });

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

  // Filtrar clientes según búsqueda
  const clientesFiltrados = clientes.filter(cliente => {
    if (!cliente) return false;
    const termino = (busqueda || '').toLowerCase();
    if (!termino) return true; // Si no hay búsqueda, mostrar todos
    if (cliente.tipo === 'natural') {
      const nombreCompleto = `${cliente.primerNombre || ''} ${cliente.primerApellido || ''}`.toLowerCase();
      return (
        nombreCompleto.includes(termino) ||
        (cliente.numeroDocumento || '').toLowerCase().includes(termino)
      );
    } else {
      return (
        (cliente.razonSocial || '').toLowerCase().includes(termino) ||
        (cliente.numeroDocumento || '').toLowerCase().includes(termino)
      );
    }
  });

  // Paginación
  const indiceUltimoCliente = paginaActual * clientesPorPagina;
  const indicePrimerCliente = indiceUltimoCliente - clientesPorPagina;
  const clientesPaginaActual = clientesFiltrados.slice(indicePrimerCliente, indiceUltimoCliente);
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

  const formatearNombre = (cliente) => {
    return cliente.tipo === 'natural' 
      ? `${cliente.primerNombre || ''} ${cliente.primerApellido || ''}`.trim() || '-' 
      : cliente.razonSocial || '-';
  };

  const formatearDocumento = (cliente) => {
    return `${cliente.tipoDocumento || ''}: ${cliente.numeroDocumento || ''}`.trim();
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 relative">
      {/* Contenedor de Notificación */}
      {notification.message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-[60] ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}
      {/* Barra de herramientas */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <div className="flex space-x-2">
          <button 
            onClick={() => setMostrarFormulario(true)}
            className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            <FiPlus className="mr-1" /> Crear
          </button>
          <button 
            onClick={onBack}
            className="flex items-center px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
          >
            <FiChevronLeft className="mr-1" /> Volver
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar (Ctrl+F)"
            className="pl-10 pr-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Registro
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documento
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre / Razón Social
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                  Cargando clientes...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center text-sm text-red-500">
                  {error}
                </td>
              </tr>
            )
            : clientesPaginaActual.length > 0 ? (
              clientesPaginaActual.map((cliente, idx) => (
                <tr 
                  key={cliente.id || cliente.numeroDocumento || idx} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setClienteDetalle(cliente);
                    setMostrarDetalle(true);
                  }}
                >
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    15/06/2025 20:53:55
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatearDocumento(cliente)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {formatearNombre(cliente)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {cliente.email}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {cliente.telefono || '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setClienteSeleccionado(cliente);
                        setMostrarFormulario(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Editar cliente"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleEliminarCliente(cliente);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar cliente"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                  {busqueda ? 'No se encontraron coincidencias' : 'No hay clientes registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{indicePrimerCliente + 1}</span> a{' '}
            <span className="font-medium">
              {Math.min(indiceUltimoCliente, clientesFiltrados.length)}
            </span>{' '}
            de <span className="font-medium">{clientesFiltrados.length}</span> clientes
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
              className={`p-1 rounded ${paginaActual === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FiChevronLeft size={18} />
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
                  className={`px-2 py-1 text-sm rounded ${paginaActual === pagina ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {pagina}
                </button>
              );
            })}
            
            <button
              onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className={`p-1 rounded ${paginaActual === totalPaginas ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Formulario Cliente (Modal) */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <FormularioCliente
            cliente={clienteSeleccionado}
            onCancel={() => {
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

      {/* Modal de confirmación de eliminación */}
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

      {/* Detalle Cliente (Modal) */}
      {mostrarDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <DetalleCliente
            cliente={clienteDetalle}
            onClose={() => {
              setMostrarDetalle(false);
              setClienteDetalle(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ListaClientes;
