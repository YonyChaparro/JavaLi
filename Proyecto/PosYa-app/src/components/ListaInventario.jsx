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

  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [tiposMovimientoDisponibles, setTiposMovimientoDisponibles] = useState([]);

  useEffect(() => {
    // Fetch products for filter dropdown
    fetch('http://localhost:3000/api/productos')
      .then(res => res.json())
      .then(data => setProductosDisponibles(data))
      .catch(err => console.error('Error fetching products:', err));

    // Fetch movement types for filter dropdown
    fetch('http://localhost:3000/api/tipos-movimiento')
      .then(res => res.json())
      .then(data => setTiposMovimientoDisponibles(data))
      .catch(err => console.error('Error fetching movement types:', err));

  }, []);

  useEffect(() => {
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
        setError(err.message || 'Error al cargar los movimientos de inventario.');
        setMovimientos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, [filters]); // Re-fetch when filters change

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      producto: '',
      tipoMovimiento: '',
      fechaDesde: '',
      fechaHasta: '',
      tipoFlujo: ''
    });
  };

  const refreshMovimientos = () => {
    // Trigger useEffect by updating filters with current values to force re-fetch
    setFilters(prev => ({ ...prev }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Historial de Movimientos de Inventario</h2>
        <div className="flex space-x-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition shadow" // Updated to rounded-md and added shadow
          >
            <FiChevronLeft className="inline mr-1" /> Volver
          </button>
          <button
            onClick={onAddInventario}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center shadow" // Updated to rounded-md and added shadow
          >
            <FiPlus className="mr-2" />
            Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md shadow-sm"> {/* Updated to rounded-md and added shadow-sm */}
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <FiFilter className="mr-2" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="producto" className="block text-sm font-medium text-gray-700">Producto:</label>
            <select
              id="producto"
              name="producto"
              value={filters.producto}
              onChange={handleFilterChange}
              className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated styling
            >
              <option value="">Todos los productos</option>
              {productosDisponibles.map(p => (
                <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tipoMovimiento" className="block text-sm font-medium text-gray-700">Tipo de Movimiento:</label>
            <select
              id="tipoMovimiento"
              name="tipoMovimiento"
              value={filters.tipoMovimiento}
              onChange={handleFilterChange}
              className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated styling
            >
              <option value="">Todos los tipos</option>
              {tiposMovimientoDisponibles.map(tm => (
                <option key={tm.codigo_tipo_movimiento} value={tm.codigo_tipo_movimiento}>{tm.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tipoFlujo" className="block text-sm font-medium text-gray-700">Tipo de Flujo:</label>
            <select
              id="tipoFlujo"
              name="tipoFlujo"
              value={filters.tipoFlujo}
              onChange={handleFilterChange}
              className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated styling
            >
              <option value="">Todos los flujos</option>
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
            </select>
          </div>
          <div>
            <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700">Fecha Desde:</label>
            <input
              type="date"
              id="fechaDesde"
              name="fechaDesde"
              value={filters.fechaDesde}
              onChange={handleFilterChange}
              className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated styling
            />
          </div>
          <div>
            <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700">Fecha Hasta:</label>
            <input
              type="date"
              id="fechaHasta"
              name="fechaHasta"
              value={filters.fechaHasta}
              onChange={handleFilterChange}
              className="block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" // Updated styling
            />
          </div>
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition shadow" // Updated to rounded-md and added shadow
          >
            Limpiar Filtros
          </button>
          <button
            onClick={refreshMovimientos}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition shadow flex items-center" // Updated to rounded-md and added shadow
          >
            <FiRefreshCw className="mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Movimiento</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  Cargando movimientos...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-red-500">
                  {error}
                </td>
              </tr>
            ) : movimientos.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron movimientos
                </td>
              </tr>
            ) : (
              movimientos.map((movimiento) => (
                <tr key={movimiento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(movimiento.fecha).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movimiento.producto}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${movimiento.tipo_flujo === 'Entrada' ? 'text-green-600' : 'text-red-600'
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
    </div>
  );
};

export default ListaInventario;