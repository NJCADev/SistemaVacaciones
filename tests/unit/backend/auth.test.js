const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock de pool de BD
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: jest.fn()
  }))
}));

describe('Autenticación', () => {
  test('bcrypt compara contraseña correctamente', async () => {
    const hash = await bcrypt.hash('test123', 10);
    const valida = await bcrypt.compare('test123', hash);
    expect(valida).toBe(true);
  });

  test('bcrypt rechaza contraseña incorrecta', async () => {
    const hash = await bcrypt.hash('test123', 10);
    const valida = await bcrypt.compare('wrong', hash);
    expect(valida).toBe(false);
  });

  test('JWT firma y verifica correctamente', () => {
    const payload = { id: 1, rol: 'Administrador' };
    const token = jwt.sign(payload, 'secret', { expiresIn: '1h' });
    const decoded = jwt.verify(token, 'secret');
    expect(decoded.id).toBe(1);
    expect(decoded.rol).toBe('Administrador');
  });

  test('JWT rechaza token inválido', () => {
    const token = 'token.invalido';
    expect(() => jwt.verify(token, 'secret')).toThrow();
  });
});