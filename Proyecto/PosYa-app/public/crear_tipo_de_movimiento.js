// Script para crear tipo de movimiento desde otra ventana

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-crear-tipo');
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
            const resp = await fetch('http://localhost:3000/api/tipos-movimiento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tip_nombre: nombre, tip_tipo_flujo: flujo })
            });
            if (resp.ok) {
                alert('Tipo de movimiento creado correctamente');
                window.close();
            } else {
                const data = await resp.json();
                alert('Error al crear: ' + (data.error || 'Error desconocido'));
            }
        } catch (err) {
            alert('Error de red al crear: ' + err);
        }
    };
});
