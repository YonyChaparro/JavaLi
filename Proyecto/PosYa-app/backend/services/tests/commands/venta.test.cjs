// venta.test.cjs

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Accede a las clases implementadas desde "commands.cjs"
const {
  CreateClienteCommand,
  CreateProductoCommand,
  CreateTipoMovimientoCommand,
  CreateVendedorCommand,
  CreateVentaCommand,
  DeleteVentaCommand,
  GetVentaCommand,
  GetVentaDetalleCommand
} = require('../../../commands.cjs');

let db;

// 1. Crear base de datos en memoria antes de cada test
beforeEach((done) => {
  // Crear la base de datos en memoria
  db = new sqlite3.Database(':memory:');

  // Cargar y ejecutar el esquema de base_de_datos.sql
  const schemaPath = path.resolve(__dirname, '../../../base_de_datos.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, done); // Jest espera que se llame a done() para continuar
});

// 2. Cerrar base de datos después de cada test
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
  // 1. Definir datos de venta con cliente inexistente
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

  // 2. Ejecutar comando con cliente no registrado
  const cmd = new CreateVentaCommand(db, ventaData);

  // 3. Verificar que lance error por cliente inexistente
  await expect(cmd.execute()).rejects.toThrow('Cliente no encontrado');
});

test('Debe eliminar una venta correctamente', async () => {
  // 1. Crear cliente
  await new CreateClienteCommand(db, {
    tipoCliente: 'natural',
    tipoDocumento: 'CC',
    numeroDocumento: '123',
    primerNombre: 'Ana',
    primerApellido: 'López',
    correo_electronico: 'ana@example.com',
    direccion: 'Calle Falsa 123',
    ciudad: 'Bogotá'
  }).execute();

  // 2. Crear producto
  await new CreateProductoCommand(db, {
    codigo: 'P123',
    nombre: 'Producto Demo',
    costoUnitario: 100,
    precioUnitario: 200
  }).execute();

  // 3. Crear tipo movimiento para ventas
  await new CreateTipoMovimientoCommand(db, {
    nombre: 'Salida por Venta',
    tipo_flujo: 'Salida'
  }).execute();

  // 4. Crear vendedor
  await new CreateVendedorCommand(db, {
    NIT: '800100200-1',
    nombre_o_razon_social: 'Empresa Prueba',
    direccion: 'Zona Industrial',
    numero_de_contacto: '6012345678',
    municipio: 'Bogotá',
    responsabilidad_fiscal: 'Simplificado'
  }).execute();

  // 5. Crear venta
  const ventaData = {
    fecha: '2025-07-19',
    hora: '10:00:00',
    identificacion_cliente: '123',
    nombre_o_razon_social_vendedor: 'Empresa Prueba',
    NIT_vendedor: '800100200-1',
    direccion_vendedor: 'Zona Industrial',
    numero_de_contacto_vendedor: '6012345678',
    municipio_vendedor: 'Bogotá',
    responsabilidad_fiscal_vendedor: 'Simplificado',
    productos: [
      {
        nombre: 'Producto Demo',
        precio_unitario: 200,
        IVA_unitario: 38,
        cantidad: 1
      }
    ]
  };

  const venta = await new CreateVentaCommand(db, ventaData).execute();

  // 6. Confirmar venta registrada
  const ventaGuardada = await new GetVentaCommand(db, venta.codigo).execute();
  expect(ventaGuardada.numero).toBe(venta.codigo);

  // 7. Eliminar venta
  const result = await new DeleteVentaCommand(db, venta.codigo).execute();
  expect(result).toEqual({ ok: true });

  // 8. Verificar eliminación
  await expect(new GetVentaCommand(db, venta.codigo).execute()).rejects.toThrow('Venta no encontrada');
  const detalles = await new GetVentaDetalleCommand(db, venta.codigo).execute();
  expect(detalles).toEqual([]);
});
