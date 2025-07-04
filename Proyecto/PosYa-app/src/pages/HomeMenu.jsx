
import React, { useState } from 'react';
import HistorialVentas from '../components/HistorialVentas';
import EdicionVendedor from '../components/EdicionVendedor';
import Inventario from '../components/Inventario';

export default function HomeMenu() {

    const abrirReporte = () => {
        window.open('/reportes.html', '_blank');
    };

    const [mostrarHistorialVentas, setMostrarHistorialVentas] = useState(false);

    const [mostrarEdicionVendedor, setMostrarEdicionVendedor] = useState(false);
    const abrirEdicionVendedor = () => {
        setMostrarEdicionVendedor(true);
    };

    const [mostrarInventario, setMostrarInventario] = useState(false);
    const abrirInventario = () => {
        setMostrarInventario(true);
    };

    return (
        <div className="w-screen h-screen bg-[#06327d] p-6">
            <div className="w-full h-full grid grid-cols-4 grid-rows-2 gap-[24px] text-black">

                {/* Columna 1: Logo + Botón Pagar */}
                <div className="row-span-2 flex flex-col h-full gap-[24px]">

                    {/* Cuadro del Logo: 1/3 de altura */}
                    <div className="h-44 bg-white rounded-[36px] shadow-md p-4 flex items-center justify-center relative transition-transform duration-300 hover:scale-105">
                        <img
                            src="/icons/logo.png"
                            alt="Logo POS"
                            className="h-full w-full object-contain"
                        />

                    </div>

                    {/* Cuadro del Botón Pagar: 2/3 de altura */}
                    <div onClick={() => setMostrarHistorialVentas(true)} className="h-[66.66%] flex flex-col items-center justify-center bg-white rounded-[36px] shadow-md p-4 relative transition-transform duration-300 hover:scale-105">
                        <div className="absolute top-3 right-3 h-6 w-6 bg-blue-100 rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0.5 0.5 31.0 31.0" style={{ fill: 'rgb(6, 50, 125)' }}>
                                <path d="M16,0.5C7.45001,0.5,0.5,7.45001,0.5,16S7.45001,31.5,16,31.5S31.5,24.54999,31.5,16S24.54999,0.5,16,0.5z M24.71002,17.5 H17.5v7.20996c0,0.82001-0.66998,1.5-1.5,1.5s-1.5-0.67999-1.5-1.5V17.5H7.28998c-0.82001,0-1.5-0.67004-1.5-1.5 c0-0.83002,0.67999-1.5,1.5-1.5H14.5V7.28998c0-0.82001,0.66998-1.5,1.5-1.5s1.5,0.67999,1.5,1.5V14.5h7.21002 c0.82001,0,1.5,0.66998,1.5,1.5C26.21002,16.82996,25.53003,17.5,24.71002,17.5z" />
                            </svg>
                        </div>
                        <div className="relative w-full h-3/5 flex items-center justify-center">
                            <img
                                src="/icons/pagar.png"
                                alt="Pagar"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <p className="text-lg font-semibold mt-4">Pagar</p>
                    </div>

                </div>

                {/* Otras 6 funcionalidades */}
                {[
                    { label: 'Clientes', icon: '/icons/clientes.png' },
                    { label: 'Inventario', icon: '/icons/inventario.png', onClick: abrirInventario},
                    { label: 'Factura ordinaria', icon: '/icons/factura-ordinaria.png' },
                    { label: 'Reportes', icon: '/icons/reportes.png', onClick: abrirReporte},
                    { label: 'Vendedor', icon: '/icons/vendedor.webp', onClick: abrirEdicionVendedor },
                    { label: 'Pendiente', icon: '/icons/pendiente.webp'},
                ].map((item, i) => {

                    return (
                    
                        <div key={i} onClick={item.onClick} className="bg-white rounded-[36px] flex flex-col items-center justify-between p-4 relative transition-transform duration-300 hover:scale-105">
                            <div className="absolute top-3 right-3 h-6 w-6 bg-blue-100 rounded-full p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0.5 0.5 31.0 31.0" style={{ fill: 'rgb(6, 50, 125)' }}>
                                    <path d="M16,0.5C7.45001,0.5,0.5,7.45001,0.5,16S7.45001,31.5,16,31.5S31.5,24.54999,31.5,16S24.54999,0.5,16,0.5z M24.71002,17.5 H17.5v7.20996c0,0.82001-0.66998,1.5-1.5,1.5s-1.5-0.67999-1.5-1.5V17.5H7.28998c-0.82001,0-1.5-0.67004-1.5-1.5 c0-0.83002,0.67999-1.5,1.5-1.5H14.5V7.28998c0-0.82001,0.66998-1.5,1.5-1.5s1.5,0.67999,1.5,1.5V14.5h7.21002 c0.82001,0,1.5,0.66998,1.5,1.5C26.21002,16.82996,25.53003,17.5,24.71002,17.5z" />
                                </svg>
                            </div>
                            <img src={item.icon} alt={item.label} className="h-44 object-contain" />
                            <p className="mt-2 text-lg font-semibold text-center">{item.label}</p>
                        </div>

                        

                    );

                })}

                {/* Modal para HistorialVentas */}
                {mostrarHistorialVentas && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <HistorialVentas
                            onCancel={() => setMostrarHistorialVentas(false)}
                            onSave={() => setMostrarHistorialVentas(false)}
                        />
                    </div>
                )}
                {/* Modal para EdicionVendedor */}
                {mostrarEdicionVendedor && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <EdicionVendedor onClose={() => setMostrarEdicionVendedor(false)} />
                    </div>
                )}
                {/* Modal para Inventario */}
                {mostrarInventario && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <Inventario onClose={() => setMostrarInventario(false)} />
                    </div>
                )}

            </div>
        </div>
    );
}

