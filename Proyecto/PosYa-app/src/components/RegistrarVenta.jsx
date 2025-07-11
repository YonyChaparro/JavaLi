import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiPlus, FiTrash2 } from 'react-icons/fi'; // Add FiPlus and FiTrash2 for consistency

const RegistrarVenta = ({ onClose, onBack, onVentaRegistrada }) => {
  // Estados
  const [venta, setVenta] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    hora: new Date().toTimeString().slice(0, 5),
    identificacion_cliente: '',
  });
  const [clientes, setClientes] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [vendedor, setVendedor] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [productos, setProductos] = useState([{
    nombre: '',
    cantidad: 1,
    precio_unitario: 0,
    IVA_unitario: 0
  }]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' }); // Add notification state

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // Efectos para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar productos
        const respProductos = await fetch('http://localhost:3000/api/productos');
        if (respProductos.ok) {
          setProductosDisponibles(await respProductos.json());
        } else {
          showNotification('Error al cargar productos.', 'error');
        }

        // Cargar clientes
        const respClientes = await fetch('http://localhost:3000/api/clientes');
        if (respClientes.ok) {
          setClientes(await respClientes.json());
        } else {
          showNotification('Error al cargar clientes.', 'error');
        }

        // Cargar vendedor
        const respVendedor = await fetch('http://localhost:3000/api/vendedor');
        if (respVendedor.ok) {
          setVendedor(await respVendedor.json());
        } else {
          showNotification('Error al cargar información del vendedor.', 'error');
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        showNotification('Error general al cargar datos.', 'error');
      }
    };

    fetchData();
  }, []);

  // Actualizar cliente seleccionado
  useEffect(() => {
    if (!venta.identificacion_cliente) {
      setClienteSeleccionado(null);
      return;
    }
    setClienteSeleccionado(
      clientes.find(c => c.numeroDocumento === venta.identificacion_cliente) || null
    );
  }, [venta.identificacion_cliente, clientes]);

  // Manejar cambios en la venta
  const handleVentaChange = e => {
    setVenta({ ...venta, [e.target.name]: e.target.value });
  };

  // Manejar cambios en productos
  const handleProductoChange = (idx, e) => {
    const { name, value } = e.target;
    const nuevosProductos = [...productos];

    if (name === 'nombre') {
      const producto = productosDisponibles.find(p => p.nombre === value);
      if (producto) {
        const precio = Number(producto.precioUnitario) || 0;
        const ivaPorcentaje = Number(producto.tipoIVA) || 0;
        const ivaValor = precio * (ivaPorcentaje / 100);

        nuevosProductos[idx] = {
          ...nuevosProductos[idx],
          nombre: value,
          precio_unitario: precio,
          IVA_unitario: ivaValor,
          cantidad: nuevosProductos[idx].cantidad || 1
        };
      } else {
        nuevosProductos[idx] = {
          ...nuevosProductos[idx],
          nombre: value,
          precio_unitario: 0,
          IVA_unitario: 0
        };
      }
    } else {
      nuevosProductos[idx] = {
        ...nuevosProductos[idx],
        [name]: name === 'cantidad' ? Math.max(1, parseInt(value) || 1) : value
      };
    }

    setProductos(nuevosProductos);
  };

  // Agregar producto
  const agregarProducto = () => {
    setProductos([...productos, {
      nombre: '',
      cantidad: 1,
      precio_unitario: 0,
      IVA_unitario: 0
    }]);
  };

  // Eliminar producto
  const eliminarProducto = idx => {
    if (productos.length <= 1) return;
    setProductos(productos.filter((_, i) => i !== idx));
  };

  // Calcular totales
  const calcularTotales = () => {
    return productos.reduce((acc, prod) => {
      const precio = parseFloat(prod.precio_unitario) || 0;
      const iva = parseFloat(prod.IVA_unitario) || 0;
      const cantidad = parseFloat(prod.cantidad) || 0;

      return {
        subtotal: acc.subtotal + (precio * cantidad),
        total: acc.total + ((precio + iva) * cantidad)
      };
    }, { subtotal: 0, total: 0 });
  };

  const { subtotal, total } = calcularTotales();

  // Registrar venta
  const handleSubmit = async e => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      if (!vendedor) throw new Error('No se encontró información del vendedor');

      // Verificar stock
      for (const prod of productos) {
        const prodInfo = productosDisponibles.find(p => p.nombre === prod.nombre);
        if (!prodInfo) throw new Error(`Producto no encontrado: ${prod.nombre}`);

        const resp = await fetch(`http://localhost:3000/api/existencias/${prodInfo.codigo}`);
        if (!resp.ok) throw new Error(`No se pudo verificar existencias de ${prod.nombre}`);

        const data = await resp.json();
        if (Number(data.existencias) < Number(prod.cantidad)) {
          throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${data.existencias}, solicitado: ${prod.cantidad}`);
        }
      }

      // Registrar
      const resp = await fetch('http://localhost:3000/api/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...venta,
          productos,
          subtotal,
          total,
          nombre_o_razon_social_vendedor: vendedor.nombre_o_razon_social,
          NIT_vendedor: vendedor.NIT,
          direccion_vendedor: vendedor.direccion,
          numero_de_contacto_vendedor: vendedor.numero_de_contacto,
          municipio_vendedor: vendedor.municipio,
          responsabilidad_fiscal_vendedor: vendedor.responsabilidad_fiscal
        })
      });

      if (!resp.ok) throw new Error('Error al registrar la venta');
      showNotification('Venta registrada correctamente.', 'success');
      if (onVentaRegistrada) onVentaRegistrada();
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-6xl mx-auto relative" style={{ maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto' }}>
      {notification.message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-[60] ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification.message}</div>
      )}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition" // Added transition
        aria-label="Cerrar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">Registrar Nueva Venta</h1> {/* Changed font-bold to font-semibold and added text-gray-800 */}

      <form onSubmit={handleSubmit}>
        {/* Datos generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              name="fecha"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" // Styled input
              value={venta.fecha}
              onChange={handleVentaChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
            <input
              type="time"
              name="hora"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" // Styled input
              value={venta.hora}
              onChange={handleVentaChange}
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              name="identificacion_cliente"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" // Styled select
              value={venta.identificacion_cliente}
              onChange={handleVentaChange}
              required
            >
              <option value="">Seleccione un cliente...</option>
              {clientes.map(cliente => (
                <option key={cliente.numeroDocumento} value={cliente.numeroDocumento}>
                  {cliente.razonSocial || `${cliente.primerNombre} ${cliente.primerApellido || ''}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info cliente seleccionado */}
        {clienteSeleccionado && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100"> {/* Added border */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Tipo Documento</label>
              <div className="font-medium text-gray-800"> {/* Added text-gray-800 */}
                {clienteSeleccionado.tipoDocumento || 'NIT'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Número Documento</label>
              <div className="font-medium text-gray-800"> {/* Added text-gray-800 */}
                {clienteSeleccionado.numeroDocumento}
              </div>
            </div>
          </div>
        )}

        {/* Info vendedor */}
        {vendedor && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100"> {/* Added border */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Vendedor</label>
              <div className="font-medium text-gray-800"> {/* Added text-gray-800 */}
                {vendedor.nombre_o_razon_social}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">NIT Vendedor</label>
              <div className="font-medium text-gray-800"> {/* Added text-gray-800 */}
                {vendedor.NIT}
              </div>
            </div>
          </div>
        )}

        {/* Tabla de productos */}
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Productos de la Venta</h2> {/* Changed text and added text-gray-800 */}
        <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg" style={{ maxHeight: '260px', overflowY: 'auto' }}> {/* Added border and rounded-lg */}
          <table className="min-w-full divide-y divide-gray-200"> {/* Added divide-y */}
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th> {/* Changed padding and font */}
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P. Unitario</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">IVA Unitario</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200"> {/* Added divide-y */}
              {productos.map((prod, idx) => {
                const precio = parseFloat(prod.precio_unitario) || 0;
                const iva = parseFloat(prod.IVA_unitario) || 0;
                const cantidad = parseFloat(prod.cantidad) || 0;
                const subtotalProd = (precio * cantidad).toFixed(2);
                const totalProd = ((precio + iva) * cantidad).toFixed(2);

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors"> {/* Added transition-colors */}
                    <td className="py-2 px-4 whitespace-nowrap"> {/* Changed padding and added whitespace-nowrap */}
                      <select
                        name="nombre"
                        className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" // Styled select and added text-sm
                        value={prod.nombre}
                        onChange={e => handleProductoChange(idx, e)}
                        required
                      >
                        <option value="">Seleccione...</option>
                        {productosDisponibles
                          .filter(p =>
                            prod.nombre === p.nombre ||
                            !productos.some((pSel, iSel) => pSel.nombre === p.nombre && iSel !== idx)
                          )
                          .map(p => (
                            <option key={p.codigo} value={p.nombre}>
                              {p.nombre}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap text-center"> {/* Changed padding and added whitespace-nowrap */}
                      <input
                        name="cantidad"
                        type="number"
                        min="1"
                        className="border border-gray-300 rounded px-2 py-1 w-20 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" // Styled input and added text-sm
                        value={prod.cantidad}
                        onChange={e => handleProductoChange(idx, e)}
                        required
                      />
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap text-right text-sm text-gray-700">${precio.toFixed(2)}</td> {/* Changed padding and added text-sm, text-gray-700 */}
                    <td className="py-2 px-4 whitespace-nowrap text-right text-sm text-gray-700">${iva.toFixed(2)}</td> {/* Changed padding and added text-sm, text-gray-700 */}
                    <td className="py-2 px-4 whitespace-nowrap text-right font-medium text-sm text-gray-800">${subtotalProd}</td> {/* Changed padding and added text-sm, text-gray-800 */}
                    <td className="py-2 px-4 whitespace-nowrap text-right font-bold text-green-600 text-sm">${totalProd}</td> {/* Changed padding and added text-sm */}
                    <td className="py-2 px-4 whitespace-nowrap text-center"> {/* Changed padding and added whitespace-nowrap */}
                      <button
                        type="button"
                        className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full w-7 h-7 flex items-center justify-center transition-colors" // Smaller button, added transition
                        onClick={() => eliminarProducto(idx)}
                        disabled={productos.length === 1}
                        title="Eliminar producto"
                      >
                        <FiTrash2 className="w-4 h-4" /> {/* Used FiTrash2 icon */}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Controles */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center mb-4 md:mb-0 shadow" // Unificado con ListaClientes
            onClick={agregarProducto}
          >
            <FiPlus className="mr-2" /> {/* Used FiPlus icon */}
            Agregar Producto
          </button>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 md:mb-0 text-sm"> {/* Added text-sm */}
              {error}
            </div>
          )}
        </div>

        {/* Resumen de totales */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 mt-6"> {/* Added mt-6 for spacing */}
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-blue-800">Resumen de la Venta</div>
            <div className="flex space-x-8">
              <div className="text-right">
                <div className="text-sm text-blue-600">Subtotal</div>
                <div className="text-xl font-bold text-gray-800">${subtotal.toFixed(2)}</div> {/* Added text-gray-800 */}
              </div>
              <div className="text-right">
                <div className="text-sm text-green-600">Total</div>
                <div className="text-2xl font-bold text-green-600">${total.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onBack || onClose}
            className="flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition shadow" // Unificado con ListaClientes
          >
            <FiChevronLeft className="mr-2" />
            Volver
          </button>

          <button
            type="submit"
            disabled={guardando}
            className={`flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow transition ${guardando ? 'opacity-75 cursor-not-allowed' : ''
              }`} // Unificado con ListaClientes
          >
            {guardando ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              'Registrar Venta'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrarVenta;