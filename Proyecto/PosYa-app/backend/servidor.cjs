// servidor.cjs
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { 
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
} = require('./commands.cjs'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Conexión a la base de datos SQLite
const dbPath = path.join(__dirname, 'base_de_datos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Ejecutar script SQL para crear las tablas
const sqlPath = path.join(__dirname, 'base_de_datos.sql');
const sqlScript = fs.readFileSync(sqlPath, 'utf8');
db.exec(sqlScript, (err) => {
  if (err) {
    console.error('Error al crear las tablas desde base_de_datos.sql:', err.message);
  } else {
    console.log('Tablas creadas correctamente desde base_de_datos.sql');
  }
});

// -----------------------------------------------------------------------------------
// Command Invoker
// Este invocador se encarga de ejecutar los comandos de forma segura, manejando transacciones si es necesario
// -----------------------------------------------------------------------------------

class CommandInvoker {
    constructor(db) {
        this.db = db;
    }

    async executeCommand(command) {
        try {
            // Solo inicia transacción si el comando lo requiere
            if (command.requiresTransaction) {
                await new Promise((resolve, reject) => {
                    this.db.run('BEGIN TRANSACTION', [], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }

            const result = await command.execute();

            if (command.requiresTransaction) {
                await new Promise((resolve, reject) => {
                    this.db.run('COMMIT', [], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }

            return result;
        } catch (error) {
            if (command.requiresTransaction) {
                await new Promise((resolve, reject) => {
                    this.db.run('ROLLBACK', [], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            console.error(`Command failed: ${error.message}`);
            throw error;
        }
    }
}

const invoker = new CommandInvoker(db);



// -----------------------------------------------------------------------------------
// Modulo Vendedor
// Este comando se encarga de crear o actualizar un vendedor en la base de datos
// -----------------------------------------------------------------------------------

// Endpoint para crear o actualizar el único vendedor
app.post('/api/vendedor', express.json(), async (req, res) => {
    try {
        const command = new CreateVendedorCommand(db, req.body);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// -----------------------------------------------------------------------------------
// Modulo Cliente
// Estos comandos se encargan de crear, actualizar o eliminar un cliente en la base de datos
// -----------------------------------------------------------------------------------

// Endpoint para crear un cliente
app.post('/api/clientes', express.json(), async (req, res) => {
    try {
        const command = new CreateClienteCommand(db, req.body);
        const result = await invoker.executeCommand(command);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para actualizar un cliente
app.put('/api/clientes/:id', express.json(), async (req, res) => {
    try {
        const command = new UpdateClienteCommand(db, req.params.id, req.body);
        const result = await command.execute();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para eliminar un cliente
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const command = new DeleteClienteCommand(db, req.params.id);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// -----------------------------------------------------------------------------------
// Modulo Producto
// Estos comandos se encargan de crear, actualizar o eliminar productos en la base de datos
// -----------------------------------------------------------------------------------

// Endpoint para crear un producto
app.post('/api/productos', express.json(), async (req, res) => {
    try {
        console.log('Datos recibidos para producto:', req.body); // Para depuración
        
        if (!req.body.codigo) {
            req.body.codigo = `PROD-${Date.now()}`; // Generar código si no viene
        }
        
        const command = new CreateProductoCommand(db, req.body);
        const result = await invoker.executeCommand(command);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error al crear producto:', err); // Para depuración
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para actualizar un producto
app.put('/api/productos/:codigo', express.json(), async (req, res) => {
    try {
        const command = new UpdateProductoCommand(db, req.params.codigo, req.body);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para eliminar un producto
app.delete('/api/productos/:codigo', async (req, res) => {
    try {
        const command = new DeleteProductoCommand(db, req.params.codigo);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// -----------------------------------------------------------------------------------
// Modulo Venta
// Estos comandos se encargan de crear o eliminar una venta en la base de datos
// -----------------------------------------------------------------------------------

// Endpoint para registrar una venta
app.post('/api/venta', express.json(), async (req, res) => {
    try {
        const command = new CreateVentaCommand(db, req.body);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para eliminar una venta
app.delete('/api/venta/:codigo', async (req, res) => {
    try {
        const command = new DeleteVentaCommand(db, req.params.codigo);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// -----------------------------------------------------------------------------------
// Modulo Movimientos de Inventario
// Este comando se encarga de crear movimientos de inventario en la base de datos
// -----------------------------------------------------------------------------------

// Endpoint para crear un tipo de movimiento de inventario
app.post('/api/tipos-movimiento', express.json(), async (req, res) => {
    try {
        const command = new CreateTipoMovimientoCommand(db, req.body);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// -----------------------------------------------------------------------------------
// Modulo Tipo Movimiento
// Estos comandos se encargan de crear, actualizar o eliminar tipos de movimiento en la base de datos
// -----------------------------------------------------------------------------------


// Endpoint para guardar movimientos de inventario
app.post('/api/movimientos-inventario', express.json(), async (req, res) => {
    try {
        const command = new CreateMovimientosInventarioCommand(db, req.body);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para actualizar un tipo de movimiento
app.put('/api/tipos-movimiento/:codigo', express.json(), async (req, res) => {
    try {
        const command = new UpdateTipoMovimientoCommand(db, req.params.codigo, req.body);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para eliminar un tipo de movimiento
app.delete('/api/tipos-movimiento/:codigo', async (req, res) => {
    try {
        const command = new DeleteTipoMovimientoCommand(db, req.params.codigo);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// -----------------------------------------------------------------------------------
// Modulo Consultas
// Estos comandos se encargan de realizar consultas específicas a la base de datos
// -----------------------------------------------------------------------------------

// Endpoint para consultar existencias actuales de un producto
app.get('/api/existencias/:codigo_producto', async (req, res) => {
    try {
        const command = new GetExistenciasCommand(db, req.params.codigo_producto);
        const existencias = await invoker.executeCommand(command);
        res.json(existencias);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener todos los movimientos de inventario con paginación
app.get('/api/movimientos-inventario', async (req, res) => {
    try {
        const filters = {
            page: req.query.page,
            limit: req.query.limit,
            producto: req.query.producto,
            tipoMovimiento: req.query.tipoMovimiento,
            tipoFlujo: req.query.tipoFlujo,
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin
        };
        
        const command = new GetMovimientosInventarioCommand(db, filters);
        const result = await invoker.executeCommand(command);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener el historial de movimientos de un producto específico
app.get('/api/movimientos-inventario/producto/:codigo_producto', async (req, res) => {
    try {
        const command = new GetMovimientosProductoCommand(
            db, 
            req.params.codigo_producto, 
            req.query.limit
        );
        const movimientos = await invoker.executeCommand(command);
        res.json(movimientos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener el resumen de movimientos por producto (para reportes)
app.get('/api/movimientos-inventario/resumen', async (req, res) => {
    try {
        const command = new GetResumenMovimientosCommand(db, {
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin
        });
        const resumen = await invoker.executeCommand(command);
        res.json(resumen);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener el único vendedor
app.get('/api/vendedor', async (req, res) => {
    try {
        const command = new GetVendedorCommand(db);
        const vendedor = await invoker.executeCommand(command);
        if (!vendedor) return res.status(204).send();
        res.json(vendedor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para generar reporte
app.get('/api/reportes', async (req, res) => {
    try {
        const command = new GetReportesCommand(db, {
            producto: req.query.producto,
            fechaInicio: req.query.fechaInicio,
            fechaFin: req.query.fechaFin
        });
        const reporte = await invoker.executeCommand(command);
        res.json(reporte);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener productos vendidos
app.get('/api/productos-vendidos', async (req, res) => {
    try {
        const command = new GetProductosVendidosCommand(db);
        const productos = await invoker.executeCommand(command);
        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener historial de ventas
app.get('/api/historial_ventas', async (req, res) => {
    try {
        const command = new GetHistorialVentasCommand(db);
        const ventas = await invoker.executeCommand(command);
        res.json(ventas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener detalle de productos vendidos en una venta
app.get('/api/venta_detalle', async (req, res) => {
    try {
        const codigo = req.query.codigo;
        if (!codigo) return res.status(400).json({ error: 'Código requerido' });
        
        const command = new GetVentaDetalleCommand(db, codigo);
        const detalle = await invoker.executeCommand(command);
        res.json(detalle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener tipos de movimiento de inventario
app.get('/api/tipos-movimiento', async (req, res) => {
    try {
        const command = new GetTiposMovimientoCommand(db);
        const tipos = await invoker.executeCommand(command);
        res.json(tipos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener un tipo de movimiento por código
app.get('/api/tipos-movimiento/:codigo', async (req, res) => {
    try {
        const command = new GetTipoMovimientoCommand(db, req.params.codigo);
        const tipo = await invoker.executeCommand(command);
        res.json(tipo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const command = new GetClientesCommand(db);
        const clientes = await invoker.executeCommand(command);
        res.json(clientes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const command = new GetProductosCommand(db);
        const productos = await invoker.executeCommand(command);
        res.json(productos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para obtener información general de una venta
app.get('/api/venta', async (req, res) => {
    try {
        const codigo = req.query.codigo;
        if (!codigo) return res.status(400).json({ error: 'Código requerido' });
        
        const command = new GetVentaCommand(db, codigo);
        const venta = await invoker.executeCommand(command);
        res.json(venta);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});