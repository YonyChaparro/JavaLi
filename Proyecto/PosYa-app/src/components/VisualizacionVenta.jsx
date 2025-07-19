import React, { useEffect, useState } from 'react';
import { FiX, FiChevronLeft, FiTrash2, FiDownload, FiSend, FiLink } from 'react-icons/fi'; // Añadimos FiSend y FiLink

// Modal de confirmación reutilizable (idéntico a HistorialVentas)
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

// Recibe onVentaEliminada opcional para notificar al padre (HistorialVentas)
const VisualizacionVenta = ({ codigo, onClose, onVentaEliminada }) => {
  const [venta, setVenta] = useState(null);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // --- Nuevos estados para la Factura Electrónica ---
  const [facturaElectronicaInfo, setFacturaElectronicaInfo] = useState(null);
  const [loadingFacturaElectronica, setLoadingFacturaElectronica] = useState(false);
  const [errorFacturaElectronica, setErrorFacturaElectronica] = useState(null);
  // --------------------------------------------------

  async function eliminarVenta() {
    if (!venta || !venta.numero) return;
    setEliminando(true);
    setMensaje(null);
    try {
      const resp = await fetch(`http://localhost:3000/api/venta/${encodeURIComponent(venta.numero)}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('No se pudo eliminar la venta');
      setMensaje('Venta eliminada correctamente.');
      // Notificar al padre si existe el callback (como en HistorialVentas)
      if (onVentaEliminada) onVentaEliminada(venta.numero);
      setTimeout(() => {
        setEliminando(false);
        setShowConfirmDelete(false);
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      setMensaje('Error al eliminar la venta: ' + err.message);
      setEliminando(false);
    }
  }

  useEffect(() => {
    if (!codigo) {
      setError('No se proporcionó el código de la venta.');
      setLoading(false);
      return;
    }
    const fetchVenta = async () => {
      try {
        const respVenta = await fetch(`http://localhost:3000/api/venta?codigo=${encodeURIComponent(codigo)}`);
        if (!respVenta.ok) throw new Error('No se pudo obtener la información de la venta');
        const ventaData = await respVenta.json();
        setVenta(ventaData);
        const respDetalle = await fetch(`http://localhost:3000/api/venta_detalle?codigo=${encodeURIComponent(codigo)}`);
        if (!respDetalle.ok) throw new Error('No se pudo obtener el detalle de productos');
        const productosData = await respDetalle.json();
        setProductos(productosData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVenta();
  }, [codigo]);

  // Función para generar la factura ordinaria (PDF local)
  async function generarPDFVenta(venta, productos) {
    // Cargar jsPDF si no está presente
    if (!window.jspdf) {
      await new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }
    const { jsPDF } = window.jspdf;

    // Crear iframe oculto
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'fixed',
      left: '-99999px',
      top: '0',
      width: '1200px',
      height: '1600px',
      zIndex: '-1',
    });
    document.body.appendChild(iframe);

    // Cargar el mockup
    const html = await fetch('mockup_factura_venta.html').then(r => r.text());
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    await new Promise(res => setTimeout(res, 300));
    const docHTML = iframe.contentDocument.body;

    // Rellenar datos del mockup con los nombres de propiedad correctos del backend
    const razonSocial = docHTML.querySelector('.razon-social');
    if (razonSocial) razonSocial.textContent = venta.vendedor || 'Vendedor';
    const infoNodes = docHTML.querySelectorAll('.info');
    if (infoNodes[0]) infoNodes[0].textContent = `NIT: ${venta.nit_vendedor || ''}`;
    if (infoNodes[1]) infoNodes[1].textContent = `Responsabilidad Fiscal: ${venta.responsabilidad_fiscal_vendedor || ''}`;
    if (infoNodes[2]) infoNodes[2].textContent = `Dirección: ${venta.direccion_vendedor || ''}`;
    if (infoNodes[3]) infoNodes[3].textContent = `Municipio: ${venta.municipio_vendedor || ''}`;
    if (infoNodes[4]) infoNodes[4].textContent = `Teléfono: ${venta.contacto_vendedor || ''}`;

    const clienteDiv = docHTML.querySelector('.cliente');
    if (clienteDiv) {
      const clienteDivs = clienteDiv.querySelectorAll('div');
      const clienteNombre = venta.nombre_cliente && venta.apellido_cliente
        ? `${venta.nombre_cliente} ${venta.apellido_cliente}`
        : (venta.razon_social_cliente || venta.cliente || '');
      if (clienteDivs[1]) clienteDivs[1].textContent = clienteNombre;
      if (clienteDivs[2]) clienteDivs[2].textContent = `Dirección: ${venta.direccion_cliente || venta.direccion_cliente || ''}`;
      if (clienteDivs[3]) clienteDivs[3].textContent = `Correo: ${venta.correo_electronico_cliente || venta.correo_cliente || ''}`;
      if (clienteDivs[4]) clienteDivs[4].textContent = `Teléfono: ${venta.telefono_cliente || ''}`;
    }

    const datosFactura = docHTML.querySelectorAll('.datos-factura .dato');
    if (datosFactura[0]) datosFactura[0].innerHTML = `<strong>Factura No.:</strong> ${venta.codigo || venta.numero || ''}`;
    if (datosFactura[1]) datosFactura[1].innerHTML = `<strong>Fecha:</strong> ${venta.fecha || venta.fecha || ''}`;
    if (datosFactura[2]) datosFactura[2].innerHTML = `<strong>Hora:</strong> ${venta.hora || venta.hora || ''}`;

    const tbody = docHTML.querySelector('.productos-table tbody');
    if (tbody) {
      tbody.innerHTML = '';
      let subtotal = 0, totalIVA = 0, total = 0;
      productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
                    <td>${p.nombre_producto}</td>
                    <td>${p.cantidad}</td>
                    <td>$${Number(p.precio_unitario).toFixed(2)}</td>
                    <td>$${Number(p.IVA_unitario).toFixed(2)}</td>
                    <td>$${Number(p.submonto).toFixed(2)}</td>
                    <td>$${Number(p.monto).toFixed(2)}</td>
                `;
        tbody.appendChild(tr);
        subtotal += Number(p.submonto);
        totalIVA += Number(p.IVA_unitario) * Number(p.cantidad);
        total += Number(p.monto);
      });
      const totales = docHTML.querySelectorAll('.totales .linea');
      if (totales[0]) totales[0].innerHTML = `Subtotal: <strong>$${subtotal.toFixed(2)}</strong>`;
      if (totales[1]) totales[1].innerHTML = `IVA: <strong>$${totalIVA.toFixed(2)}</strong>`;
      if (totales[2]) totales[2].innerHTML = 'Otros: <strong>$0.00</strong>';
      const totalNode = docHTML.querySelector('.totales .total');
      if (totalNode) totalNode.textContent = `TOTAL: $${total.toFixed(2)}`;
    }

    // Cargar html2canvas si es necesario
    if (!window.html2canvas) {
      await new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }

    await new Promise(res => setTimeout(res, 300));

    // Generar PDF usando una imagen del mockup para máxima fidelidad visual
    const rect = docHTML.querySelector('.factura-container').getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    // Usar html2canvas para capturar solo la factura
    const canvas = await window.html2canvas(docHTML.querySelector('.factura-container'), {
      backgroundColor: '#fff',
      scale: 2,
      useCORS: true,
      width: width,
      height: height
    });
    const imgData = canvas.toDataURL('image/png');
    // Crear PDF con tamaño ajustado a la imagen
    const pdfWidth = width * 0.75; // 1px = 0.75pt
    const pdfHeight = height * 0.75;
    const doc = new jsPDF({ orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait', unit: 'pt', format: [pdfWidth, pdfHeight] });
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const nombreArchivo = `venta_${venta.numero || venta.codigo || 'factura'}.pdf`;
    doc.save(nombreArchivo);
    setTimeout(() => iframe.remove(), 500);
  }

  // --- Nueva función para generar la Factura Electrónica ---
  async function generarFacturaElectronica() {
    if (!venta || !venta.codigo) {
      setErrorFacturaElectronica('No se pudo obtener el código de venta para la factura electrónica.');
      return;
    }

    setLoadingFacturaElectronica(true);
    setErrorFacturaElectronica(null);
    setFacturaElectronicaInfo(null);

    try {
      const response = await fetch('http://localhost:3000/api/factus/generar-factura-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoVenta: venta.codigo }),
      });

      const data = await response.json();

      if (response.ok) {
        setFacturaElectronicaInfo({
          status: data.status,
          message: data.message,
          number: data.data.bill.number,
          cufe: data.data.bill.cufe,
          public_url: data.data.bill.public_url,
          internal_id: data.data.bill.id,
        });
      } else {
        setErrorFacturaElectronica(data.error || data.message || 'Error desconocido al generar factura electrónica.');
        console.error('Error Factus:', data.details || data);
      }
    } catch (err) {
      setErrorFacturaElectronica('Error de red al conectar con el servidor: ' + err.message);
      console.error('Error de red:', err);
    } finally {
      setLoadingFacturaElectronica(false);
    }
  }
  // --------------------------------------------------------

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-6xl mx-auto relative" style={{ maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto' }}>
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        aria-label="Cerrar"
      >
        <FiX className="w-6 h-6" />
      </button>

      <h1 className="text-2xl font-bold mb-6 text-center">Detalle de Venta</h1>
      {/* Mensaje de éxito/error */}
      {mensaje && (
        <div className={`mb-4 text-center font-semibold ${mensaje.includes('eliminada') ? 'text-green-600' : 'text-red-600'}`}>{mensaje}</div>
      )}

      {/* Información General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="mb-2"><span className="font-medium text-gray-700">Número:</span> <span className="text-gray-800">{venta.numero}</span></div>
          <div className="mb-2"><span className="font-medium text-gray-700">Fecha:</span> <span className="text-gray-800">{venta.fecha}</span></div>
          <div className="mb-2"><span className="font-medium text-gray-700">Hora:</span> <span className="text-gray-800">{venta.hora}</span></div>
          <div className="mb-2"><span className="font-medium text-gray-700">Cliente:</span> <span className="text-gray-800">{venta.cliente}</span></div>
          <div className="mb-2"><span className="font-medium text-gray-700">Total:</span> <span className="text-gray-800">{venta.total}</span></div>
        </div>
        <div>
          <div className="mb-2"><span className="font-medium text-gray-700">Dirección Cliente:</span> <span className="text-gray-800">{venta.direccion_cliente || ''}</span></div>
          <div className="mb-2"><span className="font-medium text-gray-700">Correo Cliente:</span> <span className="text-gray-800">{venta.correo_cliente || ''}</span></div>
          <div className="mb-2"><span className="font-medium text-gray-700">Vendedor:</span> <span className="text-gray-800">{venta.vendedor || ''}</span></div>
        </div>
      </div>

      {/* Productos Vendidos */}
      <h2 className="text-lg font-semibold mb-2">Productos</h2>
      <div className="overflow-x-auto mb-4" style={{ maxHeight: '260px', overflowY: 'auto' }}>
        <table className="min-w-full bg-white rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-2 px-3 text-left">Producto</th>
              <th className="py-2 px-3 text-center">Cantidad</th>
              <th className="py-2 px-3 text-right">P. Unitario</th>
              <th className="py-2 px-3 text-right">IVA Unitario</th>
              <th className="py-2 px-3 text-right">Subtotal</th>
              <th className="py-2 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, idx) => {
              const precio = parseFloat(p.precio_unitario) || 0;
              const iva = parseFloat(p.IVA_unitario) || 0;
              const cantidad = parseFloat(p.cantidad) || 0;
              const subtotalProd = (precio * cantidad).toFixed(2);
              const totalProd = ((precio + iva) * cantidad).toFixed(2);
              return (
                <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-3">{p.nombre_producto}</td>
                  <td className="py-2 px-3 text-center">{p.cantidad}</td>
                  <td className="py-2 px-3 text-right">${precio.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">${iva.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-medium">${subtotalProd}</td>
                  <td className="py-2 px-3 text-right font-bold text-green-600">${totalProd}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {productos.length === 0 && (
        <p className="text-gray-500">No hay productos registrados en esta venta.</p>
      )}

      {/* Resumen de totales */}
      {productos.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 flex justify-end">
          {(() => {
            let subtotal = 0, total = 0;
            productos.forEach(p => {
              subtotal += Number(p.submonto);
              total += Number(p.monto);
            });
            return (
              <>
                <div className="text-right mr-8">
                  <div className="text-sm text-blue-600">Subtotal</div>
                  <div className="text-xl font-bold">${subtotal.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600">Total</div>
                  <div className="text-2xl font-bold text-green-600">${total.toFixed(2)}</div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Sección para el resultado de la factura electrónica */}
      {loadingFacturaElectronica && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-md text-center">
          Generando factura electrónica... Esto puede tardar unos segundos.
        </div>
      )}
      {errorFacturaElectronica && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
          <p className="font-semibold">Error al generar factura electrónica:</p>
          <p>{errorFacturaElectronica}</p>
        </div>
      )}
      {facturaElectronicaInfo && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-bold text-green-700 mb-2">✅ Factura Electrónica Generada con Éxito!</p>
          <p><strong>Número de Factura:</strong> {facturaElectronicaInfo.number}</p>
          <p><strong>CUFE:</strong> <span className="break-all text-sm">{facturaElectronicaInfo.cufe}</span></p>
          <p><strong>URL Pública:</strong> <a href={facturaElectronicaInfo.public_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
            <FiLink className="mr-1" /> Ver en Factus
          </a></p>
          <div className="flex space-x-2 mt-3">
            <a
              href={`http://localhost:3000/api/factus/factura/${facturaElectronicaInfo.number}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-semibold flex items-center"
            >
              <FiDownload className="mr-1" /> PDF
            </a>
            <a
              href={`http://localhost:3000/api/factus/factura/${facturaElectronicaInfo.number}/xml`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm font-semibold flex items-center"
            >
              <FiDownload className="mr-1" /> XML
            </a>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors shadow"
        >
          <FiChevronLeft className="mr-2" />
          Volver
        </button>
        <button
          onClick={() => generarPDFVenta(venta, productos)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold flex items-center shadow"
        >
          <FiDownload className="mr-2" />
          Generar factura ordinaria
        </button>
        {/* Botón para generar Factura Electrónica */}
        <button
          onClick={generarFacturaElectronica}
          disabled={loadingFacturaElectronica}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingFacturaElectronica ? 'Generando...' : <><FiSend className="mr-2" /> Generar Electrónica</>}
        </button>
        <button
          type="button"
          disabled={eliminando}
          onClick={() => setShowConfirmDelete(true)}
          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors disabled:opacity-60 shadow"
        >
          <FiTrash2 className="mr-2" />
          Eliminar
        </button>
      </div>
      {/* Modal de confirmación igual a HistorialVentas */}
      {showConfirmDelete && venta && (
        <ConfirmationModal
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que deseas eliminar la venta N° ${venta.numero}? Esta acción no se puede deshacer.`}
          onConfirm={eliminando ? undefined : eliminarVenta}
          onCancel={() => setShowConfirmDelete(false)}
          confirmText={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          cancelText="No, cancelar"
        />
      )}
    </div>
  );
};

export default VisualizacionVenta;