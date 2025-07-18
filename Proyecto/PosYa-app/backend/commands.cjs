// commands.cjs
class Command {
    constructor(db) {
        if (new.target === Command) {
            throw new Error("Command is an abstract class and cannot be instantiated directly");
        }
        this.db = db;
        this.requiresTransaction = false; // Agrega esta línea
    }

    async execute() {
        throw new Error("Method 'execute()' must be implemented");
    }
}

// Modulo Vendedor
// Este comando se encarga de crear o actualizar un vendedor en la base de datos
class CreateVendedorCommand extends Command {
    constructor(db, vendedorData) {
        super(db);
        this.vendedorData = vendedorData;
        this.requiresTransaction = true;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM VENDEDOR', [], (err) => {
                if (err) return reject(err);
                
                this.db.run(
                    `INSERT INTO VENDEDOR (NIT, nombre_o_razon_social, direccion, numero_de_contacto, municipio, responsabilidad_fiscal)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        this.vendedorData.NIT,
                        this.vendedorData.nombre_o_razon_social,
                        this.vendedorData.direccion,
                        this.vendedorData.numero_de_contacto,
                        this.vendedorData.municipio,
                        this.vendedorData.responsabilidad_fiscal
                    ],
                    function(err) {
                        if (err) return reject(err);
                        resolve({ ok: true });
                    }
                );
            });
        });
    }
}

// Modulo Cliente
// Estos comandos se encargan de crear, actualizar o eliminar un cliente en la base de datos
class CreateClienteCommand extends Command {
    constructor(db, clienteData) {
        super(db);
        this.clienteData = clienteData;
        this.requiresTransaction = true;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            // Insertar en CLIENTE
            this.db.run(
                'INSERT OR REPLACE INTO CLIENTE (identificacion, direccion, correo_electronico, ciudad, numero_telefonico) VALUES (?, ?, ?, ?, ?)',
                [
                    this.clienteData.numeroDocumento,
                    this.clienteData.direccion || '',
                    this.clienteData.correo_electronico,
                    this.clienteData.ciudad || '',
                    this.clienteData.numero_telefonico || ''
                ],
                (err) => {
                    if (err) return reject(err);
                    
                    if (this.clienteData.tipoCliente === 'natural') {
                        const nombreCompleto = [this.clienteData.primerNombre, this.clienteData.segundoNombre].filter(Boolean).join(' ');
                        const apellidoCompleto = [this.clienteData.primerApellido, this.clienteData.segundoApellido].filter(Boolean).join(' ');
                        
                        this.db.run(
                            'INSERT OR REPLACE INTO CLIENTE_NATURAL (identificacion, tipo_de_documento, nombre, apellido) VALUES (?, ?, ?, ?)',
                            [
                                this.clienteData.numeroDocumento,
                                this.clienteData.tipoDocumento || '',
                                nombreCompleto,
                                apellidoCompleto
                            ],
                            (err) => {
                                if (err) return reject(err);
                                resolve({
                                    tipo: 'natural',
                                    id: this.clienteData.numeroDocumento,
                                    ...this.clienteData
                                });
                            }
                        );
                    } else if (this.clienteData.tipoCliente === 'juridica') {
                        this.db.run(
                            'INSERT OR REPLACE INTO CLIENTE_JURIDICO (identificacion, razon_social) VALUES (?, ?)',
                            [this.clienteData.numeroDocumento, this.clienteData.razonSocial],
                            (err) => {
                                if (err) return reject(err);
                                resolve({
                                    tipo: 'juridica',
                                    id: this.clienteData.numeroDocumento,
                                    ...this.clienteData
                                });
                            }
                        );
                    } else {
                        reject(new Error('Tipo de cliente desconocido'));
                    }
                }
            );
        });
    }
}

class UpdateClienteCommand extends Command {
    constructor(db, id, clienteData) {
        super(db);
        this.id = id;
        this.clienteData = clienteData;
        this.requiresTransaction = true;
    }

    async execute() {
        const {
            tipoCliente,
            primerNombre,
            segundoNombre,
            primerApellido,
            segundoApellido,
            razonSocial,
            tipoDocumento,
            numeroDocumento,
            direccion,
            ciudad,
            numero_telefonico,
            correo_electronico
        } = this.clienteData;

        if (!numeroDocumento || !correo_electronico) {
            throw new Error('Faltan campos obligatorios');
        }

        return new Promise((resolve, reject) => {
            // Actualizar CLIENTE
            this.db.run(
                'UPDATE CLIENTE SET direccion = ?, correo_electronico = ?, ciudad = ?, numero_telefonico = ? WHERE identificacion = ?',
                [direccion || '', correo_electronico, ciudad || '', numero_telefonico || '', this.id],
                (err) => {
                    if (err) return reject(err);
                    
                    if (tipoCliente === 'natural') {
                        const nombreCompleto = [primerNombre, segundoNombre].filter(Boolean).join(' ');
                        const apellidoCompleto = [primerApellido, segundoApellido].filter(Boolean).join(' ');
                        
                        this.db.run(
                            'UPDATE CLIENTE_NATURAL SET tipo_de_documento = ?, nombre = ?, apellido = ? WHERE identificacion = ?',
                            [tipoDocumento || '', nombreCompleto, apellidoCompleto, this.id],
                            (err2) => {
                                if (err2) return reject(err2);
                                resolve({
                                    tipo: 'natural',
                                    id: this.id,
                                    primerNombre,
                                    segundoNombre,
                                    primerApellido,
                                    segundoApellido,
                                    tipoDocumento,
                                    numeroDocumento: this.id,
                                    direccion,
                                    ciudad,
                                    numero_telefonico,
                                    correo_electronico
                                });
                            }
                        );
                    } else if (tipoCliente === 'juridica') {
                        this.db.run(
                            'UPDATE CLIENTE_JURIDICO SET razon_social = ? WHERE identificacion = ?',
                            [razonSocial, this.id],
                            (err2) => {
                                if (err2) return reject(err2);
                                resolve({
                                    tipo: 'juridica',
                                    id: this.id,
                                    razonSocial,
                                    tipoDocumento: 'NIT',
                                    numeroDocumento: this.id,
                                    direccion,
                                    ciudad,
                                    numero_telefonico,
                                    correo_electronico
                                });
                            }
                        );
                    } else {
                        reject(new Error(`Tipo de cliente desconocido: ${tipoCliente}`));
                    }
                }
            );
        });
    }
}

class DeleteClienteCommand extends Command {
    constructor(db, id) {
        super(db);
        this.id = id;
        this.requiresTransaction = true;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('DELETE FROM CLIENTE_NATURAL WHERE identificacion = ?', [this.id]);
                this.db.run('DELETE FROM CLIENTE_JURIDICO WHERE identificacion = ?', [this.id]);
                this.db.run(
                    'DELETE FROM CLIENTE WHERE identificacion = ?', 
                    [this.id], 
                    function(err) {
                        if (err) return reject(err);
                        if (this.changes === 0) {
                            return reject(new Error('Cliente no encontrado'));
                        }
                        resolve({ ok: true, message: 'Cliente eliminado correctamente' });
                    }
                );
            });
        });
    }
}

// Modulo Producto
// Estos comandos se encargan de crear, actualizar o eliminar productos en la base de datos
class CreateProductoCommand extends Command {
    constructor(db, productoData) {
        super(db);
        if (!productoData) {
            throw new Error("Datos del producto no proporcionados");
        }
        this.productoData = productoData;
        this.requiresTransaction = true;
    }

    async execute() {
        // Desestructuración para evitar problemas con 'this'
        const { 
            codigo, 
            nombre, 
            costoUnitario, 
            precioUnitario, 
            descripcion = '', 
            exentoIVA = false, 
            tipoIVA = '19' 
        } = this.productoData;

        // Validación adicional
        if (!nombre || !costoUnitario || !precioUnitario) {
            throw new Error("Faltan campos obligatorios: nombre, costoUnitario o precioUnitario");
        }

        const tasaIVA = exentoIVA ? 0 : (parseFloat(tipoIVA) || 0.19);
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO PRODUCTO (
                    codigo, nombre, costo_unitario, precio, 
                    descripcion, estado, tasa_IVA
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    codigo,
                    nombre,
                    costoUnitario,
                    precioUnitario,
                    descripcion,
                    'activo',
                    tasaIVA
                ],
                function(err) {
                    if (err) return reject(err);
                    resolve({
                        codigo,
                        nombre,
                        costoUnitario,
                        precioUnitario,
                        descripcion,
                        estado: 'activo',
                        exentoIVA,
                        tipoIVA: tasaIVA
                    });
                }
            );
        });
    }
}

class UpdateProductoCommand extends Command {
    constructor(db, codigo, productoData) {
        super(db);
        this.codigo = codigo;
        this.productoData = productoData;
        this.requiresTransaction = true;
    }

    async execute() {
        const { 
            nombre,
            costoUnitario,
            precioUnitario,
            descripcion = '',
            estado = 'activo',
            tipoIVA = '19',
            exentoIVA = false
        } = this.productoData;

        if (!nombre || isNaN(costoUnitario) || isNaN(precioUnitario)) {
            throw new Error('Faltan campos obligatorios o datos inválidos');
        }

        const tasaIVA = exentoIVA ? 0 : (parseFloat(tipoIVA) || 0.19);

        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE PRODUCTO
                 SET nombre = ?, costo_unitario = ?, precio = ?, descripcion = ?, estado = ?, tasa_IVA = ?
                 WHERE codigo = ?`,
                [nombre, costoUnitario, precioUnitario, descripcion, estado, tasaIVA, this.codigo],
                function(err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new Error('Producto no encontrado'));
                    }
                    resolve({
                        codigo: this.codigo,
                        nombre,
                        costoUnitario,
                        precioUnitario,
                        descripcion,
                        estado,
                        tipoIVA: tasaIVA,
                        exentoIVA
                    });
                }
            );
        });
    }
}

class DeleteProductoCommand extends Command {
    constructor(db, codigo) {
        super(db);
        this.codigo = codigo;
        this.requiresTransaction = true;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM PRODUCTO WHERE codigo = ?',
                [this.codigo],
                function(err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new Error('Producto no encontrado'));
                    }
                    resolve({ ok: true });
                }
            );
        });
    }
}

// Modulo Venta
// Estos comandos se encargan de crear o eliminar una venta en la base de datos
class CreateVentaCommand extends Command {
    constructor(db, ventaData) {
        super(db);
        this.ventaData = ventaData;
    }

    async execute() {
        try {
            // Generar código de venta
            const nextVentaNum = await new Promise((resolve, reject) => {
                this.db.get('SELECT COUNT(*) as total FROM VENTA', [], (err, row) => {
                    if (err) reject(err);
                    else resolve(row.total + 1);
                });
            });
            const codigoVenta = 'V' + String(nextVentaNum).padStart(9, '0');

            // Buscar cliente
            const cliente = await new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM CLIENTE WHERE identificacion = ?', [this.ventaData.identificacion_cliente], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!cliente) throw new Error('Cliente no encontrado');

            // Buscar si es natural o jurídico
            const clienteNatural = await new Promise((resolve) => {
                this.db.get('SELECT * FROM CLIENTE_NATURAL WHERE identificacion = ?', [this.ventaData.identificacion_cliente], (err, row) => {
                    resolve(row);
                });
            });
            const clienteJuridico = await new Promise((resolve) => {
                this.db.get('SELECT * FROM CLIENTE_JURIDICO WHERE identificacion = ?', [this.ventaData.identificacion_cliente], (err, row) => {
                    resolve(row);
                });
            });

            // Calcular subtotal y total
            let subtotal = 0, total = 0;
            this.ventaData.productos.forEach(p => {
                const precio = parseFloat(p.precio_unitario) || 0;
                const iva = parseFloat(p.IVA_unitario) || 0;
                const cantidad = parseFloat(p.cantidad) || 0;
                subtotal += precio * cantidad;
                total += (precio + iva) * cantidad;
            });

            // Insertar la venta
            await new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT INTO VENTA (
                        codigo, fecha, hora, subtotal, total,
                        identificacion_cliente, tipo_identificacion_cliente,
                        nombre_cliente, apellido_cliente, razon_social_cliente,
                        direccion_cliente, numero_telefonico_cliente, ciudad_cliente, correo_electronico_cliente,
                        nombre_o_razon_social_vendedor, NIT_vendedor, direccion_vendedor, numero_de_contacto_vendedor, municipio_vendedor, responsabilidad_fiscal_vendedor
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        codigoVenta,
                        this.ventaData.fecha,
                        this.ventaData.hora,
                        subtotal,
                        total,
                        this.ventaData.identificacion_cliente,
                        clienteNatural ? (clienteNatural.tipo_de_documento || 'CC') : 'NIT',
                        clienteNatural ? clienteNatural.nombre : null,
                        clienteNatural ? clienteNatural.apellido : null,
                        clienteJuridico ? clienteJuridico.razon_social : null,
                        cliente.direccion,
                        cliente.numero_telefonico,
                        cliente.ciudad,
                        cliente.correo_electronico,
                        this.ventaData.nombre_o_razon_social_vendedor,
                        this.ventaData.NIT_vendedor,
                        this.ventaData.direccion_vendedor,
                        this.ventaData.numero_de_contacto_vendedor,
                        this.ventaData.municipio_vendedor,
                        this.ventaData.responsabilidad_fiscal_vendedor
                    ],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Insertar los productos vendidos
            const stmtDet = this.db.prepare('INSERT INTO DETALLE_PRODUCTO_VENDIDO (nombre_producto, cantidad, precio_unitario, costo_unitario, IVA_unitario, submonto, monto, codigo_venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            for (const p of this.ventaData.productos) {
                const prodInfo = await new Promise((resolve) => {
                    this.db.get('SELECT costo_unitario FROM PRODUCTO WHERE nombre = ?', [p.nombre], (err, row) => {
                        resolve(row);
                    });
                });

                const precio = parseFloat(p.precio_unitario) || 0;
                const iva = parseFloat(p.IVA_unitario) || 0;
                const cantidad = parseFloat(p.cantidad) || 0;
                const costo = prodInfo ? (parseFloat(prodInfo.costo_unitario) || 0) : 0;
                const submonto = precio * cantidad;
                const monto = (precio + iva) * cantidad;
                
                await new Promise((resolve, reject) => {
                    stmtDet.run(
                        p.nombre,
                        cantidad,
                        precio,
                        costo,
                        iva,
                        submonto,
                        monto,
                        codigoVenta,
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
            stmtDet.finalize();

            // Registrar movimientos de inventario
            const tipCodigoVenta = await new Promise((resolve, reject) => {
                this.db.get("SELECT codigo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE tipo_flujo = 'Salida' AND nombre LIKE '%Venta%' LIMIT 1", [], (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.codigo : null);
                });
            });
            if (!tipCodigoVenta) {
                throw new Error('No se encontró el tipo de movimiento para venta.');
            }

            const stmtMov = this.db.prepare('INSERT INTO MOVIMIENTO_INVENTARIO (fecha, cantidad, codigo_tipo_movimiento, codigo_producto) VALUES (?, ?, ?, ?)');
            for (const p of this.ventaData.productos) {
                const prod = await new Promise((resolve) => {
                    this.db.get('SELECT codigo FROM PRODUCTO WHERE nombre = ?', [p.nombre], (err, row) => {
                        resolve(row);
                    });
                });
                if (prod && prod.codigo) {
                    await new Promise((resolve, reject) => {
                        stmtMov.run(
                            this.ventaData.fecha,
                            Number(p.cantidad),
                            tipCodigoVenta,
                            prod.codigo,
                            function(err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                }
            }
            stmtMov.finalize();

            return { ok: true, codigo: codigoVenta };
        } catch (err) {
            throw err;
        }
    }
}

class DeleteVentaCommand extends Command {
    constructor(db, codigo) {
        super(db);
        this.codigo = codigo;
    }

    async execute() {
        try {
            // Eliminar movimientos de inventario asociados
            const productos = await new Promise((resolve, reject) => {
                this.db.all(
                    'SELECT nombre_producto, cantidad FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?', 
                    [this.codigo], 
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            const tipCodigoVenta = await new Promise((resolve, reject) => {
                this.db.get(
                    "SELECT codigo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE tipo_flujo = 'Salida' AND nombre LIKE '%Venta%' LIMIT 1", 
                    [], 
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row ? row.codigo : null);
                    }
                );
            });

            if (tipCodigoVenta) {
                for (const p of productos) {
                    const prod = await new Promise((resolve) => {
                        this.db.get(
                            'SELECT codigo FROM PRODUCTO WHERE nombre = ?', 
                            [p.nombre_producto], 
                            (err, row) => {
                                resolve(row);
                            }
                        );
                    });
                    
                    if (prod && prod.codigo) {
                        await new Promise((resolve, reject) => {
                            this.db.run(
                                'DELETE FROM MOVIMIENTO_INVENTARIO WHERE codigo_producto = ? AND codigo_tipo_movimiento = ? AND cantidad = ? AND fecha = (SELECT fecha FROM VENTA WHERE codigo = ?)', 
                                [prod.codigo, tipCodigoVenta, p.cantidad, this.codigo], 
                                function(err) {
                                    if (err) reject(err);
                                    else resolve();
                                }
                            );
                        });
                    }
                }
            }

            // Eliminar detalle de productos vendidos
            await new Promise((resolve, reject) => {
                this.db.run(
                    'DELETE FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?', 
                    [this.codigo], 
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Eliminar la venta
            await new Promise((resolve, reject) => {
                this.db.run(
                    'DELETE FROM VENTA WHERE codigo = ?', 
                    [this.codigo], 
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            return { ok: true };
        } catch (err) {
            throw err;
        }
    }
}

// Modulo Movimientos de Inventario
// Este comando se encarga de crear movimientos de inventario en la base de datos
class CreateMovimientosInventarioCommand extends Command {
    constructor(db, movimientosData) {
        super(db);
        this.movimientosData = movimientosData;
        this.requiresTransaction = true;
    }

    async execute() {
        if (!Array.isArray(this.movimientosData)) {
            throw new Error('Los movimientos deben ser un array');
        }

        if (this.movimientosData.length === 0) {
            throw new Error('No hay movimientos para guardar');
        }

        // Validar todos los movimientos antes de insertar
        this.movimientosData.forEach(mov => {
            if (!mov.codigo_producto || !mov.cantidad || !mov.codigo_tipo_movimiento) {
                throw new Error('Faltan campos requeridos en algún movimiento');
            }
        });

        const stmt = this.db.prepare(
            'INSERT INTO MOVIMIENTO_INVENTARIO (fecha, cantidad, codigo_tipo_movimiento, codigo_producto) VALUES (?, ?, ?, ?)'
        );

        // Usar la misma fecha para todos los movimientos (fecha actual)
        const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        try {
            // Ejecutar todas las inserciones en una transacción
            await new Promise((resolve, reject) => {
                this.db.serialize(() => {
                    this.db.run('BEGIN TRANSACTION');

                    this.movimientosData.forEach(mov => {
                        stmt.run(
                            fecha,
                            mov.cantidad,
                            parseInt(mov.codigo_tipo_movimiento, 10),
                            mov.codigo_producto,
                            function(err) {
                                if (err) {
                                    this.db.run('ROLLBACK');
                                    reject(err);
                                }
                            }
                        );
                    });

                    stmt.finalize(err => {
                        if (err) {
                            this.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            this.db.run('COMMIT', (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        }
                    });
                });
            });

            return { ok: true };
        } catch (err) {
            // Asegurarse de que el statement se cierra incluso si hay error
            stmt.finalize();
            throw err;
        }
    }
}

// Modulo Tipo Movimiento
// Estos comandos se encargan de crear, actualizar o eliminar tipos de movimiento en la base de datos
class CreateTipoMovimientoCommand extends Command {
    constructor(db, tipoMovimientoData) {
        super(db);
        this.tipoMovimientoData = tipoMovimientoData;
        this.requiresTransaction = true;
    }

    async execute() {
        const { nombre, tipo_flujo } = this.tipoMovimientoData;
        
        if (!nombre || !tipo_flujo) {
            throw new Error('Faltan campos requeridos');
        }

        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO TIPO_MOVIMIENTO_INVENTARIO (nombre, tipo_flujo) VALUES (?, ?)',
                [nombre, tipo_flujo],
                function(err) {
                    if (err) return reject(err);
                    resolve({ ok: true, codigo: this.lastID });
                }
            );
        });
    }
}

class UpdateTipoMovimientoCommand extends Command {
    constructor(db, codigo, tipoMovimientoData) {
        super(db);
        this.codigo = codigo;
        this.tipoMovimientoData = tipoMovimientoData;
        this.requiresTransaction = true;
    }

    async execute() {
        const { nombre, tipo_flujo } = this.tipoMovimientoData;
        
        if (!nombre || !tipo_flujo) {
            throw new Error('Faltan campos requeridos');
        }

        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE TIPO_MOVIMIENTO_INVENTARIO SET nombre = ?, tipo_flujo = ? WHERE codigo = ?',
                [nombre, tipo_flujo, this.codigo],
                function(err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new Error('Tipo de movimiento no encontrado'));
                    }
                    resolve({ ok: true });
                }
            );
        });
    }
}

class DeleteTipoMovimientoCommand extends Command {
    constructor(db, codigo) {
        super(db);
        this.codigo = codigo;
        this.requiresTransaction = true;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM TIPO_MOVIMIENTO_INVENTARIO WHERE codigo = ?',
                [this.codigo],
                function(err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new Error('Tipo de movimiento no encontrado'));
                    }
                    resolve({ ok: true });
                }
            );
        });
    }
}

// Modulo Consultas
// Estos comandos se encargan de realizar consultas específicas a la base de datos
class GetProductosCommand extends Command {
    async execute() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    p.codigo AS codigo,
                    p.nombre AS nombre,
                    p.precio AS precioUnitario,
                    p.costo_unitario AS costoUnitario,
                    p.descripcion AS descripcion,
                    p.tasa_IVA AS tipoIVA,
                    p.estado AS estado
                FROM PRODUCTO p
                ORDER BY p.nombre
            `, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

class GetClientesCommand extends Command {
    async execute() {
        return new Promise((resolve, reject) => {
            // Consulta clientes base
            this.db.all(
                `SELECT identificacion, direccion, correo_electronico, ciudad, numero_telefonico FROM CLIENTE`,
                [],
                (err, clientes) => {
                    if (err) return reject(err);
                    if (!clientes.length) return resolve([]);

                    // Consultar detalles de naturales y jurídicos
                    const ids = clientes.map(c => `'${c.identificacion}'`).join(',');
                    
                    Promise.all([
                        new Promise((res, rej) => {
                            this.db.all(`SELECT * FROM CLIENTE_NATURAL WHERE identificacion IN (${ids})`, [], (err, rows) => {
                                if (err) rej(err);
                                else res(rows);
                            });
                        }),
                        new Promise((res, rej) => {
                            this.db.all(`SELECT * FROM CLIENTE_JURIDICO WHERE identificacion IN (${ids})`, [], (err, rows) => {
                                if (err) rej(err);
                                else res(rows);
                            });
                        })
                    ]).then(([naturales, juridicos]) => {
                        // Unir datos
                        const naturalesMap = new Map(naturales.map(n => [n.identificacion, n]));
                        const juridicosMap = new Map(juridicos.map(j => [j.identificacion, j]));
                        
                        const resultado = clientes.map(c => {
                            if (naturalesMap.has(c.identificacion)) {
                                const n = naturalesMap.get(c.identificacion);
                                return {
                                    tipo: 'natural',
                                    id: c.identificacion,
                                    primerNombre: (n.nombre || '').split(' ')[0] || '',
                                    segundoNombre: (n.nombre || '').split(' ').slice(1).join(' '),
                                    primerApellido: (n.apellido || '').split(' ')[0] || '',
                                    segundoApellido: (n.apellido || '').split(' ').slice(1).join(' '),
                                    tipoDocumento: n.tipo_de_documento,
                                    numeroDocumento: c.identificacion,
                                    direccion: c.direccion,
                                    ciudad: c.ciudad,
                                    numero_telefonico: c.numero_telefonico,
                                    correo_electronico: c.correo_electronico
                                };
                            } else if (juridicosMap.has(c.identificacion)) {
                                const j = juridicosMap.get(c.identificacion);
                                return {
                                    tipo: 'juridica',
                                    id: c.identificacion,
                                    razonSocial: j.razon_social,
                                    tipoDocumento: 'NIT',
                                    numeroDocumento: c.identificacion,
                                    direccion: c.direccion,
                                    ciudad: c.ciudad,
                                    numero_telefonico: c.numero_telefonico,
                                    correo_electronico: c.correo_electronico
                                };
                            } else {
                                return {
                                    tipo: 'desconocido',
                                    id: c.identificacion,
                                    numeroDocumento: c.identificacion,
                                    direccion: c.direccion,
                                    ciudad: c.ciudad,
                                    numero_telefonico: c.numero_telefonico,
                                    correo_electronico: c.correo_electronico
                                };
                            }
                        });
                        resolve(resultado);
                    }).catch(reject);
                }
            );
        });
    }
}

class GetVendedorCommand extends Command {
    async execute() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM VENDEDOR LIMIT 1', [], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    }
}

class GetVentaCommand extends Command {
    constructor(db, codigo) {
        super(db);
        this.codigo = codigo;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT 
                    codigo AS numero,
                    fecha AS fecha,
                    hora AS hora,
                    CASE 
                        WHEN razon_social_cliente IS NOT NULL AND TRIM(razon_social_cliente) != '' THEN razon_social_cliente
                        ELSE TRIM(nombre_cliente || ' ' || IFNULL(apellido_cliente, ''))
                    END AS cliente,
                    total AS total,
                    direccion_cliente AS direccion_cliente,
                    correo_electronico_cliente AS correo_cliente,
                    numero_telefonico_cliente AS numero_telefonico_cliente,
                    nombre_o_razon_social_vendedor AS vendedor,
                    NIT_vendedor AS nit_vendedor,
                    direccion_vendedor AS direccion_vendedor,
                    numero_de_contacto_vendedor AS contacto_vendedor,
                    municipio_vendedor AS municipio_vendedor,
                    responsabilidad_fiscal_vendedor AS responsabilidad_fiscal_vendedor
                FROM VENTA
                WHERE codigo = ?
            `, [this.codigo], (err, row) => {
                if (err) return reject(err);
                if (!row) return reject(new Error('Venta no encontrada'));
                if (typeof row.total === 'number') {
                    row.total = `$${row.total.toFixed(2)}`;
                }
                resolve(row);
            });
        });
    }
}

