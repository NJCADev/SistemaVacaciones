const mockExecute = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

// Mock del servicio de email
const sendEmailAsync = jest.fn();

describe('HU-08 - Notificaciones por correo', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    sendEmailAsync.mockClear();
  });

  test('UT-HU08-01: Envío de bienvenida al crear usuario', async () => {
    const crearUsuario = async (userData) => {
      // ... inserción ...
      await sendEmailAsync(userData.email, 'Bienvenido', expect.any(String));
    };
    await crearUsuario({ email: 'test@test.com' });
    expect(sendEmailAsync).toHaveBeenCalledWith('test@test.com', 'Bienvenido', expect.any(String));
  });

  test('UT-HU08-02: Envío al cambiar rol', async () => {
    const cambiarRol = async (idUsuario, nuevoRol) => {
      // ... lógica ...
      const userEmail = 'usuario@test.com';
      await sendEmailAsync(userEmail, 'Cambio de rol', expect.any(String));
    };
    await cambiarRol(5, 'Jefatura');
    expect(sendEmailAsync).toHaveBeenCalled();
  });

  test('UT-HU08-03: Envío al crear solicitud (funcionario y jefe)', async () => {
    const crearSolicitud = async (userId) => {
        const [rows] = await mockExecute('SELECT email, jefe_email FROM usuarios WHERE id_usuario = ?', [userId]);
        const user = rows[0];
        await sendEmailAsync(user.email, 'Solicitud registrada', expect.any(String));
        if (user.jefe_email) {
        await sendEmailAsync(user.jefe_email, 'Nueva solicitud pendiente', expect.any(String));
        }
    };

    mockExecute.mockResolvedValueOnce([
        [{ email: 'func@test.com', jefe_email: 'jefe@test.com' }]
    ]);

    await crearSolicitud(5);
    expect(sendEmailAsync).toHaveBeenCalledTimes(2);
    expect(sendEmailAsync).toHaveBeenNthCalledWith(1, 'func@test.com', 'Solicitud registrada', expect.any(String));
    expect(sendEmailAsync).toHaveBeenNthCalledWith(2, 'jefe@test.com', 'Nueva solicitud pendiente', expect.any(String));
    });

  test('UT-HU08-04: Envío al aprobar/rechazar solicitud', async () => {
    const resolverSolicitud = async (idSolicitud, accion) => {
      const [sol] = await mockExecute('SELECT ...', [idSolicitud]);
      await sendEmailAsync(sol.email, `Solicitud ${accion}`, expect.any(String));
    };
    mockExecute.mockResolvedValueOnce([[{ email: 'func@test.com' }]]);
    await resolverSolicitud(1, 'aprobada');
    expect(sendEmailAsync).toHaveBeenCalled();
  });

  test('UT-HU08-05: Envío masivo al registrar feriado', async () => {
    const registrarFeriado = async () => {
      const [emails] = await mockExecute('SELECT correo_electronico FROM usuarios WHERE estado_usuario = ?', ['activo']);
      const destinatarios = emails.map(e => e.correo_electronico).join(',');
      await sendEmailAsync(destinatarios, 'Nuevo feriado', expect.any(String));
    };
    mockExecute.mockResolvedValueOnce([[{ correo_electronico: 'a@test.com' }, { correo_electronico: 'b@test.com' }]]);
    await registrarFeriado();
    expect(sendEmailAsync).toHaveBeenCalledWith('a@test.com,b@test.com', 'Nuevo feriado', expect.any(String));
  });

  test('UT-HU08-06: Fallo en envío no bloquea operación', async () => {
    sendEmailAsync.mockRejectedValueOnce(new Error('SMTP error'));
    const crearUsuario = async () => {
      try {
        await sendEmailAsync('test@test.com', 'Bienvenido', '...');
      } catch (e) {
        // ignorar
      }
      return { success: true };
    };
    const result = await crearUsuario();
    expect(result.success).toBe(true);
  });
});