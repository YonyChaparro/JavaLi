// Este script asume que se ejecuta en Electron y que Node.js está disponible en el contexto del navegador.
// Si usas Vite+Electron, asegúrate de exponer Node.js en el preload script.

// Ahora se usa fetch para obtener los datos del backend
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Si en el futuro necesitas filtros, puedes usar URLSearchParams igual que en reportes.js
        // const params = new URLSearchParams({ filtro1: valor1, filtro2: valor2 });
        // const resp = await fetch(`http://localhost:3000/api/tipos-movimiento?${params.toString()}`);
        const resp = await fetch('http://localhost:3000/api/tipos-movimiento');
        const rows = await resp.json();
        const tbody = document.getElementById('tabla-tipos-movimiento');
        tbody.innerHTML = '';
        if (!Array.isArray(rows) || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No hay registros</td></tr>';
            return;
        }
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-2 px-4 border-b">${row.tip_codigo}</td>
                <td class="py-2 px-4 border-b">${row.tip_nombre}</td>
                <td class="py-2 px-4 border-b">${row.tip_tipo_flujo}</td>
                <td class="py-2 px-4 border-b text-center">
                    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded mr-2" onclick="editarTipoMovimiento('${row.tip_codigo}')">Editar</button>
                    <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded" onclick="eliminarTipoMovimiento('${row.tip_codigo}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        const tbody = document.getElementById('tabla-tipos-movimiento');
        tbody.innerHTML = '<tr><td colspan="3">Error al cargar los datos</td></tr>';
        console.error('Error al consultar el endpoint:', err);
    }
});

// Funciones placeholder para editar y eliminar
window.editarTipoMovimiento = function(codigo) {
    const win = window.open(`editar_tipo_de_movimiento.html?codigo=${codigo}`, '_blank', 'width=500,height=500');
    if (win) {
        const timer = setInterval(() => {
            if (win.closed) {
                clearInterval(timer);
                location.reload();
            }
        }, 500);
    }
}
window.eliminarTipoMovimiento = async function(codigo) {
    if (confirm('¿Estás seguro de que deseas eliminar el tipo de movimiento con código ' + codigo + '?')) {
        try {
            const resp = await fetch(`http://localhost:3000/api/tipos-movimiento/${codigo}`, {
                method: 'DELETE'
            });
            if (resp.ok) {
                // Recargar la tabla tras eliminar
                location.reload();
            } else {
                const data = await resp.json();
                alert('Error al eliminar: ' + (data.error || 'Error desconocido'));
            }
        } catch (err) {
            alert('Error de red al eliminar: ' + err);
        }
    }
}

// Mostrar formulario modal para crear tipo de movimiento
function mostrarFormularioCrear() {
    // Si ya existe el modal, no lo agregues de nuevo
    if (document.getElementById('modal-crear-tipo')) return;
    const modal = document.createElement('div');
    modal.id = 'modal-crear-tipo';
    modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50';
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Crear tipo de movimiento</h2>
            <form id="form-crear-tipo">
                <div class="mb-4">
                    <label class="block mb-1 font-semibold">Nombre</label>
                    <input type="text" name="nombre" class="w-full border rounded px-3 py-2" required />
                </div>
                <div class="mb-4">
                    <label class="block mb-1 font-semibold">Tipo de flujo</label>
                    <select name="flujo" class="w-full border rounded px-3 py-2" required>
                        <option value="Entrada">Entrada</option>
                        <option value="Salida">Salida</option>
                    </select>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="button" id="cancelar-crear-tipo" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
                    <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Crear</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cancelar-crear-tipo').onclick = () => modal.remove();
    document.getElementById('form-crear-tipo').onsubmit = async function(e) {
        e.preventDefault();
        const nombre = this.nombre.value.trim();
        const flujo = this.flujo.value;
        // Validaciones
        if (nombre.length < 3 || nombre.length > 50) {
            alert('El nombre debe tener entre 3 y 50 caracteres.');
            this.nombre.focus();
            return;
        }
        if (flujo !== 'Entrada' && flujo !== 'Salida') {
            alert('Tipo de flujo inválido.');
            this.flujo.focus();
            return;
        }
        try {
            const resp = await fetch('http://localhost:3000/api/tipos-movimiento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tip_nombre: nombre, tip_tipo_flujo: flujo })
            });
            if (resp.ok) {
                modal.remove();
                location.reload();
            } else {
                const data = await resp.json();
                alert('Error al crear: ' + (data.error || 'Error desconocido'));
            }
        } catch (err) {
            alert('Error de red al crear: ' + err);
        }
    };
}

// Evento para el botón de crear tipo de movimiento
window.addEventListener('DOMContentLoaded', () => {
    const btnCrear = document.getElementById('btn-crear-tipo-movimiento');
    if (btnCrear) {
        btnCrear.addEventListener('click', () => {
            const win = window.open('crear_tipo_de_movimiento.html', '_blank', 'width=500,height=500');
            if (win) {
                const timer = setInterval(() => {
                    if (win.closed) {
                        clearInterval(timer);
                        location.reload();
                    }
                }, 500);
            }
        });
    }
});