class GetVentaDetalleCommand extends Command {
    constructor(db, codigo) {
        super(db);
        this.codigo = codigo;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    nombre_producto,
                    cantidad,
                    precio_unitario,
                    submonto,
                    IVA_unitario,
                    monto
                FROM DETALLE_PRODUCTO_VENDIDO
                WHERE codigo_venta = ?
            `, [this.codigo], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

class GetHistorialVentasCommand extends Command {
    async execute() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    codigo AS numero,
                    fecha AS fecha,
                    hora AS hora,
                    nombre_cliente || ' ' || IFNULL(apellido_cliente, '') AS cliente,
                    razon_social_cliente,
                    total AS total
                FROM VENTA
                ORDER BY fecha DESC, hora DESC
            `, [], (err, rows) => {
                if (err) return reject(err);
                const ventas = rows.map(v => ({
                    ...v,
                    total: typeof v.total === 'number' ? `$${v.total.toFixed(2)}` : v.total
                }));
                resolve(ventas);
            });
        });
    }
}

class GetTiposMovimientoCommand extends Command {
    async execute() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT codigo, nombre, tipo_flujo FROM TIPO_MOVIMIENTO_INVENTARIO', [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

class GetTipoMovimientoCommand extends Command {
    constructor(db, codigo) {
        super(db);
        this.codigo = codigo;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT codigo, nombre, tipo_flujo FROM TIPO_MOVIMIENTO_INVENTARIO WHERE codigo = ?', 
                [this.codigo], 
                (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new Error('Tipo de movimiento no encontrado'));
                    resolve(row);
                }
            );
        });
    }
}

