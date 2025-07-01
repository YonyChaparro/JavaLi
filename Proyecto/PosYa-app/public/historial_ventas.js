// Espera a que el DOM esté listo
window.addEventListener('DOMContentLoaded', async () => {
    const ventasLista = document.getElementById('ventas-lista');

    // Función para crear una fila de la tabla
    function crearFilaVenta(venta) {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="py-2 px-4">${venta.numero}</td>
            <td class="py-2 px-4">${venta.fecha}</td>
            <td class="py-2 px-4">${venta.hora}</td>
            <td class="py-2 px-4">${venta.cliente}</td>
            <td class="py-2 px-4">${venta.total}</td>
            <td class="py-2 px-4 text-center">
                <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2" title="Ver venta" onclick="window.open('venta.html?codigo=${venta.numero}', '_blank')">👁️</button>
                <button class="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded mr-2" title="Editar venta">✏️</button>
                <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" title="Eliminar venta">🗑️</button>
            </td>
        `;
        return tr;
    }

    // Obtener ventas desde el backend
    try {
        const response = await fetch('http://localhost:3000/api/historial_ventas');
        if (!response.ok) throw new Error('Error al obtener ventas');
        const ventas = await response.json();
        ventasLista.innerHTML = '';
        ventas.forEach(venta => {
            ventasLista.appendChild(crearFilaVenta(venta));
        });
        console.log('Ventas recibidas:', ventas);
    } catch (error) {
        ventasLista.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-red-500">No se pudieron cargar las ventas.</td></tr>`;
        console.error(error);
    }
});
