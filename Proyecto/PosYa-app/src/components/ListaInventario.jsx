import { useState, useEffect } from 'react';
import { FiChevronLeft, FiPlus, FiFilter, FiRefreshCw } from 'react-icons/fi';

const ListaInventario = ({ onAddInventario, onBack }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    producto: '',
    tipoMovimiento: '',
    fechaDesde: '',
    fechaHasta: '',
    tipoFlujo: ''
  });

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        ...(filters.producto && { producto: filters.producto }),
        ...(filters.tipoMovimiento && { tipoMovimiento: filters.tipoMovimiento }),
        ...(filters.tipoFlujo && { tipoFlujo: filters.tipoFlujo }),
        ...(filters.fechaDesde && { fechaInicio: filters.fechaDesde }),
        ...(filters.fechaHasta && { fechaFin: filters.fechaHasta })
      });

      const response = await fetch(`/api/movimientos-inventario?${params}`);
      
      if (!response.ok) throw new Error('Error al cargar los movimientos');
      
      const data = await response.json();
      setMovimientos(data.data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      producto: '',
      tipoMovimiento: '',
      fechaDesde: '',
      fechaHasta: '',
      tipoFlujo: ''
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Movimientos de Inventario</h2>
        <div className="flex space-x-2">
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            <FiChevronLeft className="inline mr-1" /> Volver
          </button>
          <button 
            onClick={onAddInventario}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
          >
            <FiPlus className="mr-2" />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Filtros - Versión simplificada como en la imagen */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-center mb-4">
          <FiFilter className="text-gray-500 mr-2" />
          <h3 className="text-md font-medium text-gray-700">Filtrar Movimientos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <input
              type="text"
              name="producto"
              value={filters.producto}
              onChange={handleFilterChange}
              placeholder="Buscar por producto"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
            <input
              type="text"
              name="tipoMovimiento"
              value={filters.tipoMovimiento}
              onChange={handleFilterChange}
              placeholder="Buscar por tipo"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Flujo</label>
            <select
              name="tipoFlujo"
              value={filters.tipoFlujo}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              name="fechaDesde"
              value={filters.fechaDesde}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              name="fechaHasta"
              value={filters.fechaHasta}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
          >
            <FiRefreshCw className="mr-1" /> Limpiar
          </button>
        </div>
      </div>

      {/* Estado de carga y errores */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p>{error}</p>
          <button 
            onClick={fetchMovimientos}
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla de movimientos */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Movimiento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron movimientos
                  </td>
                </tr>
              ) : (
                movimientos.map((movimiento) => (
                  <tr key={movimiento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movimiento.fecha).toISOString().slice(0, 10)} {/* Formato YYYY-MM-DD */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movimiento.producto}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      movimiento.tipo_flujo === 'Entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movimiento.tipo_flujo === 'Entrada' ? '+' : '-'}{movimiento.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movimiento.tipo_movimiento}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListaInventario;