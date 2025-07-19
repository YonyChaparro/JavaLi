import React, { useState, useEffect } from 'react'; // Added useEffect import
import HistorialVentas from '../components/HistorialVentas';
import EdicionVendedor from '../components/EdicionVendedor';
import ListaInventario from '../components/ListaInventario';
import FormularioInventario from '../components/FormularioInventario';
import Reportes from '../components/Reportes';
import ListaClientes from '../components/ListaClientes';
import TipoMovimiento from '../components/TipoMovimiento';
import ListaProductos from '../components/ListaProductos';
import FormularioProducto from '../components/FormularioProducto';

// --- Componentes Reutilizables ---

// Mover el icono fuera del componente principal para evitar que se re-declare en cada render.
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0.5 0.5 31.0 31.0" style={{ fill: 'rgb(6, 50, 125)' }}>
    <path d="M16,0.5C7.45001,0.5,0.5,7.45001,0.5,16S7.45001,31.5,16,31.5S31.5,24.54999,31.5,16S24.54999,0.5,16,0.5z M24.71002,17.5 H17.5v7.20996c0,0.82001-0.66998,1.5-1.5,1.5s-1.5-0.67999-1.5-1.5V17.5H7.28998c-0.82001,0-1.5-0.67004-1.5-1.5 c0-0.83002,0.67999-1.5,1.5-1.5H14.5V7.28998c0-0.82001,0.66998-1.5,1.5-1.5s1.5,0.67999,1.5,1.5V14.5h7.21002 c0.82001,0,1.5,0.66998,1.5,1.5C26.21002,16.82996,25.53003,17.5,24.71002,17.5z" />
  </svg>
);

// Componente genérico para los botones del menú para evitar repetición de código.
const MenuButton = ({ label, icon, onClick }) => (
  <div onClick={onClick} className="bg-white rounded-[36px] flex flex-col items-center justify-center p-4 relative transition-transform duration-300 hover:scale-105 cursor-pointer">
    <div className="absolute top-3 right-3 h-6 w-6 bg-blue-100 rounded-full p-1">
      <PlusIcon />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <img src={icon} alt={label} className="h-24 w-auto object-contain" />
      <p className="text-2xl font-bold text-center">{label}</p>
    </div>
  </div>
);

