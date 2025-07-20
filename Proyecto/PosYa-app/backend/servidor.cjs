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

const { obtenerTokenFactus } = require('./services/factus-auth.cjs');
const { obtenerUltimoRangoActivoFactura, obtenerRangosDeNumeracion } = require('./services/factus-rangos.cjs');
const { enviarFacturaAFactus, descargarFacturaPdf, descargarFacturaXml } = require('./services/factus-factura.cjs');

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
// Modulo FACTUS - Facturación Electrónica
// Estos comandos se encargan de interactuar con la API de Factus para generar facturas electrónicas
// -----------------------------------------------------------------------------------

//// Endpoint para obtener rangos de numeración
//app.get('/api/factus/rangos/facturas', async (req, res) => {
//  try {
//    const command = new GetFactusRangosCommand(db, {
//      document: '01',
//      is_active: true
//    });
//    const rangos = await invoker.executeCommand(command);
//    res.json(rangos);
//  } catch (error) {
//    console.error('Error al obtener rangos:', error.message);
//    res.status(500).json({ error: error.message });
//  }
//});
//
//// Endpoint para generar factura electrónica
//app.post('/api/factus/generar-factura-db', async (req, res) => {
//  const { codigoVenta } = req.body;
//  
//  if (!codigoVenta) {
//    return res.status(400).json({ error: 'Se requiere el código de venta.' });
//  }
//
//  try {
//    const command = new GenerateFactusFacturaCommand(db, codigoVenta);
//    const resultado = await invoker.executeCommand(command);
//    res.json(resultado);
//  } catch (error) {
//    console.error('Error al generar factura:', error.message);
//    if (error.response?.data) {
//      res.status(error.response.status || 500).json({ 
//        error: error.response.data.message || 'Error de Factus',
//        details: error.response.data.errors 
//      });
//    } else {
//      res.status(500).json({ error: error.message });
//    }
//  }
//});
//
//// Endpoint para descargar PDF
//app.get('/api/factus/factura/:numeroFactura/pdf', async (req, res) => {
//  try {
//    const command = new DownloadFactusPdfCommand(db, req.params.numeroFactura);
//    const { fileName, pdfBase64 } = await invoker.executeCommand(command);
//    
//    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
//    const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
//    
//    res.set({
//      'Content-Type': 'application/pdf',
//      'Content-Disposition': `attachment; filename="${finalFileName}"`
//    });
//    res.send(pdfBuffer);
//  } catch (error) {
//    console.error('Error al descargar PDF:', error);
//    res.status(500).json({ error: error.message });
//  }
//});
//
//// Endpoint para descargar XML
//app.get('/api/factus/factura/:numeroFactura/xml', async (req, res) => {
//  try {
//    const command = new DownloadFactusXmlCommand(db, req.params.numeroFactura);
//    const { fileName, xmlBase64 } = await invoker.executeCommand(command);
//    
//    const xmlBuffer = Buffer.from(xmlBase64, 'base64');
//    const finalFileName = fileName.toLowerCase().endsWith('.xml') ? fileName : `${fileName}.xml`;
//    
//    res.set({
//      'Content-Type': 'application/xml',
//      'Content-Disposition': `attachment; filename="${finalFileName}"`
//    });
//    res.send(xmlBuffer);
//  } catch (error) {
//    console.error('Error al descargar XML:', error);
//    res.status(500).json({ error: error.message });
//  }
//});

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

//API Factus

