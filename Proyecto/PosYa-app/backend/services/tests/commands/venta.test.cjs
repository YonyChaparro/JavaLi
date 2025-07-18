// venta.test.cjs

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const {
  CreateClienteCommand,
  CreateProductoCommand,
  CreateVendedorCommand,
  CreateVentaCommand,
  GetVentaCommand
} = require('../../../commands.cjs');

let db;

beforeEach((done) => {
  db = new sqlite3.Database(':memory:');

  const schemaPath = path.resolve(__dirname, '../../../base_de_datos.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, done);
});

afterEach(() => {
  db.close();
});

test('Debe crear una venta completa con cliente, vendedor y productos', async () => {
  // 1. Insertar cliente tipo natural
  const clienteData = {
    numeroDocumento: '123456789',
    direccion: 'Calle 1',
    correo_electronico: 'cliente@correo.com',
    ciudad: 'CiudadX',
    numero_telefonico: '1234567890',
    tipoCliente: 'natural',
    tipoDocumento: 'CC',
    primerNombre: 'Juan',
    segundoNombre: 'Carlos',
    primerApellido: 'Pérez',
    segundoApellido: 'López'
  };
  await new CreateClienteCommand(db, clienteData).execute();

  // 2. Insertar vendedor
  const vendedorData = {
    NIT: '900123456-7',
    nombre_o_razon_social: 'Empresa Vendedora S.A.S.',
    direccion: 'Cra 45 #123',
    numero_de_contacto: '3216549870',
    municipio: 'Bogotá',
    responsabilidad_fiscal: 'Responsable de IVA'
  };
  await new CreateVendedorCommand(db, vendedorData).execute();

  // 3. Insertar producto
  const productoData = {
    codigo: 'P001',
    nombre: 'Producto Test',
    costoUnitario: 1000,
    precioUnitario: 1500,
    descripcion: 'Un producto de prueba',
    exentoIVA: false,
    tipoIVA: '19'
  };
  await new CreateProductoCommand(db, productoData).execute();

  // 4. Crear venta
  const ventaData = {
    fecha: '2025-07-18',
    hora: '10:00:00',
    identificacion_cliente: '123456789',
    nombre_o_razon_social_vendedor: vendedorData.nombre_o_razon_social,
    NIT_vendedor: vendedorData.NIT,
    direccion_vendedor: vendedorData.direccion,
    numero_de_contacto_vendedor: vendedorData.numero_de_contacto,
    municipio_vendedor: vendedorData.municipio,
    responsabilidad_fiscal_vendedor: vendedorData.responsabilidad_fiscal,
    productos: [
      {
        nombre: 'Producto Test',
        precio_unitario: 1500,
        IVA_unitario: 285,
        cantidad: 2
      }
    ]
  };

  const result = await new CreateVentaCommand(db, ventaData).execute();

  expect(result).toHaveProperty('ok', true);
  expect(result).toHaveProperty('codigo');

  // 5. Consultar venta para verificar
  const venta = await new GetVentaCommand(db, result.codigo).execute();
  expect(venta).toHaveProperty('numero', result.codigo);
  expect(venta.cliente).toContain('Juan');
  expect(venta.total).toContain('$');
});

test('Debe fallar si el cliente no existe', async () => {
  const ventaData = {
    fecha: '2025-07-18',
    hora: '11:00:00',
    identificacion_cliente: 'NO_EXISTE',
    nombre_o_razon_social_vendedor: 'Vendedor Fantasma',
    NIT_vendedor: '999999999-9',
    direccion_vendedor: 'Desconocida',
    numero_de_contacto_vendedor: '0000000000',
    municipio_vendedor: 'Nowhere',
    responsabilidad_fiscal_vendedor: 'Ninguna',
    productos: [
      {
        nombre: 'Producto Fantasma',
        precio_unitario: 1000,
        IVA_unitario: 190,
        cantidad: 1
      }
    ]
  };

  const cmd = new CreateVentaCommand(db, ventaData);
  await expect(cmd.execute()).rejects.toThrow('Cliente no encontrado');
});
