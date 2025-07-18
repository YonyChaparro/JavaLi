// backend/services/tests/commands/tipo_movimiento.test.cjs

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const {
  CreateTipoMovimientoCommand,
  UpdateTipoMovimientoCommand,
  DeleteTipoMovimientoCommand,
  GetTipoMovimientoCommand
} = require('../../../commands.cjs');

let db;

// 1. Crear base de datos en memoria antes de cada test
beforeEach((done) => {
  db = new sqlite3.Database(':memory:');
  const schemaPath = path.resolve(__dirname, '../../../base_de_datos.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, done);
});

// 2. Cerrar base de datos después de cada test
afterEach(() => {
  db.close();
});

test('Debe crear un tipo de movimiento correctamente', async () => {
  // 1. Crear tipo de movimiento válido
  const data = { nombre: 'Compra inicial', tipo_flujo: 'Entrada' };
  const cmd = new CreateTipoMovimientoCommand(db, data);
  const result = await cmd.execute();

  // 2. Verificar creación
  expect(result).toMatchObject({ ok: true });
});

test('Debe fallar si faltan campos requeridos al crear', async () => {
  // 1. Crear tipo de movimiento sin nombre
  const data = { tipo_flujo: 'Salida' };
  const cmd = new CreateTipoMovimientoCommand(db, data);

  // 2. Verificar que lanza error
  await expect(cmd.execute()).rejects.toThrow('Faltan campos requeridos');
});

test('Debe actualizar un tipo de movimiento existente', async () => {
  // 1. Crear tipo de movimiento
  const createCmd = new CreateTipoMovimientoCommand(db, { nombre: 'Ajuste', tipo_flujo: 'Entrada' });
  const { codigo } = await createCmd.execute();

  // 2. Actualizar nombre y flujo
  const updateCmd = new UpdateTipoMovimientoCommand(db, codigo, { nombre: 'Ajuste actualizado', tipo_flujo: 'Salida' });
  const result = await updateCmd.execute();

  // 3. Verificar actualización
  expect(result).toMatchObject({ ok: true });
});

test('Debe fallar al actualizar un tipo inexistente', async () => {
  // 1. Intentar actualizar tipo no existente
  const cmd = new UpdateTipoMovimientoCommand(db, 9999, { nombre: 'X', tipo_flujo: 'Entrada' });

  // 2. Verificar error
  await expect(cmd.execute()).rejects.toThrow('Tipo de movimiento no encontrado');
});

test('Debe eliminar un tipo de movimiento existente', async () => {
  // 1. Crear tipo
  const createCmd = new CreateTipoMovimientoCommand(db, { nombre: 'Eliminar', tipo_flujo: 'Entrada' });
  const { codigo } = await createCmd.execute();

  // 2. Eliminar tipo
  const deleteCmd = new DeleteTipoMovimientoCommand(db, codigo);
  const result = await deleteCmd.execute();

  // 3. Verificar eliminación
  expect(result).toMatchObject({ ok: true });
});

test('Debe fallar al eliminar tipo inexistente', async () => {
  // 1. Intentar eliminar tipo no existente
  const cmd = new DeleteTipoMovimientoCommand(db, 9999);

  // 2. Verificar error
  await expect(cmd.execute()).rejects.toThrow('Tipo de movimiento no encontrado');
});

test('Debe consultar un tipo de movimiento por su código', async () => {
  // 1. Crear tipo de movimiento
  const createCmd = new CreateTipoMovimientoCommand(db, { nombre: 'Verificación', tipo_flujo: 'Salida' });
  const { codigo } = await createCmd.execute();

  // 2. Consultar tipo por código
  const getCmd = new GetTipoMovimientoCommand(db, codigo);
  const tipo = await getCmd.execute();

  // 3. Verificar datos consultados
  expect(tipo).toMatchObject({ nombre: 'Verificación', tipo_flujo: 'Salida', codigo });
});

test('Debe fallar si el tipo de movimiento consultado no existe', async () => {
  // 1. Consultar tipo no existente
  const getCmd = new GetTipoMovimientoCommand(db, 9999);

  // 2. Verificar error
  await expect(getCmd.execute()).rejects.toThrow('Tipo de movimiento no encontrado');
});