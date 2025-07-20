import React, { useEffect, useState } from 'react';
import VisualizacionVenta from './VisualizacionVenta';
import RegistrarVenta from './RegistrarVenta';
import { FiFilter, FiRefreshCw, FiSearch, FiChevronLeft, FiPlus, FiTrash2 } from 'react-icons/fi';

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

const HistorialVentas = ({ onClose }) => {
  const [ventas, setVentas] = useState([]);
  const [error, setError] = useState(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [registrandoVenta, setRegistrandoVenta] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const ventasPorPagina = 10;
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [numeroFiltro, setNumeroFiltro] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const handleShowConfirmDelete = (venta) => {
    setItemToDelete(venta);
    setShowConfirmDelete(true);
  };

  const confirmDeleteVenta = async () => {
    if (!itemToDelete) return;
    try {
      const resp = await fetch(`http://localhost:3000/api/venta/${encodeURIComponent(itemToDelete.numero)}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('No se pudo eliminar la venta');
      setVentas(ventas.filter(v => v.numero !== itemToDelete.numero));
      showNotification('Venta eliminada correctamente.', 'success');
    } catch (err) {
      setError('No se pudo eliminar la venta.');
      showNotification('No se pudo eliminar la venta.', 'error');
    } finally {
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/historial_ventas');
        if (!response.ok) throw new Error('Error al obtener ventas');
        const data = await response.json();
        setVentas(data);
      } catch (err) {
        setError('No se pudieron cargar las ventas.');
      }
    };
    fetchVentas();
  }, []);

  // Filtro y paginación
  const ventasFiltradas = ventas.filter(v => {
    // Filtro por número de venta
    const terminoNumero = (numeroFiltro || '').toLowerCase();
    const coincideNumero = v.numero.toString().includes(terminoNumero);
    // Filtro por cliente
    const terminoCliente = (clienteFiltro || '').toLowerCase();
    const coincideCliente =
      (v.cliente && v.cliente.toLowerCase().includes(terminoCliente)) ||
      (v.razon_social_cliente && v.razon_social_cliente.toLowerCase().includes(terminoCliente));
    // Filtro de rango de fechas
    let coincideFecha = true;
    if (fechaDesde) {
      coincideFecha = coincideFecha && v.fecha >= fechaDesde;
    }
    if (fechaHasta) {
      coincideFecha = coincideFecha && v.fecha <= fechaHasta;
    }
    return coincideNumero && coincideCliente && coincideFecha;
  });
  const indiceUltimaVenta = paginaActual * ventasPorPagina;
  const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina;
  const ventasPaginaActual = ventasFiltradas.slice(indicePrimeraVenta, indiceUltimaVenta);
  const totalPaginas = Math.ceil(ventasFiltradas.length / ventasPorPagina);

  const handleNuevaVenta = () => {
    setRegistrandoVenta(true);
  };

  const handleVentaRegistrada = () => {
    setRegistrandoVenta(false);
    (async () => {
      try {
        const response = await fetch('http://localhost:3000/api/historial_ventas');
        if (!response.ok) throw new Error('Error al obtener ventas');
        const data = await response.json();
        setVentas(data);
      } catch (err) {
        setError('No se pudieron cargar las ventas.');
      }
    })();
  };

  return (
    <>
      {/* Mostrar RegistrarVenta solo si registrandoVenta es true */}
      {registrandoVenta ? (
        <RegistrarVenta
          onBack={() => setRegistrandoVenta(false)}
          onVentaRegistrada={handleVentaRegistrada}
          onClose={() => setRegistrandoVenta(false)}
        />
      ) : ventaSeleccionada ? (
        <VisualizacionVenta
          codigo={ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
          onVentaEliminada={(num) => {
            setVentas(ventas => ventas.filter(v => v.numero !== num));
            setVentaSeleccionada(null);
            setNotification({ message: 'Venta eliminada correctamente.', type: 'success' });
            setTimeout(() => setNotification({ message: '', type: '' }), 3000);
          }}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {notification.message && (
            <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-[60] ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification.message}</div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Historial de Ventas</h2>
            <div className="flex space-x-2">
              {onClose && (
                <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition flex items-center shadow">
                  <FiChevronLeft className="mr-2" /> Volver
                </button>
              )}
              <button id="nueva-venta" onClick={handleNuevaVenta} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center shadow">
                <FiPlus className="mr-2" /> Registrar nueva venta
              </button>
            </div>
          </div>
          {/* Filtros - Número de venta y cliente por separado */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center mb-4">
              <FiFilter className="text-gray-500 mr-2" />
              <h3 className="text-md font-medium text-gray-700">Filtrar Ventas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Venta</label>
                <input
                  type="text"
                  name="numeroFiltro"
                  value={numeroFiltro}
                  onChange={e => {
                    setNumeroFiltro(e.target.value);
                    setPaginaActual(1);
                  }}
                  placeholder="Buscar por número"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input
                  type="text"
                  name="clienteFiltro"
                  value={clienteFiltro}
                  onChange={e => {
                    setClienteFiltro(e.target.value);
                    setPaginaActual(1);
                  }}
                  placeholder="Buscar por cliente"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => {
                    setFechaDesde(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => {
                    setFechaHasta(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setNumeroFiltro('');
                  setClienteFiltro('');
                  setFechaDesde('');
                  setFechaHasta('');
                  setPaginaActual(1);
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center shadow"
              >
                <FiRefreshCw className="mr-1" /> Limpiar filtros
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {error ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-red-500">{error}</td>
                  </tr>
                ) : ventasPaginaActual.length > 0 ? (
                  ventasPaginaActual.map((venta) => {
                    let clienteMostrar = '—';
                    if (venta.razon_social_cliente && venta.razon_social_cliente.trim() !== '') {
                      clienteMostrar = venta.razon_social_cliente;
                    } else if (venta.cliente && venta.cliente.trim() !== '') {
                      clienteMostrar = venta.cliente;
                    }
                    return (
                      <tr
                        key={venta.numero}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setVentaSeleccionada(venta.numero)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.numero}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.fecha}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.hora}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{clienteMostrar}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.total}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-red-600 hover:text-red-900" title="Eliminar venta" onClick={e => { e.stopPropagation(); handleShowConfirmDelete(venta); }}>
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      {busqueda ? 'No se encontraron coincidencias' : 'No hay ventas registradas'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indicePrimeraVenta + 1}</span> a{' '}
                <span className="font-medium">{Math.min(indiceUltimaVenta, ventasFiltradas.length)}</span> de{' '}
                <span className="font-medium">{ventasFiltradas.length}</span> ventas
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  className={`px-3 py-1 rounded-md ${paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  &lt;
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
                  &gt;
                </button>
              </div>
            </div>
          )}
          {showConfirmDelete && itemToDelete && (
            <ConfirmationModal
              title="Confirmar Eliminación"
              message={`¿Estás seguro de que deseas eliminar la venta N° ${itemToDelete.numero}? Esta acción no se puede deshacer.`}
              onConfirm={confirmDeleteVenta}
              onCancel={() => {
                setShowConfirmDelete(false);
                setItemToDelete(null);
              }}
              confirmText="Sí, eliminar"
              cancelText="No, cancelar"
            />
          )}
        </div>
      )}
    </>
  );
};

export default HistorialVentas;
