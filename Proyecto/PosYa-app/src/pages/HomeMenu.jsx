import { useState } from 'react';
import ListaClientes from '../components/ListaClientes';
import TipoMovimiento from '../components/TipoMovimiento';

import ListaProductos from '../components/ListaProductos';
import FormularioProducto from '../components/FormularioProducto';

export default function HomeMenu() {

    const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
    const [mostrarTipoMovimiento, setMostrarTipoMovimiento] = useState(false);

    const [mostrarListaProductos, setMostrarListaProductos] = useState(false);
    const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);
    const [productoEditado, setProductoEditado] = useState(null);

    const abrirReporte = () => {
        window.open('/reportes.html', '_blank');
    };

    const abrirHistorialVentas = () => {
        window.open('/historial_ventas.html', '_blank');
    };

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

    // Componente PlusIcon reutilizable
    const PlusIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-6 w-6" fill="#06327d">
            <path d="M16 0C7.2 0 0 7.2 0 16s7.2 16 16 16 16-7.2 16-16S24.8 0 16 0zm8 18h-6v6h-4v-6H8v-4h6V8h4v6h6v4z"/>
        </svg>
    );

    return (
        <div className="w-screen h-screen bg-[#06327d] p-6">
            <div className="w-full h-full grid grid-cols-4 grid-rows-2 gap-6 text-black">
                {/* Columna izquierda (logo + pagar) */}
                <div className="row-span-2 flex flex-col h-full gap-6">
                    <div className="h-44 bg-white rounded-[36px] shadow-md p-4 flex items-center justify-center">
                        <img src="/icons/logo.png" alt="Logo POS" className="h-full w-full object-contain" />
                    </div>
                    <div onClick={abrirHistorialVentas} className="flex-1 flex flex-col bg-white rounded-[36px] shadow-md p-4 relative group">
                        <div className="absolute top-4 right-4 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
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
                    { label: 'Clientes', icon: '/icons/clientes.png', onClick: () => setMostrarListaClientes(true) },
                    { label: 'Inventario', icon: '/icons/inventario.png', onClick: () => setMostrarTipoMovimiento(true) },
                    { label: 'Gestión productos', icon: '/icons/pendiente.webp', onClick: () => setMostrarListaProductos(true) },
                    { label: 'Vendedor', icon: '/icons/vendedor.webp' },
                    { label: 'Factura ordinaria', icon: '/icons/factura-ordinaria.png' },
                    { label: 'Reportes', icon: '/icons/reportes.png', onClick: abrirReporte }
                ].map((item, index) => (
                    <div 
                        key={index} 
                        onClick={item.onClick}
                        className="bg-white rounded-[36px] shadow-md p-4 relative group flex flex-col"
                    >
                        <div className="absolute top-4 right-4 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <PlusIcon />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <div className="h-48 w-full flex items-center justify-center">
                                <img src={item.icon} alt={item.label} className="h-full w-auto object-contain" />
                            </div>
                            <p className="text-2xl font-bold text-center">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modales lista de clientes*/}
            {mostrarListaClientes && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <ListaClientes
                        onAddClient={() => {}}
                        onEditClient={() => {}}
                        onDeleteClient={() => {}}
                        onBack={() => setMostrarListaClientes(false)}
                    />
                </div>
            )}

            {/* Modales tipo de movimiento */}
            {mostrarTipoMovimiento && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto relative">
                        <TipoMovimiento onBack={() => setMostrarTipoMovimiento(false)} />
                    </div>
                </div>
            )}

            {/* Modales lista de productos */}
            {mostrarFormularioProducto && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <FormularioProducto
                        productoEditado={productoEditado}
                        onCancel={handleCancelarFormulario}
                        onSave={handleGuardarProducto}
                    />
                </div>
            )}

            {/* Modales lista de productos */}
            {mostrarListaProductos && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <ListaProductos
                        onAddProduct={handleAgregarProducto}
                        onEditProduct={handleEditarProducto}
                        onDeleteProduct={() => {}}
                        onBack={() => setMostrarListaProductos(false)}
                    />
                </div>
            )}
        </div>
    );
}
