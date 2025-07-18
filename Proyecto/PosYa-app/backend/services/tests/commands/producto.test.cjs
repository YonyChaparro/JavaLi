const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Accede a las clases implementadas desde "commands.cjs"
const {
  CreateProductoCommand,
  DeleteProductoCommand,
  GetProductosCommand
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

test('Debe crear un producto correctamente', async () => {
  // 1. Insertar producto
  const productoData = {
    codigo: 'P001',
    nombre: 'Producto 1',
    costoUnitario: 1000,
    precioUnitario: 1500,
    descripcion: 'Producto de prueba',
    exentoIVA: false,
    tipoIVA: '19'
  };

  const cmd = new CreateProductoCommand(db, productoData);
  const result = await cmd.execute();

  // 2. Verificar datos del producto
  expect(result).toMatchObject({
    codigo: 'P001',
    nombre: 'Producto 1',
    costoUnitario: 1000,
    precioUnitario: 1500,
    estado: 'activo',
    tipoIVA: 19,
    exentoIVA: false
  });
});

test('Debe fallar si faltan campos obligatorios', async () => {
  // 1. Insertar producto sin nombre
  const productoData = {
    codigo: 'P002',
    costoUnitario: 500,
    precioUnitario: 800
  };

  const cmd = new CreateProductoCommand(db, productoData);

  // 2. Verificar error por datos incompletos
  await expect(cmd.execute()).rejects.toThrow('Faltan campos obligatorios');
});

test('Debe eliminar un producto correctamente', async () => {
  // 1. Insertar producto
  const producto = {
    codigo: 'P004',
    nombre: 'Producto 4',
    costoUnitario: 1000,
    precioUnitario: 1200
  };

  await new CreateProductoCommand(db, producto).execute();

  // 2. Eliminar producto
  const deleteCmd = new DeleteProductoCommand(db, 'P004');
  const result = await deleteCmd.execute();

  // 3. Verificar que fue eliminado
  expect(result).toEqual({ ok: true });

  // 4. Consultar lista y confirmar eliminación
  const productos = await new GetProductosCommand(db).execute();
  const existe = productos.some(p => p.codigo === 'P004');
  expect(existe).toBe(false);
});

test('Debe fallar al eliminar producto inexistente', async () => {
  // 1. Intentar eliminar producto no registrado
  const deleteCmd = new DeleteProductoCommand(db, 'NO_EXISTE');

  // 2. Verificar que lanza error correspondiente
  await expect(deleteCmd.execute()).rejects.toThrow('Producto no encontrado');
});