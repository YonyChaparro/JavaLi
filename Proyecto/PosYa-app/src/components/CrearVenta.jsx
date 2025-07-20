import { useState, useEffect } from 'react';

const FormularioVenta = ({ onClose }) => {
  const [clientes, setClientes] = useState([]);

  const [productosDisponibles, setProductosDisponibles] = useState([]);

  const [productos, setProductos] = useState([
    { id: 1, producto: null, precio: 0, cantidad: 1, monto: 0 },
  ]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarClientes, setMostrarClientes] = useState(false);
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [productoEditando, setProductoEditando] = useState(null);

  // Filtrar clientes según búsqueda
  useEffect(() => {
    if (busquedaCliente.length > 0) {
      const sugerencias = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(busquedaCliente.toLowerCase())
      );
      setSugerenciasClientes(sugerencias);
    } else {
      setSugerenciasClientes([]);
    }
  }, [busquedaCliente, clientes]);

  // Filtrar productos según búsqueda
  useEffect(() => {
    if (busquedaProducto.length > 0) {
      const sugerencias = productosDisponibles.filter(producto =>
        producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
      );
      setSugerenciasProductos(sugerencias);
    } else {
      setSugerenciasProductos([]);
    }
  }, [busquedaProducto, productosDisponibles]);

  // Calcular total general
  const totalGeneral = productos.reduce((sum, item) => sum + item.monto, 0);

  // Manejar cambios en cantidades
  const handleCantidadChange = (id, cantidad) => {
    const updatedProducts = productos.map((producto) => {
      if (producto.id === id) {
        const nuevaCantidad = Math.max(1, cantidad);
        const nuevoMonto = producto.precio * nuevaCantidad;
        return { ...producto, cantidad: nuevaCantidad, monto: nuevoMonto };
      }
      return producto;
    });
    setProductos(updatedProducts);
  };

  // Seleccionar cliente
  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(cliente.nombre);
    setMostrarClientes(false);
  };

  // Seleccionar producto
  const seleccionarProducto = (producto) => {
    const updatedProducts = productos.map((item) => {
      if (item.id === productoEditando) {
        return {
          ...item,
          producto: producto.nombre,
          precio: producto.precio,
          monto: producto.precio * item.cantidad
        };
      }
      return item;
    });
    setProductos(updatedProducts);
    setBusquedaProducto('');
    setMostrarProductos(false);
  };

  // Agregar nuevo producto
  const agregarProducto = () => {
    const nuevoProducto = {
      id: productos.length + 1,
      producto: null,
      precio: 0,
      cantidad: 1,
      monto: 0
    };
    setProductos([...productos, nuevoProducto]);
  };

  // Eliminar producto
  const eliminarProducto = (id) => {
    if (productos.length > 1) {
      setProductos(productos.filter(producto => producto.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Nueva Venta</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
        >
          Cerrar
        </button>
      </div>

      {/* Selección de cliente */}
      <div className="mb-6 relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <div className="relative">
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={busquedaCliente}
            onChange={(e) => {
              setBusquedaCliente(e.target.value);
              setMostrarClientes(true);
            }}
            onFocus={() => setMostrarClientes(true)}
            onBlur={() => setTimeout(() => setMostrarClientes(false), 200)}
            placeholder="Buscar cliente..."
          />
          {mostrarClientes && sugerenciasClientes.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {sugerenciasClientes.map((cliente) => (
                <li
                  key={cliente.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => seleccionarCliente(cliente)}
                >
                  {cliente.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productos.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap relative">
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={item.producto || ''}
                    onChange={(e) => {
                      const updatedProducts = productos.map(p =>
                        p.id === item.id ? { ...p, producto: e.target.value } : p
                      );
                      setProductos(updatedProducts);
                    }}
                    onFocus={() => {
                      setBusquedaProducto(item.producto || '');
                      setProductoEditando(item.id);
                      setMostrarProductos(true);
                    }}
                    onBlur={() => setTimeout(() => setMostrarProductos(false), 200)}
                    placeholder="Buscar producto..."
                  />
                  {mostrarProductos && productoEditando === item.id && sugerenciasProductos.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {sugerenciasProductos.map((producto) => (
                        <li
                          key={producto.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => seleccionarProducto(producto)}
                        >
                          {producto.nombre} - ${producto.precio}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${item.precio.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="1"
                    className="w-20 p-2 border border-gray-300 rounded-md"
                    value={item.cantidad}
                    onChange={(e) => handleCantidadChange(item.id, parseInt(e.target.value) || 1)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${item.monto.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {productos.length > 1 && (
                    <button
                      onClick={() => eliminarProducto(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={agregarProducto}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          + Agregar Producto
        </button>
      </div>

      {/* Total general */}
      <div className="flex justify-end mt-4">
        <div className="bg-gray-100 p-4 rounded-md w-64">
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${totalGeneral.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Botones de facturación */}
      <div className="flex justify-end mt-6 space-x-4">
        <button
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Factura Ordinaria
        </button>
        <button
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Factura Electrónica
        </button>
      </div>
    </div>
  );
};

export default FormularioVenta;
