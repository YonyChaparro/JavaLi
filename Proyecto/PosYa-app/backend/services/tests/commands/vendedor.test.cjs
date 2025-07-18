// vendedor.test.cjs

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Accede a las clases implementadas desde "commands.cjs"
const {
  CreateVendedorCommand,
  GetVendedorCommand
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

test('Debe crear un vendedor y devolverlo correctamente', async () => {
  // 1. Insertar vendedor
  const vendedorData = {
    NIT: '900123456-7',
    nombre_o_razon_social: 'Mi Empresa S.A.S.',
    direccion: 'Cra 45 #123',
    numero_de_contacto: '3216549870',
    municipio: 'Bogotá',
    responsabilidad_fiscal: 'Responsable de IVA'
  };

  const createCmd = new CreateVendedorCommand(db, vendedorData);
  const result = await createCmd.execute();

  // 2. Verificar que el vendedor se insertó
  expect(result).toEqual({ ok: true });

  // 3. Consultar vendedor
  const getCmd = new GetVendedorCommand(db);
  const vendedor = await getCmd.execute();

  // 4. Verificar datos del vendedor
  expect(vendedor).toMatchObject(vendedorData);
});

test('Debe fallar si se intenta crear el vendedor dos veces', async () => {
  // 1. Definir vendedor único
  const vendedorData = {
    NIT: '999999999-9',
    nombre_o_razon_social: 'Empresa Única',
    direccion: 'Carrera 99',
    numero_de_contacto: '4444444444',
    municipio: 'Medellín',
    responsabilidad_fiscal: 'IVA'
  };

  // 2. Primer intento: debe funcionar
  const createCmd1 = new CreateVendedorCommand(db, vendedorData);
  await expect(createCmd1.execute()).resolves.toEqual({ ok: true });

  // 3. Segundo intento: debe sobrescribir, no fallar
  const createCmd2 = new CreateVendedorCommand(db, vendedorData);
  await expect(createCmd2.execute()).resolves.toEqual({ ok: true });

  // 4. Verificar que solo hay un registro
  const rowCount = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as total FROM VENDEDOR', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.total);
    });
  });

  expect(rowCount).toBe(1);
});