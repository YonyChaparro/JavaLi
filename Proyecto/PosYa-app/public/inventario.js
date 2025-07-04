window.addEventListener('DOMContentLoaded', async () => {
    const tabla = document.getElementById('tabla-inventario').querySelector('tbody');
    const btnAgregar = document.getElementById('agregar-fila');
    const btnGuardar = document.getElementById('guardar-inventario');
    let productos = [];
    let movimientos = [];

    // Cargar productos y tipos de movimiento desde el backend
    async function cargarDatos() {
        // Productos
        const respProd = await fetch('http://localhost:3000/api/productos');
        productos = respProd.ok ? await respProd.json() : [];
        // Tipos de movimiento
        const respMov = await fetch('http://localhost:3000/api/tipos-movimiento');
        movimientos = respMov.ok ? await respMov.json() : [];
    }

    // Agregar una fila nueva
    function actualizarOpcionesGlobal() {
        // Recolectar todas las combinaciones ya usadas
        const usadas = new Set();
        const usadosProd = new Set();
        const usadosMov = new Set();
        Array.from(tabla.querySelectorAll('tr')).forEach(row => {
            const selectProd = row.children[0].querySelector('select');
            const selectMov = row.children[2].querySelector('select');
            const prod = selectProd.value;
            const mov = selectMov.value;
            usadas.add(prod + '|' + mov);
            usadosProd.add(prod + '|' + mov);
            usadosMov.add(mov + '|' + prod);
        });
        // Para cada fila, filtrar productos y tipos de movimiento según lo seleccionado en otras filas
        Array.from(tabla.querySelectorAll('tr')).forEach(row => {
            const selectProd = row.children[0].querySelector('select');
            const selectMov = row.children[2].querySelector('select');
            const prodSel = selectProd.value;
            const movSel = selectMov.value;
            // Productos ya seleccionados con este tipo de movimiento en otras filas
            const productosUsados = new Set();
            Array.from(tabla.querySelectorAll('tr')).forEach(r2 => {
                if (r2 !== row) {
                    const p2 = r2.children[0].querySelector('select').value;
                    const m2 = r2.children[2].querySelector('select').value;
                    if (m2 === movSel) productosUsados.add(p2);
                }
            });
            // Tipos de movimiento ya seleccionados con este producto en otras filas
            const movimientosUsados = new Set();
            Array.from(tabla.querySelectorAll('tr')).forEach(r2 => {
                if (r2 !== row) {
                    const p2 = r2.children[0].querySelector('select').value;
                    const m2 = r2.children[2].querySelector('select').value;
                    if (p2 === prodSel) movimientosUsados.add(m2);
                }
            });
            // Filtrar productos
            Array.from(selectProd.options).forEach(opt => {
                opt.hidden = productosUsados.has(opt.value) && opt.value !== prodSel;
            });
            // Filtrar tipos de movimiento
            Array.from(selectMov.options).forEach(opt => {
                opt.hidden = movimientosUsados.has(opt.value) && opt.value !== movSel;
            });
        });
    }

    function agregarFila() {
        const tr = document.createElement('tr');
        // Producto
        const tdProd = document.createElement('td');
        const selectProd = document.createElement('select');
        // Opción vacía por defecto
        const optProdDefault = document.createElement('option');
        optProdDefault.value = '';
        optProdDefault.textContent = '-- Seleccione producto --';
        optProdDefault.selected = true;
        optProdDefault.disabled = true;
        selectProd.appendChild(optProdDefault);
        productos.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.pro_codigo;
            opt.textContent = p.pro_nombre;
            selectProd.appendChild(opt);
        });
        tdProd.appendChild(selectProd);
        // Cantidad
        const tdCant = document.createElement('td');
        const inputCant = document.createElement('input');
        inputCant.type = 'number';
        inputCant.min = '1';
        inputCant.required = true;
        tdCant.appendChild(inputCant);
        // Tipo de movimiento
        const tdMov = document.createElement('td');
        const selectMov = document.createElement('select');
        // Opción vacía por defecto
        const optMovDefault = document.createElement('option');
        optMovDefault.value = '';
        optMovDefault.textContent = '-- Seleccione movimiento --';
        optMovDefault.selected = true;
        optMovDefault.disabled = true;
        selectMov.appendChild(optMovDefault);
        movimientos.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.tip_codigo;
            opt.textContent = m.tip_nombre;
            selectMov.appendChild(opt);
        });
        tdMov.appendChild(selectMov);
        // Acción (eliminar)
        const tdAcc = document.createElement('td');
        const btnDel = document.createElement('button');
        btnDel.type = 'button';
        btnDel.textContent = 'Eliminar';
        btnDel.onclick = () => {
            tr.remove();
            actualizarOpcionesGlobal();
        };
        tdAcc.appendChild(btnDel);
        // Al cambiar selects, actualizar opciones globalmente
        selectProd.addEventListener('change', actualizarOpcionesGlobal);
        selectMov.addEventListener('change', actualizarOpcionesGlobal);
        // Agregar a la fila
        tr.appendChild(tdProd);
        tr.appendChild(tdCant);
        tr.appendChild(tdMov);
        tr.appendChild(tdAcc);
        tabla.appendChild(tr);
        // Inicializar opciones globalmente
        actualizarOpcionesGlobal();
    }

    // Guardar movimientos con validación de existencias
    async function guardarInventario() {
        const filas = Array.from(tabla.querySelectorAll('tr'));
        const movimientosData = filas.map(tr => {
            const selectProd = tr.children[0].querySelector('select');
            const inputCant = tr.children[1].querySelector('input');
            const selectMov = tr.children[2].querySelector('select');
            return {
                pro_codigo: selectProd.value,
                cantidad: Number(inputCant.value),
                tip_codigo: selectMov.value,
                tip_nombre: selectMov.options[selectMov.selectedIndex].textContent
            };
        }).filter(mov => mov.pro_codigo && mov.cantidad > 0 && mov.tip_codigo);
        if (movimientosData.length === 0) {
            alert('No hay movimientos válidos para guardar.');
            return;
        }
        // Validar duplicados producto + tipo de movimiento
        const combinaciones = new Set();
        for (const mov of movimientosData) {
            const clave = mov.pro_codigo + '|' + mov.tip_codigo;
            if (combinaciones.has(clave)) {
                alert('No puede haber dos filas con el mismo producto y el mismo tipo de movimiento.');
                return;
            }
            combinaciones.add(clave);
        }
        // Validar existencias para salidas
        for (const mov of movimientosData) {
            if (mov.tip_nombre.toLowerCase().includes('salida') || mov.tip_nombre.toLowerCase().includes('deterioro') || mov.tip_nombre.toLowerCase().includes('venta')) {
                // Consultar existencias actuales
                const resp = await fetch(`http://localhost:3000/api/existencias/${encodeURIComponent(mov.pro_codigo)}`);
                const data = await resp.json();
                if (data.existencias < mov.cantidad) {
                    alert(`No hay existencias suficientes para retirar ${mov.cantidad} unidades del producto seleccionado (existencias actuales: ${data.existencias}).`);
                    return;
                }
            }
        }
        // Si pasa la validación, guardar
        const resp = await fetch('http://localhost:3000/api/movimientos-inventario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movimientosData)
        });
        if (resp.ok) {
            alert('Movimientos guardados correctamente.');
            location.reload();
        } else {
            alert('Error al guardar los movimientos.');
        }
    }

    await cargarDatos();
    btnAgregar.addEventListener('click', agregarFila);
    btnGuardar.addEventListener('click', guardarInventario);
    agregarFila();
});
