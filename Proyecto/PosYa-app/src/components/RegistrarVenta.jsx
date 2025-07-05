import React, { useState } from 'react';
// Componente para registrar una nueva venta y sus productos
const RegistrarVenta = ({ onCancel, onVentaRegistrada }) => {
  // Estado para los datos de la venta
  // Función para obtener fecha y hora actual en formato adecuado
  function getFechaActual() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
  function getHoraActual() {
    const d = new Date();
    return d.toTimeString().slice(0, 5);
  }
  const [venta, setVenta] = useState({
    fecha: getFechaActual(),
    hora: getHoraActual(),
    identificacion_cliente: '',
  });
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  // Estado para productos disponibles
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  // Obtener lista de productos al montar
  React.useEffect(() => {
    const fetchProductos = async () => {
      try {
        const resp = await fetch('http://localhost:3000/api/productos');
        if (!resp.ok) throw new Error('No se pudieron obtener los productos');
        const data = await resp.json();
        setProductosDisponibles(data);
      } catch (err) {
        setProductosDisponibles([]);
      }
    };
    fetchProductos();
  }, []);
  // Obtener lista de clientes al montar
  React.useEffect(() => {
    const fetchClientes = async () => {
      try {
        const resp = await fetch('http://localhost:3000/api/clientes');
        if (!resp.ok) throw new Error('No se pudieron obtener los clientes');
        const data = await resp.json();
        setClientes(data);
      } catch (err) {
        setClientes([]);
      }
    };
    fetchClientes();
  }, []);

  // Actualizar clienteSeleccionado cuando cambia identificacion_cliente
  React.useEffect(() => {
    if (!venta.identificacion_cliente) {
      setClienteSeleccionado(null);
      return;
    }
    const cli = clientes.find(c => c.numeroDocumento === venta.identificacion_cliente);
    setClienteSeleccionado(cli || null);
  }, [venta.identificacion_cliente, clientes]);
  const [vendedor, setVendedor] = useState(null);
  // Obtener datos del vendedor único al montar
  React.useEffect(() => {
    const fetchVendedor = async () => {
      try {
        const resp = await fetch('http://localhost:3000/api/vendedor');
        if (!resp.ok) throw new Error('No se pudo obtener el vendedor');
        const data = await resp.json();
        setVendedor(data);
      } catch (err) {
        setVendedor(null);
      }
    };
    fetchVendedor();
  }, []);
  // Estado para los productos de la venta
  const [productos, setProductos] = useState([
    { nombre: '', cantidad: 1, precio_unitario: 0, IVA_unitario: 0 }
  ]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  
  // Manejar cambios en los campos de la venta
  const handleVentaChange = e => {
    setVenta({ ...venta, [e.target.name]: e.target.value });
  };

  // Manejar cambios en los productos
  const handleProductoChange = (idx, e) => {
    const { name, value } = e.target;
    let nuevos = productos.map((p, i) => {
      if (i !== idx) return p;
      if (name === 'nombre') {
        const prodSel = productosDisponibles.find(prod => prod.nombre === value);
        if (prodSel) {
          const precio = prodSel.precioUnitario !== undefined ? Number(prodSel.precioUnitario) : 0;
          const ivaPorcentaje = prodSel.tipoIVA !== undefined ? Number(prodSel.tipoIVA) : 0;
          const ivaValor = precio * (ivaPorcentaje / 100);
          return {
            ...p,
            nombre: value,
            precio_unitario: precio,
            IVA_unitario: ivaValor,
          };
        } else {
          return { ...p, nombre: value, precio_unitario: '', IVA_unitario: '' };
        }
      }
      // Si cambia cantidad, forzar a número
      if (name === 'cantidad') {
        return { ...p, cantidad: value.replace(/^0+/, '') };
      }
      return { ...p, [name]: value };
    });
    setProductos(nuevos);
  };

  // Agregar un producto
  const agregarProducto = () => {
    setProductos([...productos, { nombre: '', cantidad: 1, precio_unitario: 0, IVA_unitario: 0 }]);
  };

  // Eliminar un producto
  const eliminarProducto = idx => {
    setProductos(productos.filter((_, i) => i !== idx));
  };

  // Enviar la venta y los productos al backend
  const handleSubmit = async e => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      if (!vendedor) throw new Error('No se encontró información del vendedor');

      // Comprobar stock de cada producto antes de registrar la venta
      for (const prod of productos) {
        const prodInfo = productosDisponibles.find(p => p.nombre === prod.nombre);
        if (!prodInfo) throw new Error(`Producto no encontrado: ${prod.nombre}`);
        const resp = await fetch(`http://localhost:3000/api/existencias/${prodInfo.codigo}`);
        if (!resp.ok) throw new Error(`No se pudo verificar existencias de ${prod.nombre}`);
        const data = await resp.json();
        const existencias = Number(data.existencias);
        if (existencias < Number(prod.cantidad)) {
          throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${existencias}, solicitado: ${prod.cantidad}`);
        }
      }

      // 1. Registrar la venta
      const respVenta = await fetch('http://localhost:3000/api/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...venta,
          productos,
          nombre_o_razon_social_vendedor: vendedor.ven_nombre_o_razon_social,
          NIT_vendedor: vendedor.ven_NIT,
          direccion_vendedor: vendedor.ven_direccion,
          numero_de_contacto_vendedor: vendedor.ven_numero_de_contacto,
          municipio_vendedor: vendedor.ven_municipio,
          responsabilidad_fiscal_vendedor: vendedor.ven_responsabilidad_fiscal
        })
      });
      if (!respVenta.ok) throw new Error('Error al registrar la venta');
      if (onVentaRegistrada) onVentaRegistrada();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-6xl mx-auto relative" style={{maxWidth:'1100px', maxHeight:'90vh', overflowY:'auto'}}>
      {onCancel && (
        <button onClick={onCancel} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold">×</button>
      )}
      <h1 className="text-2xl font-bold mb-6 text-center">Registrar Nueva Venta</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input name="fecha" type="date" className="border p-2 rounded" placeholder="Fecha" value={venta.fecha} onChange={handleVentaChange} required />
          <input name="hora" type="time" className="border p-2 rounded" placeholder="Hora" value={venta.hora} onChange={handleVentaChange} required />
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              name="identificacion_cliente"
              className="border p-2 rounded w-full"
              value={venta.identificacion_cliente}
              onChange={handleVentaChange}
              required
            >
              <option value="">Seleccione un cliente...</option>
              {clientes.map(cli => {
                // Mostrar nombre completo si es natural, razón social si es jurídico
                let label = cli.numeroDocumento;
                if (cli.razonSocial) {
                  label = cli.razonSocial;
                } else if (cli.primerNombre) {
                  label = `${cli.primerNombre}${cli.primerApellido ? ' ' + cli.primerApellido : ''}`;
                }
                return (
                  <option key={cli.numeroDocumento} value={cli.numeroDocumento}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Identificación</label>
            <input type="text" value={clienteSeleccionado ? (clienteSeleccionado.tipoDocumento || 'NIT') : ''} readOnly disabled className="border p-2 rounded w-full bg-gray-100 text-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIT / Número de Identificación</label>
            <input type="text" value={clienteSeleccionado ? clienteSeleccionado.numeroDocumento : ''} readOnly disabled className="border p-2 rounded w-full bg-gray-100 text-gray-700" />
          </div>
        </div>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Vendedor</label>
            <input type="text" value={vendedor ? vendedor.ven_nombre_o_razon_social : ''} readOnly disabled className="border p-2 rounded w-full bg-gray-100 text-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIT del Vendedor</label>
            <input type="text" value={vendedor ? vendedor.ven_NIT : ''} readOnly disabled className="border p-2 rounded w-full bg-gray-100 text-gray-700" />
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-2">Productos</h2>
        <div className="overflow-x-auto mb-2" style={{maxHeight: '260px', overflowY: 'auto'}}>
          <table className="min-w-full bg-white rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-1 px-2 text-xs whitespace-nowrap">Nombre Producto</th>
                <th className="py-1 px-2 text-xs whitespace-nowrap">Cantidad</th>
                <th className="py-1 px-2 text-xs whitespace-nowrap">Precio Unitario</th>
                <th className="py-1 px-2 text-xs whitespace-nowrap">IVA Unitario</th>
                <th className="py-1 px-2 text-xs whitespace-nowrap">Subtotal</th>
                <th className="py-1 px-2 text-xs whitespace-nowrap">Monto</th>
                <th className="py-1 px-2 text-xs whitespace-nowrap">Acción</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod, idx) => {
                // Calcular subtotal: precio_unitario * cantidad
                // Calcular monto: (precio_unitario + IVA_unitario) * cantidad
                const precio = parseFloat(prod.precio_unitario) || 0;
                const iva = parseFloat(prod.IVA_unitario) || 0;
                const cantidad = parseFloat(prod.cantidad) || 0;
                const subtotal = (precio * cantidad).toFixed(2);
                const monto = ((precio + iva) * cantidad).toFixed(2);
                return (
                  <tr key={idx}>
                    <td className="py-1 px-2">
                      <select
                        name="nombre"
                        className="border p-2 rounded w-full"
                        value={prod.nombre}
                        onChange={e => handleProductoChange(idx, e)}
                        required
                      >
                        <option value="">Seleccione un producto...</option>
                        {productosDisponibles
                          .filter(p => {
                            // Solo mostrar productos que no estén seleccionados en otra fila
                            return (
                              prod.nombre === p.nombre ||
                              !productos.some((prodSel, iSel) => prodSel.nombre === p.nombre && iSel !== idx)
                            );
                          })
                          .map(p => (
                            <option key={p.codigo} value={p.nombre}>
                              {p.nombre}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-1 px-2">
                      <input name="cantidad" type="number" min="1" className="border p-2 rounded w-full" placeholder="Cantidad" value={prod.cantidad} onChange={e => handleProductoChange(idx, e)} required />
                    </td>
                    <td className="py-1 px-2">
                      <input name="precio_unitario" type="number" step="0.01" className="border p-2 rounded w-full bg-gray-100 text-gray-700" placeholder="Precio Unitario" value={prod.precio_unitario} readOnly disabled required />
                    </td>
                    <td className="py-1 px-2">
                      <input name="IVA_unitario" type="number" step="0.01" className="border p-2 rounded w-full bg-gray-100 text-gray-700" placeholder="IVA Unitario" value={prod.IVA_unitario} readOnly disabled />
                    </td>
                    <td className="py-1 px-2 text-right">${subtotal}</td>
                    <td className="py-1 px-2 text-right font-semibold">${monto}</td>
                    <td className="py-1 px-2 text-center">
                      <button type="button" className="bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1" onClick={() => eliminarProducto(idx)} disabled={productos.length === 1}>-</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2">
          <button type="button" className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 mb-4 md:mb-0" onClick={agregarProducto}>Agregar producto</button>
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {/* Subtotal y Total debajo de la tabla y del botón azul */}
        <div className="mt-4">
          <div className="text-lg font-bold text-gray-700 text-left">
            Subtotal: ${productos.reduce((acc, prod) => {
              const precio = parseFloat(prod.precio_unitario) || 0;
              const cantidad = parseFloat(prod.cantidad) || 0;
              return acc + precio * cantidad;
            }, 0).toFixed(2)}
          </div>
          <div className="text-lg font-bold text-gray-700 text-left">
            Total: ${productos.reduce((acc, prod) => {
              const precio = parseFloat(prod.precio_unitario) || 0;
              const iva = parseFloat(prod.IVA_unitario) || 0;
              const cantidad = parseFloat(prod.cantidad) || 0;
              return acc + (precio + iva) * cantidad;
            }, 0).toFixed(2)}
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded shadow" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Registrar Venta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegistrarVenta;
