const mockExecute = jest.fn();
const bcrypt = require('bcryptjs');

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

describe('HU-04 - Cambio de rol', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  const cambiarRol = async (idUsuario, nuevoRolId, adminId, passwordConfirm, vigenciaDesde, vigenciaHasta) => {
    // 1. No auto-modificación
    if (parseInt(idUsuario) === adminId) {
      throw new Error('No puede cambiar su propio rol.');
    }

    // 2. Verificar contraseña
    const [adminRows] = await mockExecute('SELECT password_hash FROM usuarios WHERE id_usuario = ?', [adminId]);
    if (!adminRows.length) throw new Error('Administrador no encontrado');
    const passwordValida = await bcrypt.compare(passwordConfirm, adminRows[0].password_hash);
    if (!passwordValida) throw new Error('Contraseña de confirmación incorrecta.');

    // 3. Obtener usuario destino
    const [userRows] = await mockExecute(
      'SELECT u.id_rol_actual FROM usuarios u WHERE u.id_usuario = ?',
      [idUsuario]
    );
    if (!userRows.length) throw new Error('Usuario no encontrado');

    // 4. Rol diferente
    if (userRows[0].id_rol_actual === nuevoRolId) {
      throw new Error('El usuario ya posee ese rol.');
    }

    // 5. Si Jefatura, verificar unidades
    const [rolRows] = await mockExecute('SELECT nombre_rol FROM roles WHERE id_rol = ?', [nuevoRolId]);
    if (rolRows[0]?.nombre_rol === 'Jefatura') {
      const [unidades] = await mockExecute('SELECT 1 FROM unidades_a_cargo WHERE id_jefatura = ?', [idUsuario]);
      if (!unidades.length) {
        throw new Error('El usuario no tiene unidades a cargo.');
      }
    }

    // 6. Actualizar
    await mockExecute('UPDATE usuarios SET id_rol_actual = ? WHERE id_usuario = ?', [nuevoRolId, idUsuario]);
    return { success: true };
  };

  test('UT-HU04-01: Cambio exitoso', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    mockExecute.mockResolvedValueOnce([[{ password_hash: hash }]]); // admin
    mockExecute.mockResolvedValueOnce([[{ id_rol_actual: 1 }]]); // usuario destino
    mockExecute.mockResolvedValueOnce([[{ nombre_rol: 'Jefatura' }]]); // nombre nuevo rol
    mockExecute.mockResolvedValueOnce([[{ 1: 1 }]]); // unidades a cargo
    mockExecute.mockResolvedValueOnce([]); // UPDATE

    await expect(cambiarRol(5, 2, 1, 'admin123', null, null)).resolves.toEqual({ success: true });
  });

  test('UT-HU04-02: No puede cambiar rol propio', async () => {
    await expect(cambiarRol(1, 2, 1, 'admin123', null, null)).rejects.toThrow('No puede cambiar su propio rol');
  });

  test('UT-HU04-03: Contraseña incorrecta', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    mockExecute.mockResolvedValueOnce([[{ password_hash: hash }]]);
    await expect(cambiarRol(5, 2, 1, 'incorrecta', null, null)).rejects.toThrow('Contraseña de confirmación incorrecta');
  });

  test('UT-HU04-04: Rol igual al actual', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    mockExecute.mockResolvedValueOnce([[{ password_hash: hash }]]);
    mockExecute.mockResolvedValueOnce([[{ id_rol_actual: 2 }]]);
    await expect(cambiarRol(5, 2, 1, 'admin123', null, null)).rejects.toThrow('ya posee ese rol');
  });

  test('UT-HU04-05: Jefatura sin unidades a cargo', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    mockExecute.mockResolvedValueOnce([[{ password_hash: hash }]]);
    mockExecute.mockResolvedValueOnce([[{ id_rol_actual: 1 }]]);
    mockExecute.mockResolvedValueOnce([[{ nombre_rol: 'Jefatura' }]]);
    mockExecute.mockResolvedValueOnce([[]]); // sin unidades
    await expect(cambiarRol(5, 2, 1, 'admin123', null, null)).rejects.toThrow('no tiene unidades a cargo');
  });
});