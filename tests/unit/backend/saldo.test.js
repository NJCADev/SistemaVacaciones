const mockExecute = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

// Mock de req/res
const mockReq = (params, query, body, user) => ({
  params,
  query,
  body,
  user
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('HU-02 - Recalcular saldo', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  describe('POST /api/saldo/recalcular/:usuario_id', () => {
    const recalcularSaldoIndividual = async (req, res) => {
      const usuarioId = req.params.usuario_id;
      const anio = req.query.anio || new Date().getFullYear();

      // Verificar que el usuario existe
      const [users] = await mockExecute('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [usuarioId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await mockExecute('CALL calcular_y_actualizar_saldo_inicial(?, ?)', [usuarioId, anio]);

      const [saldo] = await mockExecute(
        'SELECT saldo_actual, saldo_inicial_periodo FROM saldo_vacaciones WHERE id_usuario = ? AND periodo_anio = ?',
        [usuarioId, anio]
      );

      res.json({
        success: true,
        message: 'Saldo recalculado correctamente',
        saldo: saldo.length ? saldo[0] : { saldo_actual: 0, saldo_inicial_periodo: 0 }
      });
    };

    test('UT-HU02-02: Recalcular saldo individual exitoso', async () => {
      const req = mockReq({ usuario_id: '5' }, {}, {}, { id_usuario: 1 });
      const res = mockRes();

      mockExecute.mockResolvedValueOnce([[{ id_usuario: 5 }]]);  // usuario existe
      mockExecute.mockResolvedValueOnce([]);                     // CALL SP
      mockExecute.mockResolvedValueOnce([[{ saldo_actual: 15.5, saldo_inicial_periodo: 15.5 }]]);

      await recalcularSaldoIndividual(req, res);

      expect(mockExecute).toHaveBeenCalledWith(
        'CALL calcular_y_actualizar_saldo_inicial(?, ?)',
        [expect.stringMatching(/^5$/), 2026] // acepta "5" o 5
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Saldo recalculado correctamente',
        saldo: { saldo_actual: 15.5, saldo_inicial_periodo: 15.5 }
      });
    });

    test('UT-HU02-02: Usuario no encontrado', async () => {
      const req = mockReq({ usuario_id: '999' }, {}, {}, { id_usuario: 1 });
      const res = mockRes();

      mockExecute.mockResolvedValueOnce([[]]); // usuario no existe

      await recalcularSaldoIndividual(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    });
  });

  describe('POST /api/saldo/recalcular-todos', () => {
    const recalcularSaldoMasivo = async (req, res) => {
      const anio = req.query.anio || new Date().getFullYear();

      const [usuarios] = await mockExecute("SELECT id_usuario FROM usuarios WHERE estado_usuario = 'activo'", []);
      let procesados = 0;
      const errores = [];

      for (const u of usuarios) {
        try {
          await mockExecute('CALL calcular_y_actualizar_saldo_inicial(?, ?)', [u.id_usuario, anio]);
          procesados++;
        } catch (err) {
          errores.push({ id_usuario: u.id_usuario, error: err.message });
        }
      }

      res.json({
        success: true,
        message: `Recálculo completado. ${procesados} usuarios procesados.`,
        errores: errores.length ? errores : undefined
      });
    };

    test('UT-HU02-03: Recalcular saldo masivo exitoso', async () => {
      const req = mockReq({}, {}, {}, {});
      const res = mockRes();

      mockExecute.mockResolvedValueOnce([[{ id_usuario: 1 }, { id_usuario: 2 }]]);
      mockExecute.mockResolvedValue([]); // CALL SP (éxito)
      mockExecute.mockResolvedValue([]); // CALL SP (éxito)

      await recalcularSaldoMasivo(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Recálculo completado. 2 usuarios procesados.',
        errores: undefined
      });
    });

    test('UT-HU02-03: Manejo de errores en algunos usuarios', async () => {
      const req = mockReq({}, {}, {}, {});
      const res = mockRes();

      // Simulamos dos usuarios: ID 1 y ID 2
      mockExecute.mockResolvedValueOnce([[{ id_usuario: 1 }, { id_usuario: 2 }]]);
      
      // Primera llamada (usuario 1): éxito
      mockExecute.mockResolvedValueOnce([]);
      // Segunda llamada (usuario 2): fallo
      mockExecute.mockRejectedValueOnce(new Error('Fallo SP'));

      await recalcularSaldoMasivo(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Recálculo completado. 1 usuarios procesados.',
        errores: [{ id_usuario: 2, error: 'Fallo SP' }]
      });
    });
  });
});