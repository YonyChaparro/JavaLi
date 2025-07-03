// Script para editar tipo de movimiento desde otra ventana

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('form-editar-tipo');
    const codigo = getQueryParam('codigo');
    if (!codigo) {
        alert('No se especificó el código a editar');
        window.close();
        return;
    }
    // Obtener datos actuales
    try {
        const resp = await fetch(`http://localhost:3000/api/tipos-movimiento/${codigo}`);
        if (!resp.ok) throw new Error('No se pudo obtener el registro');
        const data = await resp.json();
        form.codigo.value = data.tip_codigo;
        form.nombre.value = data.tip_nombre;
        form.flujo.value = data.tip_tipo_flujo;
    } catch (err) {
        alert('Error al cargar los datos: ' + err);
        window.close();
        return;
    }
    form.onsubmit = async function(e) {
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
            const resp = await fetch(`http://localhost:3000/api/tipos-movimiento/${codigo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tip_nombre: nombre, tip_tipo_flujo: flujo })
            });
            if (resp.ok) {
                alert('Tipo de movimiento actualizado correctamente');
                window.close();
            } else {
                const data = await resp.json();
                alert('Error al actualizar: ' + (data.error || 'Error desconocido'));
            }
        } catch (err) {
            alert('Error de red al actualizar: ' + err);
        }
    };
});
