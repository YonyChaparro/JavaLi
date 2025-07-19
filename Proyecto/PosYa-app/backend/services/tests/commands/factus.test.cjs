// factus.test.cjs

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Accede a las clases desde commands.cjs
const {
  GetFactusRangosCommand,
  GenerateFactusFacturaCommand,
  DownloadFactusPdfCommand,
  DownloadFactusXmlCommand
} = require('../../../commands.cjs');

let db;

// Mock de los servicios de Factus para no hacer llamadas reales
jest.mock('../../../services/factus-rangos.cjs', () => ({
  obtenerRangosDeNumeracion: jest.fn()
}));

jest.mock('../../../services/factus-factura.cjs', () => ({
  enviarFacturaAFactus: jest.fn(),
  descargarFacturaPdf: jest.fn(),
  descargarFacturaXml: jest.fn()
}));

// 1. Crear base de datos en memoria antes de cada test
beforeEach((done) => {
  // Crear la base de datos en memoria
  db = new sqlite3.Database(':memory:');

  // Cargar y ejecutar el esquema de base_de_datos.sql
  const schemaPath = path.resolve(__dirname, '../../../base_de_datos.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, done);
});

// 2. Cerrar base de datos después de cada test
afterEach(() => {
  db.close();
  jest.clearAllMocks();
});

describe('GetFactusRangosCommand', () => {
  test('Debe obtener rangos de numeración correctamente', async () => {
    // Configurar mock
    const mockRangos = [
      { prefijo: 'FAC', desde: 1, hasta: 100, actual: 5 }
    ];
    require('../../../services/factus-rangos.cjs').obtenerRangosDeNumeracion
      .mockResolvedValue(mockRangos);

    // Ejecutar command
    const cmd = new GetFactusRangosCommand(db);
    const result = await cmd.execute();

    // Verificar resultados
    expect(result).toEqual(mockRangos);
    expect(require('../../../services/factus-rangos.cjs').obtenerRangosDeNumeracion)
      .toHaveBeenCalledWith({
        document: '01',
        is_active: true
      });
  });

  test('Debe manejar errores al obtener rangos', async () => {
    // Configurar mock para que falle
    require('../../../services/factus-rangos.cjs').obtenerRangosDeNumeracion
      .mockRejectedValue(new Error('Error de conexión'));

    // Ejecutar command y verificar que lanza error
    const cmd = new GetFactusRangosCommand(db);
    await expect(cmd.execute()).rejects.toThrow('Error de conexión');
  });
});

describe('GenerateFactusFacturaCommand', () => {
  const setupVentaTest = async () => {
    // Insertar datos de prueba
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        // Insertar cliente natural
        db.run(`INSERT INTO CLIENTE (identificacion, direccion, correo_electronico, ciudad, numero_telefonico) 
                VALUES ('123456789', 'Calle 1', 'cliente@test.com', 'Bogotá', '1234567890')`);
        
        db.run(`INSERT INTO CLIENTE_NATURAL (identificacion, tipo_de_documento, nombre, apellido)
                VALUES ('123456789', 'CC', 'Juan', 'Pérez')`);
        
        // Insertar producto
        db.run(`INSERT INTO PRODUCTO (codigo, nombre, costo_unitario, precio, descripcion, estado, tasa_IVA)
                VALUES ('PROD1', 'Producto 1', 10000, 15000, 'Descripción', 'activo', 0.19)`);
        
        // Insertar venta
        db.run(`INSERT INTO VENTA (codigo, fecha, hora, subtotal, total, identificacion_cliente, tipo_identificacion_cliente,
                nombre_cliente, apellido_cliente, direccion_cliente, numero_telefonico_cliente, ciudad_cliente, correo_electronico_cliente)
                VALUES ('V000000001', '2023-01-01', '10:00:00', 15000, 17850, '123456789', 'CC', 'Juan', 'Pérez',
                'Calle 1', '1234567890', 'Bogotá', 'cliente@test.com')`);
        
        // Insertar detalle de venta
        db.run(`INSERT INTO DETALLE_PRODUCTO_VENDIDO (nombre_producto, cantidad, precio_unitario, costo_unitario, IVA_unitario, submonto, monto, codigo_venta)
                VALUES ('Producto 1', 1, 15000, 10000, 2850, 15000, 17850, 'V000000001')`, resolve);
      });
    });
  };

  test('Debe generar factura correctamente', async () => {
    await setupVentaTest();
    
    // Configurar mock
    const mockResponse = { numero: 'FAC-123', estado: 'PROCESANDO' };
    require('../../../services/factus-factura.cjs').enviarFacturaAFactus
      .mockResolvedValue(mockResponse);

    // Ejecutar command
    const cmd = new GenerateFactusFacturaCommand(db, 'V000000001');
    const result = await cmd.execute();

    // Verificar resultados
    expect(result).toEqual(mockResponse);
    expect(require('../../../services/factus-factura.cjs').enviarFacturaAFactus)
      .toHaveBeenCalled();
  });

  test('Debe fallar si la venta no existe', async () => {
    const cmd = new GenerateFactusFacturaCommand(db, 'VENTA_INEXISTENTE');
    await expect(cmd.execute()).rejects.toThrow('Venta no encontrada');
  });

  test('Debe manejar errores al enviar a Factus', async () => {
    await setupVentaTest();
    
    // Configurar mock para que falle
    require('../../../services/factus-factura.cjs').enviarFacturaAFactus
      .mockRejectedValue(new Error('Error de validación'));

    // Ejecutar command y verificar que lanza error
    const cmd = new GenerateFactusFacturaCommand(db, 'V000000001');
    await expect(cmd.execute()).rejects.toThrow('Error de validación');
  });
});

