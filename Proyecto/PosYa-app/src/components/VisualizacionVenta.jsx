import React, { useEffect, useState } from 'react';

const VisualizacionVenta = ({ codigo, onClose }) => {
  const [venta, setVenta] = useState(null);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const clienteNombre = venta.ven_nombre_cliente && venta.ven_apellido_cliente
            ? `${venta.ven_nombre_cliente} ${venta.ven_apellido_cliente}`
            : (venta.ven_razon_social_cliente || venta.cliente || '');
        if (clienteDivs[1]) clienteDivs[1].textContent = clienteNombre;
        if (clienteDivs[2]) clienteDivs[2].textContent = `Dirección: ${venta.ven_direccion_cliente || venta.direccion_cliente || ''}`;
        if (clienteDivs[3]) clienteDivs[3].textContent = `Correo: ${venta.ven_correo_electronico_cliente || venta.correo_cliente || ''}`;
        if (clienteDivs[4]) clienteDivs[4].textContent = `Teléfono: ${venta.telefono_cliente || ''}`;
    }

    const datosFactura = docHTML.querySelectorAll('.datos-factura .dato');
    if (datosFactura[0]) datosFactura[0].innerHTML = `<strong>Factura No.:</strong> ${venta.ven_codigo || venta.numero || ''}`;
    if (datosFactura[1]) datosFactura[1].innerHTML = `<strong>Fecha:</strong> ${venta.ven_fecha || venta.fecha || ''}`;
    if (datosFactura[2]) datosFactura[2].innerHTML = `<strong>Hora:</strong> ${venta.ven_hora || venta.hora || ''}`;

    const tbody = docHTML.querySelector('.productos-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        let subtotal = 0, totalIVA = 0, total = 0;
        productos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.det_nombre_producto}</td>
                <td>${p.det_cantidad}</td>
                <td>$${Number(p.det_precio_unitario).toFixed(2)}</td>
                <td>$${Number(p.det_IVA_unitario).toFixed(2)}</td>
                <td>$${Number(p.det_submonto).toFixed(2)}</td>
                <td>$${Number(p.det_monto).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
            subtotal += Number(p.det_submonto);
            totalIVA += Number(p.det_IVA_unitario) * Number(p.det_cantidad);
            total += Number(p.det_monto);
        });
        const totales = docHTML.querySelectorAll('.totales .linea');
        if (totales[0]) totales[0].innerHTML = `Subtotal: <strong>$${subtotal.toFixed(2)}</strong>`;
        if (totales[1]) totales[1].innerHTML = `IVA: <strong>$${totalIVA.toFixed(2)}</strong>`;
        if (totales[2]) totales[2].innerHTML = `Otros: <strong>$0.00</strong>`;
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
    const nombreArchivo = `venta_${venta.numero || venta.ven_codigo || 'factura'}.pdf`;
    doc.save(nombreArchivo);
    setTimeout(() => iframe.remove(), 500);
}


  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-6xl mx-auto relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold">×</button>
      )}
      <h1 className="text-3xl font-bold mb-6 text-center">Detalle de Venta</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Información General</h2>
        <p><strong>Número:</strong> {venta.numero}</p>
        <p><strong>Fecha:</strong> {venta.fecha}</p>
        <p><strong>Hora:</strong> {venta.hora}</p>
        <p><strong>Cliente:</strong> {venta.cliente}</p>
        <p><strong>Total:</strong> {venta.total}</p>
        <p><strong>Dirección Cliente:</strong> {venta.direccion_cliente || ''}</p>
        <p><strong>Correo Cliente:</strong> {venta.correo_cliente || ''}</p>
        <p><strong>Vendedor:</strong> {venta.vendedor || ''}</p>
        <button onClick={() => generarPDFVenta(venta, productos)} className="mt-4 mb-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">Descargar PDF</button>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Productos Vendidos</h2>
        {productos.length > 0 ? (
          <div className="overflow-x-auto md:overflow-x-visible">
            <table className="min-w-full bg-white rounded-lg shadow mr-8">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-1 px-2 text-xs whitespace-nowrap">Producto</th>
                  <th className="py-1 px-2 text-xs whitespace-nowrap">Cantidad</th>
                  <th className="py-1 px-2 text-xs whitespace-nowrap">Precio Unitario</th>
                  <th className="py-1 px-2 text-xs whitespace-nowrap">IVA</th>
                  <th className="py-1 px-2 text-xs whitespace-nowrap">Subtotal</th>
                  <th className="py-1 px-2 text-xs whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, idx) => (
                  <tr key={idx}>
                    <td className="py-1 px-2 text-xs whitespace-nowrap">{p.det_nombre_producto}</td>
                    <td className="py-1 px-2 text-xs whitespace-nowrap">{p.det_cantidad}</td>
                    <td className="py-1 px-2 text-xs whitespace-nowrap">${Number(p.det_precio_unitario).toFixed(2)}</td>
                    <td className="py-1 px-2 text-xs whitespace-nowrap">${Number(p.det_IVA_unitario).toFixed(2)}</td>
                    <td className="py-1 px-2 text-xs whitespace-nowrap">${Number(p.det_submonto).toFixed(2)}</td>
                    <td className="py-1 px-2 text-xs whitespace-nowrap">${Number(p.det_monto).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay productos registrados en esta venta.</p>
        )}
        {/* Subtotal y Total al pie */}
        {productos.length > 0 && (
          <div className="flex flex-col items-end mt-4">
            {(() => {
              let subtotal = 0, total = 0;
              productos.forEach(p => {
                subtotal += Number(p.det_submonto);
                total += Number(p.det_monto);
              });
              return (
                <>
                  <div className="text-base font-semibold">Subtotal: <span className="font-normal">${subtotal.toFixed(2)}</span></div>
                  <div className="text-lg font-bold">Total: <span className="font-normal">${total.toFixed(2)}</span></div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizacionVenta;