// Componente genérico para modales con animación
const Modal = ({ children, show, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-lg max-w-6xl w-auto max-h-[90vh] overflow-auto relative transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default function HomeMenu() {
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  const [mostrarTipoMovimiento, setMostrarTipoMovimiento] = useState(false);

  const [mostrarListaProductos, setMostrarListaProductos] = useState(false);
  const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);
  const [productoEditado, setProductoEditado] = useState(null);
  const [mostrarReportes, setMostrarReportes] = useState(false);

  const [mostrarHistorialVentas, setMostrarHistorialVentas] = useState(false);
  const abrirHistorialVentas = () => {
    setMostrarHistorialVentas(true);
  };

  const [mostrarEdicionVendedor, setMostrarEdicionVendedor] = useState(false);
  const abrirEdicionVendedor = () => {
    setMostrarEdicionVendedor(true);
  };

  const [mostrarListaInventario, setMostrarListaInventario] = useState(false);
  const abrirListaInventario = () => {
    setMostrarListaInventario(true);
  };

  const [mostrarFormularioInventario, setMostrarFormularioInventario] = useState(false);

  const abrirTiposDeMovimiento = () => {
    setMostrarTipoMovimiento(true);
  };

  const handleAgregarProducto = () => {
    setProductoEditado(null);
    setMostrarListaProductos(false);
    setMostrarFormularioProducto(true);
  };

  const handleEditarProducto = (producto) => {
    setProductoEditado(producto);
    setMostrarListaProductos(false);
    setMostrarFormularioProducto(true);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormularioProducto(false);
    setMostrarListaProductos(true);
  };

  const handleGuardarProducto = () => {
    setProductoEditado(null);
    setMostrarFormularioProducto(false);
    setMostrarListaProductos(true);
  };

  return (
    <div className="w-screen h-screen bg-[#06327d] p-6">
      <div className="w-full h-full grid grid-cols-4 grid-rows-2 gap-6 text-black">
        {/* Columna izquierda (logo + pagar) */}
        <div className="row-span-2 flex flex-col h-full gap-6">
          <div className="h-44 bg-white rounded-[36px] shadow-md p-4 flex items-center justify-center">
            <img src="/icons/logo.png" alt="Logo POS" className="h-full w-full object-contain" />
          </div>

          {/* Cuadro del Botón Pagar: 2/3 de altura */}
          <div onClick={abrirHistorialVentas} className="h-[66.66%] flex flex-col items-center justify-center bg-white rounded-[36px] shadow-md p-4 relative transition-transform duration-300 hover:scale-105 cursor-pointer">
            <div className="absolute top-3 right-3 h-6 w-6 bg-blue-100 rounded-full p-1">
              <PlusIcon />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="h-48 w-full flex items-center justify-center">
                <img src="/icons/pagar.png" alt="Pagar" className="h-full w-auto object-contain" />
              </div>
              <p className="text-2xl font-bold text-center">Pagar</p>
            </div>
          </div>
        </div>

        {/* Botones del menú principal */}
        {[
          { name: 'clientes', label: 'Clientes', icon: '/icons/clientes.png', onClick: () => setMostrarListaClientes(true) },
          { name: 'inventario', label: 'Inventario', icon: '/icons/inventario.png', onClick: abrirListaInventario },
          { name: 'tiposMovimiento', label: 'Tipos Movimiento', icon: '/icons/factura-ordinaria.png', onClick: abrirTiposDeMovimiento },
          { name: 'reportes', label: 'Reportes', icon: '/icons/reportes.png', onClick: () => setMostrarReportes(true) },
          { name: 'vendedor', label: 'Vendedor', icon: '/icons/vendedor.webp', onClick: abrirEdicionVendedor },
          { name: 'productos', label: 'Productos', icon: '/icons/pendiente.webp', onClick: () => setMostrarListaProductos(true) },
        ].map((item) => (
          <MenuButton key={item.name} label={item.label} icon={item.icon} onClick={item.onClick} />
        ))}

      </div>

      {/* Modal de Reportes */}
      <Modal show={mostrarReportes} onClose={() => setMostrarReportes(false)}>
        <Reportes
          onClose={() => setMostrarReportes(false)}
          onBack={() => setMostrarReportes(false)}
        />
      </Modal>

      {/* Modales lista de clientes*/}
      <Modal show={mostrarListaClientes} onClose={() => setMostrarListaClientes(false)}>
        <ListaClientes
          onAddClient={() => { }}
          onEditClient={() => { }}
          onDeleteClient={() => { }}
          onBack={() => setMostrarListaClientes(false)}
        />
      </Modal>

      {/* Modales tipo de movimiento */}
      <Modal show={mostrarTipoMovimiento} onClose={() => setMostrarTipoMovimiento(false)}>
        <TipoMovimiento onBack={() => setMostrarTipoMovimiento(false)} />
      </Modal>

      {/* Modales lista de productos */}
      <Modal show={mostrarFormularioProducto} onClose={handleCancelarFormulario}>
        <FormularioProducto
          productoEditado={productoEditado}
          onBack={handleCancelarFormulario}
          onClose={() => {
            setMostrarFormularioProducto(false);
            setMostrarListaProductos(false);
          }}
          onSave={handleGuardarProducto}
        />
      </Modal>

      {/* Modales lista de productos */}
      <Modal show={mostrarListaProductos} onClose={() => setMostrarListaProductos(false)}>
        <ListaProductos
          onAddProduct={handleAgregarProducto}
          onEditProduct={handleEditarProducto}
          onDeleteProduct={() => { }}
          onBack={() => setMostrarListaProductos(false)}
        />
      </Modal>

      {/* Modal historial de ventas */}
      <Modal show={mostrarHistorialVentas} onClose={() => setMostrarHistorialVentas(false)}>
        <HistorialVentas onClose={() => setMostrarHistorialVentas(false)} />
      </Modal>

      {/* Modal lista inventario */}
      <Modal show={mostrarListaInventario} onClose={() => setMostrarListaInventario(false)}>
        <ListaInventario
          onAddInventario={() => {
            setMostrarFormularioInventario(true);
            setMostrarListaInventario(false);
          }}
          onBack={() => setMostrarListaInventario(false)} />
      </Modal>

      {/* Modal inventario */}
      <Modal show={mostrarFormularioInventario} onClose={() => setMostrarFormularioInventario(false)}>
        <FormularioInventario
          onBack={() => {
            setMostrarFormularioInventario(false);
            setMostrarListaInventario(true);
          }}
          onClose={() => setMostrarFormularioInventario(false)} />
      </Modal>

      {/* Modal edición de vendedor */}
      <Modal show={mostrarEdicionVendedor} onClose={() => setMostrarEdicionVendedor(false)}>
        <EdicionVendedor onClose={() => setMostrarEdicionVendedor(false)} />
      </Modal>
    </div>
  );
}