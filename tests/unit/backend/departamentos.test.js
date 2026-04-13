// Mock del pool de BD
const mockExecute = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

describe('Gestión de Departamentos (Backend)', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  describe('Validaciones de creación y edición', () => {
    const validarNombre = (nombre) => {
        if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') return false;
        const regex = /^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;
        return regex.test(nombre.trim());
    };

    test('Acepta nombres válidos', () => {
        expect(validarNombre('Recursos Humanos')).toBe(true);
        expect(validarNombre('Tecnología de Información')).toBe(true);
        expect(validarNombre('Departamento 2')).toBe(true);
    });

    test('Rechaza nombre vacío o solo espacios', () => {
        expect(validarNombre('')).toBe(false);
        expect(validarNombre('   ')).toBe(false);
    });

    test('Rechaza nombre con caracteres especiales', () => {
        expect(validarNombre('Finanzas@2026')).toBe(false);
        expect(validarNombre('Ventas#')).toBe(false);
    });
    });

  describe('Validación de jefe de unidad', () => {
    const puedeSerJefe = (idRol, nombreRol) => {
      return nombreRol === 'Jefatura';
    };

    test('Usuario con rol Jefatura puede ser asignado', () => {
      expect(puedeSerJefe(2, 'Jefatura')).toBe(true);
    });

    test('Usuario con rol diferente no puede ser asignado', () => {
      expect(puedeSerJefe(1, 'Funcionario')).toBe(false);
      expect(puedeSerJefe(4, 'Administrador')).toBe(false);
    });
  });

  describe('Formateo de datos para frontend', () => {
    const formatearDepartamento = (depto) => ({
      id_departamento: depto.id_departamento,
      codigo: depto.codigo_unico_4_digitos || '—',
      nombre: depto.nombre_unidad,
      categoria_vacacional: depto.categoria_vacacional || 'No definida',
      jefe_nombre: depto.jefe_nombre || 'No asignado',
      activo: depto.activo === 1
    });

    test('Convierte correctamente campos de BD a formato esperado', () => {
      const deptoBD = {
        id_departamento: 1,
        codigo_unico_4_digitos: '0001',
        nombre_unidad: 'Administración Central',
        categoria_vacacional: 'Asistente administrativo',
        jefe_nombre: 'Jefe Prueba',
        activo: 1
      };
      const resultado = formatearDepartamento(deptoBD);
      expect(resultado.codigo).toBe('0001');
      expect(resultado.nombre).toBe('Administración Central');
      expect(resultado.categoria_vacacional).toBe('Asistente administrativo');
      expect(resultado.jefe_nombre).toBe('Jefe Prueba');
      expect(resultado.activo).toBe(true);
    });

    test('Maneja valores nulos', () => {
      const deptoBD = {
        id_departamento: 2,
        codigo_unico_4_digitos: null,
        nombre_unidad: 'Prueba',
        categoria_vacacional: null,
        jefe_nombre: null,
        activo: 0
      };
      const resultado = formatearDepartamento(deptoBD);
      expect(resultado.codigo).toBe('—');
      expect(resultado.categoria_vacacional).toBe('No definida');
      expect(resultado.jefe_nombre).toBe('No asignado');
      expect(resultado.activo).toBe(false);
    });
  });
});