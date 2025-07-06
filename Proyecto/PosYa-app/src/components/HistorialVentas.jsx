import React, { useEffect, useState } from 'react';
import VisualizacionVenta from './VisualizacionVenta';
import RegistrarVenta from './RegistrarVenta';

function ConfirmationModal({ title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const HistorialVentas = ({ onClose }) => {
  const [ventas, setVentas] = useState([]);
  const [error, setError] = useState(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [registrandoVenta, setRegistrandoVenta] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleShowConfirmDelete = (venta) => {
    setItemToDelete(venta);
    setShowConfirmDelete(true);
  };

  const confirmDeleteVenta = async () => {
    if (!itemToDelete) return;
    try {
      const resp = await fetch(`http://localhost:3000/api/venta/${encodeURIComponent(itemToDelete.numero)}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('No se pudo eliminar la venta');
      setVentas(ventas.filter(v => v.numero !== itemToDelete.numero));
    } catch (err) {
      setError('No se pudo eliminar la venta.');
    } finally {
      setShowConfirmDelete(false);
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/historial_ventas');
        if (!response.ok) throw new Error('Error al obtener ventas');
        const data = await response.json();
        setVentas(data);
      } catch (err) {
        setError('No se pudieron cargar las ventas.');
      }
    };
    fetchVentas();
  }, []);

  const handleNuevaVenta = () => {
    setRegistrandoVenta(true);
  };

  const handleVentaRegistrada = () => {
    setRegistrandoVenta(false);
    // Refrescar ventas después de registrar
    (async () => {
      try {
        const response = await fetch('http://localhost:3000/api/historial_ventas');
        if (!response.ok) throw new Error('Error al obtener ventas');
        const data = await response.json();
        setVentas(data);
      } catch (err) {
        setError('No se pudieron cargar las ventas.');
      }
    })();
  };

  return (
    <div className="container mx-auto py-8 px-8 relative bg-white rounded-lg shadow-lg">
      {/* Botón cerrar modal */}
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold">×</button>
      )}
      {registrandoVenta ? (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <RegistrarVenta 
            onBack={() => setRegistrandoVenta(false)} onVentaRegistrada={handleVentaRegistrada} 
            onClose={() => {
              setRegistrandoVenta(false);
              if (onClose) onClose();
            }}
            />
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6 text-center">Historial de Ventas</h1>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-3 px-4 text-left">Número</th>
                  <th className="py-3 px-4 text-left">Fecha</th>
                  <th className="py-3 px-4 text-left">Hora</th>
                  <th className="py-3 px-4 text-left">Cliente</th>
                  <th className="py-3 px-4 text-left">Total</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-red-500">{error}</td>
                  </tr>
                ) : ventas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-gray-500">No hay ventas registradas.</td>
                  </tr>
                ) : (
                  ventas.map((venta) => {
                    // Si el cliente es jurídico, mostrar la razón social si existe
                    // Usar ven_razon_social_cliente si existe, si no cliente, si no mostrar '—'
                    let clienteMostrar = '—';
                    if (venta.ven_razon_social_cliente && venta.ven_razon_social_cliente.trim() !== '') {
                      clienteMostrar = venta.ven_razon_social_cliente;
                    } else if (venta.cliente && venta.cliente.trim() !== '') {
                      clienteMostrar = venta.cliente;
                    }
                    return (
                      <tr key={venta.numero} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{venta.numero}</td>
                        <td className="py-2 px-4">{venta.fecha}</td>
                        <td className="py-2 px-4">{venta.hora}</td>
                        <td className="py-2 px-4">{clienteMostrar}</td>
                        <td className="py-2 px-4">{venta.total}</td>
                        <td className="py-2 px-4 text-center">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2" title="Ver venta" onClick={() => setVentaSeleccionada(venta.numero)}>👁️</button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" title="Eliminar venta" onClick={() => handleShowConfirmDelete(venta)}>🗑️</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-8">
            <button id="nueva-venta" onClick={handleNuevaVenta} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow transition-colors duration-200">
              Registrar nueva venta
            </button>
          </div>
          {ventaSeleccionada && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <VisualizacionVenta codigo={ventaSeleccionada} onClose={() => setVentaSeleccionada(null)} />
            </div>
          )}
          {showConfirmDelete && itemToDelete && (
            <ConfirmationModal
              title="Confirmar Eliminación"
              message={`¿Estás seguro de que deseas eliminar la venta N° ${itemToDelete.numero}? Esta acción no se puede deshacer.`}
              onConfirm={confirmDeleteVenta}
              onCancel={() => {
                setShowConfirmDelete(false);
                setItemToDelete(null);
              }}
              confirmText="Sí, eliminar"
              cancelText="No, cancelar"
            />
          )}
        </>
      )}
    </div>
  );
};

export default HistorialVentas;