// Endpoint para obtener rangos de numeración (opcional, si lo necesitas para otras funcionalidades)
app.get('/api/factus/rangos/facturas', async (req, res) => {
  try {
    const rangos = await obtenerRangosDeNumeracion({
      document: '01', // Solo facturas electrónicas
      is_active: true // Solo activos
    });
    res.json(rangos);
  } catch (error) {
    console.error('Error al obtener rangos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint principal para GENERAR UNA FACTURA ELECTRÓNICA desde los datos de tu DB
app.post('/api/factus/generar-factura-db', async (req, res) => {
  const { codigoVenta } = req.body; // Esperamos el código de venta desde el frontend

  if (!codigoVenta) {
    return res.status(400).json({ error: 'Se requiere el código de venta.' });
  }

  try {
    // 1. Obtener datos de la venta y cliente desde SQLite
    const venta = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM VENTA WHERE codigo = ?`, [codigoVenta], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada en la base de datos.' });
    }

    // Obtener datos del cliente (natural o jurídico).
    let clienteDetalles;
    // Intenta buscar en CLIENTE_NATURAL
    clienteDetalles = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM CLIENTE_NATURAL WHERE identificacion = ?`, [venta.identificacion_cliente], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });

    // Si no se encuentra en CLIENTE_NATURAL, intenta buscar en CLIENTE_JURIDICO
    if (!clienteDetalles) {
        clienteDetalles = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM CLIENTE_JURIDICO WHERE identificacion = ?`, [venta.identificacion_cliente], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    // Si aún no se encuentra, busca en la tabla CLIENTE principal 
    if (!clienteDetalles) {
        clienteDetalles = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM CLIENTE WHERE identificacion = ?`, [venta.identificacion_cliente], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }


    // 2. Obtener detalles de los productos vendidos
    const detallesProductos = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM DETALLE_PRODUCTO_VENDIDO WHERE codigo_venta = ?`, [codigoVenta], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // 3. Mapear datos de la DB al formato de Factus
    const facturaParaFactus = {
      "document": "01", // Tipo de documento (Factura de Venta) 
      "reference_code": codigoVenta, // Código de referencia de su venta local 
      "observation": "", 
      "payment_method_code": "10", // Código de método de pago (10: Efectivo) 
      "customer": {
        "identification": venta.identificacion_cliente, 
        "dv": 3, 
        "company": venta.razon_social_cliente || "", 
        "trade_name": venta.razon_social_cliente || "", 
        "names": venta.nombre_cliente ? `${venta.nombre_cliente} ${venta.apellido_cliente || ''}`.trim() : "",
        "address": venta.direccion_cliente || '',
        "email": venta.correo_electronico_cliente || '',
        "phone": venta.numero_telefonico_cliente || '',
        // ID de la organización legal (1: Jurídica, 2: Natural)
        "legal_organization_id": venta.razon_social_cliente ? 1 : 2, 
        "tribute_id": 21,
        "identification_document_id": (() => {
    switch (venta.tipo_identificacion_cliente) {
        case 'CC':
            return 3; 
        case 'NIT':
            return 3; 
        case 'CE':
            return 3; 
        case 'TI':
            return 3; 
        case 'PA':
            return 3; 
        case 'TE':
            return 3; 
        case 'PEP':
            return 3; 
        default:
            return 3;
    }
})(),
        "municipality_id": 169 
      },
      "items": await Promise.all(detallesProductos.map(async item => {
        // Obtener la tasa de IVA del producto desde la tabla PRODUCTO
        const producto = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM PRODUCTO WHERE codigo = ?`, [item.codigo_producto], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        return {
          "code_reference": codigoVenta, 
          "name": item.nombre_producto, 
          "quantity": item.cantidad, 
          "discount_rate": 0, 
          "price": item.precio_unitario, 
          "tax_rate": producto?.tasa_IVA || 0, 
          "unit_measure_id": 70, 
          "standard_code_id": 1, 
          "is_excluded": 0, 
          "tribute_id": 1, 
          "withholding_taxes": []
        };
      }))
    };

    // 4. Enviar la factura a Factus
    const resultadoFactus = await enviarFacturaAFactus(facturaParaFactus);
    res.json(resultadoFactus);

  } catch (error) {
    console.error('Error al generar factura desde DB:', error.message);
    if (error.response?.data) {
        console.error('Detalles del error de Factus:', error.response.data);
        return res.status(error.response.status || 500).json({ 
            error: error.response.data.message || 'Error de validación de Factus', 
            details: error.response.data.errors 
        });
    }
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para Descargar factura PDF por número (usado por el frontend)
app.get('/api/factus/factura/:numeroFactura/pdf', async (req, res) => {
  try {
    const { numeroFactura } = req.params;
    const { fileName, pdfBase64 } = await descargarFacturaPdf(numeroFactura);

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    let finalFileName = fileName;
    if (!finalFileName.toLowerCase().endsWith('.pdf')) {
      finalFileName += '.pdf';
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${finalFileName}"`
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error en el endpoint de descarga PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para Descargar factura XML por número (usado por el frontend)
app.get('/api/factus/factura/:numeroFactura/xml', async (req, res) => {
  try {
    const { numeroFactura } = req.params;
    const { fileName, xmlBase64 } = await descargarFacturaXml(numeroFactura);

    const xmlBuffer = Buffer.from(xmlBase64, 'base64');
    let finalFileName = fileName;
    if (!finalFileName.toLowerCase().endsWith('.xml')) { 
      finalFileName += '.xml';
    }

    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${finalFileName}"`
    });
    res.send(xmlBuffer);
  } catch (error) {
    console.error('Error en el endpoint de descarga XML:', error);
    res.status(500).json({ error: error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
