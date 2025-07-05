import React, { useState } from 'react';
import HistorialVentas from '../components/HistorialVentas';
import EdicionVendedor from '../components/EdicionVendedor';
import Inventario from '../components/Inventario';
import Reportes from '../components/Reportes';

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
    const [mostrarReportes, setMostrarReportes] = useState(false);

    const [mostrarHistorialVentas, setMostrarHistorialVentas] = useState(false);
    const abrirHistorialVentas = () => {
        setMostrarHistorialVentas(true);
    };

    const [mostrarEdicionVendedor, setMostrarEdicionVendedor] = useState(false);
    const abrirEdicionVendedor = () => {
        setMostrarEdicionVendedor(true);
    };

    const [mostrarInventario, setMostrarInventario] = useState(false);
    const abrirInventario = () => {
        setMostrarInventario(true);
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

                    {/* Cuadro del Botón Pagar: 2/3 de altura */}
                    <div onClick={abrirHistorialVentas} className="h-[66.66%] flex flex-col items-center justify-center bg-white rounded-[36px] shadow-md p-4 relative transition-transform duration-300 hover:scale-105">
                        <div className="absolute top-3 right-3 h-6 w-6 bg-blue-100 rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0.5 0.5 31.0 31.0" style={{ fill: 'rgb(6, 50, 125)' }}>
                                <path d="M16,0.5C7.45001,0.5,0.5,7.45001,0.5,16S7.45001,31.5,16,31.5S31.5,24.54999,31.5,16S24.54999,0.5,16,0.5z M24.71002,17.5 H17.5v7.20996c0,0.82001-0.66998,1.5-1.5,1.5s-1.5-0.67999-1.5-1.5V17.5H7.28998c-0.82001,0-1.5-0.67004-1.5-1.5 c0-0.83002,0.67999-1.5,1.5-1.5H14.5V7.28998c0-0.82001,0.66998-1.5,1.5-1.5s1.5,0.67999,1.5,1.5V14.5h7.21002 c0.82001,0,1.5,0.66998,1.5,1.5C26.21002,16.82996,25.53003,17.5,24.71002,17.5z" />
                            </svg>
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
                    { label: 'Inventario', icon: '/icons/inventario.png', onClick: abrirInventario },
                    { label: 'Factura ordinaria', icon: '/icons/factura-ordinaria.png', onClick: abrirTiposDeMovimiento },
                    { label: 'Reportes', icon: '/icons/reportes.png', onClick: () => setMostrarReportes(true) },
                    { label: 'Vendedor', icon: '/icons/vendedor.webp', onClick: abrirEdicionVendedor },
                    { label: 'Productos', icon: '/icons/pendiente.webp', onClick: () => setMostrarListaProductos(true) },
                ].map((item, i) => {

                    return (
                    
                        <div key={i} onClick={item.onClick} className="bg-white rounded-[36px] flex flex-col items-center justify-center p-4 relative transition-transform duration-300 hover:scale-105">
                            <div className="absolute top-3 right-3 h-6 w-6 bg-blue-100 rounded-full p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0.5 0.5 31.0 31.0" style={{ fill: 'rgb(6, 50, 125)' }}>
                                    <path d="M16,0.5C7.45001,0.5,0.5,7.45001,0.5,16S7.45001,31.5,16,31.5S31.5,24.54999,31.5,16S24.54999,0.5,16,0.5z M24.71002,17.5 H17.5v7.20996c0,0.82001-0.66998,1.5-1.5,1.5s-1.5-0.67999-1.5-1.5V17.5H7.28998c-0.82001,0-1.5-0.67004-1.5-1.5 c0-0.83002,0.67999-1.5,1.5-1.5H14.5V7.28998c0-0.82001,0.66998-1.5,1.5-1.5s1.5,0.67999,1.5,1.5V14.5h7.21002 c0.82001,0,1.5,0.66998,1.5,1.5C26.21002,16.82996,25.53003,17.5,24.71002,17.5z" />
                                </svg>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                <img src={item.icon} alt={item.label} className="h-24 w-auto object-contain" />
                                <p className="text-2xl font-bold text-center">{item.label}</p>
                            </div>
                        </div>

                    );

                })}

            </div>

            {/* Modal de Reportes */}
            {mostrarReportes && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <Reportes onClose={() => setMostrarReportes(false)} />
                </div>
            )}

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

            {/* Modal historial de ventas */}
            {mostrarHistorialVentas && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto relative">
                        <HistorialVentas onClose={() => setMostrarHistorialVentas(false)} />
                    </div>
                </div>
            )}

            {/* Modal inventario */}
            {mostrarInventario && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto relative">
                        <Inventario onClose={() => setMostrarInventario(false)} />
                    </div>
                </div>
            )}

            {/* Modal edición de vendedor */}
            {mostrarEdicionVendedor && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto relative">
                        <EdicionVendedor onClose={() => setMostrarEdicionVendedor(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
