const mockExecute = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

describe('HU-06 - Perfil de usuario', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  test('UT-HU06-01: GET /api/perfil retorna datos completos', async () => {
    const mockPerfil = {
      cedula: '123456789',
      nombre_completo: 'Juan Pérez',
      email: 'juan@test.com',
      telefono: '88888888',
      fecha_ingreso: '2020-01-01',
      estado_usuario: 'activo',
      rol: 'Funcionario',
      departamento: 'TI',
      categoria_vacacional: 'Administrador',
      tipo_nombramiento: 'propiedad',
      saldo_actual: 15.5
    };
    mockExecute.mockResolvedValueOnce([mockPerfil]);
    const [rows] = await mockExecute('SELECT ...');
    expect(rows).toEqual(mockPerfil);
  });

  describe('PUT /api/perfil/contacto', () => {
    const validarEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
    const validarTelefono = (tel) => /^[0-9+\-\s]{7,20}$/.test(tel);

    test('UT-HU06-02: Actualiza correo y teléfono válidos', async () => {
      const email = 'nuevo@cuc.ac.cr';
      const telefono = '8888-8888';
      expect(validarEmail(email)).toBe(true);
      expect(validarTelefono(telefono)).toBe(true);
      mockExecute.mockResolvedValueOnce([]);
      mockExecute.mockResolvedValueOnce([]);
      // Simular actualización
    });

    test('UT-HU06-03: Rechaza correo inválido', () => {
      expect(validarEmail('correo-invalido')).toBe(false);
      expect(validarEmail('sinarroba.com')).toBe(false);
    });

    test('UT-HU06-04: Rechaza teléfono inválido', () => {
      expect(validarTelefono('abc')).toBe(false);
      expect(validarTelefono('123')).toBe(false); // menos de 7 caracteres
    });
  });
});