window.addEventListener('DOMContentLoaded', async () => {
    // Obtener el código de la venta desde la URL
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('codigo');
    const detalleVentaDiv = document.getElementById('detalle-venta');
    const detalleProductosDiv = document.getElementById('detalle-productos');

    if (!codigo) {
        detalleVentaDiv.innerHTML = '<p class="text-red-500">No se proporcionó el código de la venta.</p>';
        return;
    }

    try {
        // Obtener información general de la venta
        const respVenta = await fetch(`http://localhost:3000/api/venta?codigo=${encodeURIComponent(codigo)}`);
        if (!respVenta.ok) throw new Error('No se pudo obtener la información de la venta');
        const venta = await respVenta.json();

        // Mostrar información general
        detalleVentaDiv.innerHTML = `
            <h2 class="text-xl font-semibold mb-4">Información General</h2>
            <p><strong>Número:</strong> ${venta.numero}</p>
            <p><strong>Fecha:</strong> ${venta.fecha}</p>
            <p><strong>Hora:</strong> ${venta.hora}</p>
            <p><strong>Cliente:</strong> ${venta.cliente}</p>
            <p><strong>Total:</strong> ${venta.total}</p>
            <p><strong>Dirección Cliente:</strong> ${venta.direccion_cliente || ''}</p>
            <p><strong>Correo Cliente:</strong> ${venta.correo_cliente || ''}</p>
            <p><strong>Vendedor:</strong> ${venta.vendedor || ''}</p>
        `;

        // Crear y agregar el botón para PDF
        const pdfBtn = document.createElement('button');
        pdfBtn.textContent = 'Descargar PDF de la venta';
        pdfBtn.className = 'mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold';
        detalleVentaDiv.parentNode.insertBefore(pdfBtn, detalleVentaDiv);

        // Obtener detalle de productos vendidos
        const respDetalle = await fetch(`http://localhost:3000/api/venta_detalle?codigo=${encodeURIComponent(codigo)}`);
        if (!respDetalle.ok) throw new Error('No se pudo obtener el detalle de productos');
        const productos = await respDetalle.json();

        // Mostrar detalle de productos
        if (productos.length > 0) {
            let tabla = `
                <h2 class="text-xl font-semibold mb-4">Productos Vendidos</h2>
                <table class="min-w-full bg-white rounded-lg shadow">
                    <thead>
                        <tr class="bg-gray-200 text-gray-700">
                            <th class="py-2 px-4">Producto</th>
                            <th class="py-2 px-4">Cantidad</th>
                            <th class="py-2 px-4">Precio Unitario</th>
                            <th class="py-2 px-4">Subtotal</th>
                            <th class="py-2 px-4">IVA</th>
                            <th class="py-2 px-4">Total</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            productos.forEach(p => {
                tabla += `
                    <tr>
                        <td class="py-2 px-4">${p.det_nombre_producto}</td>
                        <td class="py-2 px-4">${p.det_cantidad}</td>
                        <td class="py-2 px-4">$${Number(p.det_precio_unitario).toFixed(2)}</td>
                        <td class="py-2 px-4">$${Number(p.det_submonto).toFixed(2)}</td>
                        <td class="py-2 px-4">$${Number(p.det_IVA_unitario).toFixed(2)}</td>
                        <td class="py-2 px-4">$${Number(p.det_monto).toFixed(2)}</td>
                    </tr>
                `;
            });
            tabla += `</tbody></table>`;
            detalleProductosDiv.innerHTML = tabla;
        } else {
            detalleProductosDiv.innerHTML = '<p>No hay productos registrados en esta venta.</p>';
        }

        // Lógica para generar PDF con jsPDF
        pdfBtn.onclick = () => {

            generarPDFVenta(venta, productos);
  
        }

    } catch (error) {
        detalleVentaDiv.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
        detalleProductosDiv.innerHTML = '';
        console.error(error);
    }
});

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
