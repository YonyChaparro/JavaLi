window.addEventListener('DOMContentLoaded', async () => {
    // Obtener el formulario y los campos
    const form = document.getElementById('form-vendedor');
    const fields = [
        'ven_NIT',
        'ven_nombre_o_razon_social',
        'ven_direccion',
        'ven_numero_de_contacto',
        'ven_municipio',
        'ven_responsabilidad_fiscal'
    ];

    // Cargar datos del vendedor existente (si hay)
    try {
        const resp = await fetch('http://localhost:3000/api/vendedor');
        if (resp.ok) {
            const vendedor = await resp.json();
            if (vendedor) {
                fields.forEach(f => {
                    if (vendedor[f] !== undefined && document.getElementById(f)) {
                        document.getElementById(f).value = vendedor[f];
                    }
                });
            }
        }
    } catch (e) {
        // No hay vendedor o error, no hacer nada
    }

    // Guardar cambios al enviar el formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {};
        fields.forEach(f => {
            data[f] = document.getElementById(f).value.trim();
        });
        // Enviar datos al backend
        const resp = await fetch('http://localhost:3000/api/vendedor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (resp.ok) {
            alert('Datos del vendedor guardados correctamente.');
            location.reload();
        } else {
            alert('Error al guardar los datos del vendedor.');
        }
    });
});