class GetExistenciasCommand extends Command {
    constructor(db, codigo_producto) {
        super(db);
        this.codigo_producto = codigo_producto;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT IFNULL(SUM(CASE WHEN t.tipo_flujo = 'Entrada' THEN m.cantidad
                                     WHEN t.tipo_flujo = 'Salida' THEN -m.cantidad
                                     ELSE 0 END), 0) AS existencias
                FROM MOVIMIENTO_INVENTARIO m
                JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.codigo_tipo_movimiento = t.codigo
                WHERE m.codigo_producto = ?
            `, [this.codigo_producto], (err, row) => {
                if (err) return reject(err);
                resolve({ existencias: row ? row.existencias : 0 });
            });
        });
    }
}

class GetMovimientosInventarioCommand extends Command {
    constructor(db, filters = {}) {
        super(db);
        this.filters = filters;
    }

    async execute() {
        const { page = 1, limit = 10, producto, tipoMovimiento, tipoFlujo, fechaInicio, fechaFin } = this.filters;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                m.id,
                m.fecha,
                m.cantidad,
                m.codigo_tipo_movimiento,
                t.nombre AS tipo_movimiento,
                t.tipo_flujo,
                m.codigo_producto,
                p.nombre AS producto
            FROM MOVIMIENTO_INVENTARIO m
            JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.codigo_tipo_movimiento = t.codigo
            JOIN PRODUCTO p ON m.codigo_producto = p.codigo
            WHERE 1=1
        `;

        const params = [];

        if (producto) {
            query += ' AND (m.codigo_producto = ? OR p.nombre LIKE ?)';
            params.push(producto, `%${producto}%`);
        }

        if (tipoMovimiento) {
            query += ' AND (m.codigo_tipo_movimiento = ? OR t.nombre LIKE ?)';
            params.push(tipoMovimiento, `%${tipoMovimiento}%`);
        }

        if (tipoFlujo) {
            query += ' AND t.tipo_flujo = ?';
            params.push(tipoFlujo);
        }

        if (fechaInicio && fechaFin) {
            query += ' AND date(m.fecha) BETWEEN date(?) AND date(?)';
            params.push(fechaInicio, fechaFin);
        }

        query += ' ORDER BY m.fecha DESC, m.id DESC';

        const queryCount = `SELECT COUNT(*) as total FROM (${query})`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        try {
            const countRow = await new Promise((resolve, reject) => {
                this.db.get(queryCount, params.slice(0, -2), (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            const rows = await new Promise((resolve, reject) => {
                this.db.all(query, params, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });

            return {
                data: rows,
                pagination: {
                    total: countRow.total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(countRow.total / limit)
                }
            };
        } catch (err) {
            throw err;
        }
    }
}

class GetMovimientosProductoCommand extends Command {
    constructor(db, codigo_producto, limit = 50) {
        super(db);
        this.codigo_producto = codigo_producto;
        this.limit = limit;
    }

    async execute() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    m.id,
                    m.fecha,
                    m.cantidad,
                    t.nombre AS tipo_movimiento,
                    t.tipo_flujo,
                    CASE 
                        WHEN t.tipo_flujo = 'Entrada' THEN m.cantidad
                        WHEN t.tipo_flujo = 'Salida' THEN -m.cantidad
                        ELSE 0
                    END AS cantidad_con_signo
                FROM MOVIMIENTO_INVENTARIO m
                JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.codigo_tipo_movimiento = t.codigo
                WHERE m.codigo_producto = ?
                ORDER BY m.fecha DESC, m.id DESC
                LIMIT ?
            `, [this.codigo_producto, Number(this.limit)], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

class GetResumenMovimientosCommand extends Command {
    constructor(db, filters = {}) {
        super(db);
        this.filters = filters;
    }

    async execute() {
        const { fechaInicio, fechaFin } = this.filters;

        let query = `
            SELECT 
                p.codigo,
                p.nombre AS producto,
                SUM(CASE WHEN t.tipo_flujo = 'Entrada' THEN m.cantidad ELSE 0 END) AS entradas,
                SUM(CASE WHEN t.tipo_flujo = 'Salida' THEN m.cantidad ELSE 0 END) AS salidas,
                SUM(CASE WHEN t.tipo_flujo = 'Entrada' THEN m.cantidad ELSE -m.cantidad END) AS saldo
            FROM MOVIMIENTO_INVENTARIO m
            JOIN TIPO_MOVIMIENTO_INVENTARIO t ON m.codigo_tipo_movimiento = t.codigo
            JOIN PRODUCTO p ON m.codigo_producto = p.codigo
            WHERE 1=1
        `;

        const params = [];

        if (fechaInicio && fechaFin) {
            query += ' AND m.fecha BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
        }

        query += ' GROUP BY p.codigo, p.nombre ORDER BY p.nombre';

        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

class GetReportesCommand extends Command {
    constructor(db, filters = {}) {
        super(db);
        this.filters = filters;
    }

    async execute() {
        const { producto, fechaInicio, fechaFin } = this.filters;

        let query = `
            SELECT
                dpv.nombre_producto AS producto,
                SUM(dpv.monto) AS ingresos,
                SUM(dpv.cantidad * dpv.costo_unitario) AS costos,
                SUM(dpv.monto - (dpv.cantidad * dpv.costo_unitario)) AS utilidades,
                SUM(dpv.IVA_unitario * dpv.cantidad) AS iva
            FROM DETALLE_PRODUCTO_VENDIDO dpv
            JOIN VENTA v ON dpv.codigo_venta = v.codigo
            WHERE 1=1
        `;

        const params = [];

        if (producto) {
            query += ' AND dpv.nombre_producto = ?';
            params.push(producto);
        }

        if (fechaInicio && fechaFin) {
            query += ' AND v.fecha BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
        }

        query += ' GROUP BY dpv.nombre_producto';

        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

class GetProductosVendidosCommand extends Command {
    async execute() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT DISTINCT dpv.nombre_producto AS nombre
                FROM DETALLE_PRODUCTO_VENDIDO dpv
                ORDER BY nombre;
            `, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = {
    Command,
    CreateVendedorCommand,
    CreateClienteCommand,
    UpdateClienteCommand,
    DeleteClienteCommand,
    CreateProductoCommand,
    UpdateProductoCommand,
    DeleteProductoCommand,
    CreateVentaCommand,
    DeleteVentaCommand,
    CreateMovimientosInventarioCommand,
    CreateTipoMovimientoCommand,
    UpdateTipoMovimientoCommand,
    DeleteTipoMovimientoCommand,
    GetProductosCommand,
    GetClientesCommand,
    GetVendedorCommand,
    GetVentaCommand,
    GetVentaDetalleCommand,
    GetHistorialVentasCommand,
    GetTiposMovimientoCommand,
    GetTipoMovimientoCommand,
    GetExistenciasCommand,
    GetMovimientosInventarioCommand,
    GetMovimientosProductoCommand,
    GetResumenMovimientosCommand,
    GetReportesCommand,
    GetProductosVendidosCommand
};