describe('DownloadFactusPdfCommand', () => {
  test('Debe descargar PDF correctamente', async () => {
    // Configurar mock
    const mockResponse = {
      fileName: 'FAC-123.pdf',
      pdfBase64: 'base64encodedpdf'
    };
    require('../../../services/factus-factura.cjs').descargarFacturaPdf
      .mockResolvedValue(mockResponse);

    // Ejecutar command
    const cmd = new DownloadFactusPdfCommand(db, 'FAC-123');
    const result = await cmd.execute();

    // Verificar resultados
    expect(result).toEqual(mockResponse);
    expect(require('../../../services/factus-factura.cjs').descargarFacturaPdf)
      .toHaveBeenCalledWith('FAC-123');
  });

  test('Debe manejar errores al descargar PDF', async () => {
    // Configurar mock para que falle
    require('../../../services/factus-factura.cjs').descargarFacturaPdf
      .mockRejectedValue(new Error('PDF no encontrado'));

    // Ejecutar command y verificar que lanza error
    const cmd = new DownloadFactusPdfCommand(db, 'FAC-INEXISTENTE');
    await expect(cmd.execute()).rejects.toThrow('PDF no encontrado');
  });
});

describe('DownloadFactusXmlCommand', () => {
  test('Debe descargar XML correctamente', async () => {
    // Configurar mock
    const mockResponse = {
      fileName: 'FAC-123.xml',
      xmlBase64: 'base64encodedxml'
    };
    require('../../../services/factus-factura.cjs').descargarFacturaXml
      .mockResolvedValue(mockResponse);

    // Ejecutar command
    const cmd = new DownloadFactusXmlCommand(db, 'FAC-123');
    const result = await cmd.execute();

    // Verificar resultados
    expect(result).toEqual(mockResponse);
    expect(require('../../../services/factus-factura.cjs').descargarFacturaXml)
      .toHaveBeenCalledWith('FAC-123');
  });

  test('Debe manejar errores al descargar XML', async () => {
    // Configurar mock para que falle
    require('../../../services/factus-factura.cjs').descargarFacturaXml
      .mockRejectedValue(new Error('XML no encontrado'));

    // Ejecutar command y verificar que lanza error
    const cmd = new DownloadFactusXmlCommand(db, 'FAC-INEXISTENTE');
    await expect(cmd.execute()).rejects.toThrow('XML no encontrado');
  });
});