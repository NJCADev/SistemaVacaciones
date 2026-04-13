const bcrypt = require('bcryptjs');

// Mock del pool de BD
const mockExecute = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

describe('Gestión de Usuarios (Backend)', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  describe('Validaciones de creación de usuario', () => {
    const validarCamposObligatorios = (body) => {
      const { cedula, nombre, apellidos, email, password, id_rol, id_departamento, id_tipo_nombramiento } = body;
      return !!(cedula && nombre && apellidos && email && password && id_rol && id_departamento && id_tipo_nombramiento);
    };

    const validarCedula = (cedula) => /^\d{9,12}$/.test(cedula);

    test('Rechaza campos obligatorios vacíos', () => {
      const bodyIncompleto = { cedula: '123', nombre: 'Juan' };
      expect(validarCamposObligatorios(bodyIncompleto)).toBe(false);
    });

    test('Acepta todos los campos obligatorios', () => {
      const bodyCompleto = {
        cedula: '123456789',
        nombre: 'Juan',
        apellidos: 'Pérez',
        email: 'juan@test.com',
        password: '123456',
        id_rol: 1,
        id_departamento: 1,
        id_tipo_nombramiento: 1
      };
      expect(validarCamposObligatorios(bodyCompleto)).toBe(true);
    });

    test('Valida formato de cédula correcto (9-12 dígitos)', () => {
      expect(validarCedula('123456789')).toBe(true);
      expect(validarCedula('123456789012')).toBe(true);
    });

    test('Rechaza cédula con letras', () => {
      expect(validarCedula('12345A789')).toBe(false);
    });

    test('Rechaza cédula muy corta o larga', () => {
      expect(validarCedula('123')).toBe(false);
      expect(validarCedula('1234567890123')).toBe(false);
    });
  });

  describe('Encriptación de contraseña', () => {
    test('bcrypt genera hash válido', async () => {
      const password = 'Test1234';
      const hash = await bcrypt.hash(password, 10);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    test('bcrypt compara correctamente', async () => {
      const password = 'Test1234';
      const hash = await bcrypt.hash(password, 10);
      const match = await bcrypt.compare(password, hash);
      expect(match).toBe(true);
    });
  });
});