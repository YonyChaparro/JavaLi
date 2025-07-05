import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ListaProductos = ({ 
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onBack
}) => {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 25;
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar productos desde la API
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch('/api/productos');
        if (!response.ok) {
          throw new Error('Error al cargar los productos');
        }
        const data = await response.json();
        setProductos(data.map(p => ({
          ...p,
          id: p.codigo // Usamos el código como ID único
        })));
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, []);

  // Manejar eliminación de producto
  const handleEliminarProducto = async (productoCodigo) => {
    if (window.confirm('¿Está seguro que desea eliminar este producto?')) {
      try {
        const response = await fetch(`/api/productos/${productoCodigo}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el producto');
        }

        setProductos(productos.filter(p => p.codigo !== productoCodigo));
        if (productoSeleccionado?.codigo === productoCodigo) {
          setProductoSeleccionado(null);
        }

        if (onDeleteProduct) {
          onDeleteProduct(productoCodigo);
        }
      } catch (err) {
        console.error('Error al eliminar:', err);
        setError(err.message);
      }
    }
  };

  const productosFiltrados = productos.filter(producto => {
    const termino = busqueda.toLowerCase();
    return (
      producto.nombre.toLowerCase().includes(termino) ||
      producto.codigo.toLowerCase().includes(termino)
    );
  });

  const productosOrdenados = [...productosFiltrados].sort((a, b) => 
    a.nombre.localeCompare(b.nombre)
  );

  const indiceUltimoProducto = paginaActual * productosPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;
  const productosPaginaActual = productosOrdenados.slice(indicePrimerProducto, indiceUltimoProducto);
  const totalPaginas = Math.ceil(productosOrdenados.length / productosPorPagina);

  const formatearPrecio = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(valor);
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
        >
          <FiChevronLeft className="inline mr-1" /> Volver
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Productos Registrados</h2>
        <div className="flex space-x-2">
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            <FiChevronLeft className="inline mr-1" /> Volver
          </button>
          <button 
            onClick={onAddProduct}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
          >
            <FiPlus className="mr-2" />
            Agregar Producto
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            className="pl-10 pr-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productosPaginaActual.map(producto => (
              <tr 
                key={producto.codigo} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setProductoSeleccionado(producto)}
              >
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{producto.codigo}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{producto.nombre}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{formatearPrecio(producto.precioUnitario)}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{producto.tipoIVA}%</div></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProduct(producto);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    title="Editar producto"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarProducto(producto.codigo);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar producto"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{indicePrimerProducto + 1}</span> a{' '}
            <span className="font-medium">{Math.min(indiceUltimoProducto, productosOrdenados.length)}</span> de{' '}
            <span className="font-medium">{productosOrdenados.length}</span> productos
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
              className={`px-3 py-1 rounded-md ${paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <FiChevronLeft />
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
              <button
                key={numero}
                onClick={() => setPaginaActual(numero)}
                className={`px-3 py-1 rounded-md ${paginaActual === numero ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {numero}
              </button>
            ))}
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

      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">Detalle del Producto</h3>
                <button
                  onClick={() => setProductoSeleccionado(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Código</h4>
                  <p className="mt-1 text-sm text-gray-900">{productoSeleccionado.codigo}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
                  <p className="mt-1 text-sm text-gray-900">{productoSeleccionado.nombre}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Estado</h4>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{productoSeleccionado.estado}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">IVA</h4>
                  <p className="mt-1 text-sm text-gray-900">{productoSeleccionado.tipoIVA}%</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Precio Unitario</h4>
                  <p className="mt-1 text-sm text-gray-900">{formatearPrecio(productoSeleccionado.precioUnitario)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Costo Unitario</h4>
                  <p className="mt-1 text-sm text-gray-900">{formatearPrecio(productoSeleccionado.costoUnitario)}</p>
                </div>

                {productoSeleccionado.descripcion && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
                    <p className="mt-1 text-sm text-gray-900">{productoSeleccionado.descripcion}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    onEditProduct(productoSeleccionado);
                    setProductoSeleccionado(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  <FiEdit2 className="inline mr-2" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleEliminarProducto(productoSeleccionado.codigo);
                    setProductoSeleccionado(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  <FiTrash2 className="inline mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaProductos;
