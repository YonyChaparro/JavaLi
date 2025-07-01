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
            if (!window.jspdf) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = () => generarPDF();
                document.body.appendChild(script);
            } else {
                generarPDF();
            }
            function generarPDF() {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                let y = 10;
                doc.setFontSize(16);
                doc.text('Detalle de Venta', 10, y);
                y += 10;
                doc.setFontSize(12);
                doc.text(`Número: ${venta.numero}`, 10, y); y += 7;
                doc.text(`Fecha: ${venta.fecha}`, 10, y); y += 7;
                doc.text(`Hora: ${venta.hora}`, 10, y); y += 7;
                doc.text(`Cliente: ${venta.cliente}`, 10, y); y += 7;
                doc.text(`Total: ${venta.total}`, 10, y); y += 7;
                doc.text(`Dirección Cliente: ${venta.direccion_cliente || ''}`, 10, y); y += 7;
                doc.text(`Correo Cliente: ${venta.correo_cliente || ''}`, 10, y); y += 7;
                doc.text(`Vendedor: ${venta.vendedor || ''}`, 10, y); y += 10;
                doc.setFontSize(14);
                doc.text('Productos Vendidos:', 10, y); y += 8;
                doc.setFontSize(10);
                doc.text('Producto | Cantidad | Precio Unitario | Subtotal | IVA | Total', 10, y); y += 6;
                productos.forEach(p => {
                    doc.text(
                        `${p.det_nombre_producto} | ${p.det_cantidad} | $${Number(p.det_precio_unitario).toFixed(2)} | $${Number(p.det_submonto).toFixed(2)} | $${Number(p.det_IVA_unitario).toFixed(2)} | $${Number(p.det_monto).toFixed(2)}`,
                        10, y
                    );
                    y += 6;
                    if (y > 270) { doc.addPage(); y = 10; }
                });
                doc.save(`venta_${venta.numero}.pdf`);
            }
        };
    } catch (error) {
        detalleVentaDiv.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
        detalleProductosDiv.innerHTML = '';
        console.error(error);
    }
});
