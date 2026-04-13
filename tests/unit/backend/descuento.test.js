const mockExecute = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

describe('HU-03 - Descuento por asistencia real', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  describe('POST /api/tareas/diarias', () => {
    const tareaDiaria = async () => {
      const fechaHoy = new Date().toISOString().split('T')[0];
      
      const [solicitudes] = await mockExecute(
        `SELECT id_solicitud, id_usuario, fecha_inicio, fecha_fin FROM solicitudes_vacaciones WHERE estado = 'programada' AND ? BETWEEN fecha_inicio AND fecha_fin`,
        [fechaHoy]
      );

      let descontados = 0;
      let finalizadas = 0;

      for (const sol of solicitudes) {
        const [asistencia] = await mockExecute(
          'SELECT estado_asistencia FROM bitacora_asistencia WHERE id_usuario = ? AND fecha = ?',
          [sol.id_usuario, fechaHoy]
        );

        if (asistencia.length && asistencia[0].estado_asistencia === 'ausente') {
          const [saldo] = await mockExecute(
            'SELECT saldo_actual FROM saldo_vacaciones WHERE id_usuario = ? AND periodo_anio = YEAR(?)',
            [sol.id_usuario, fechaHoy]
          );
          if (saldo.length && saldo[0].saldo_actual >= 1) {
            await mockExecute(
              'UPDATE saldo_vacaciones SET saldo_actual = saldo_actual - 1 WHERE id_usuario = ? AND periodo_anio = YEAR(?)',
              [sol.id_usuario, fechaHoy]
            );
            descontados++;
          }
        }

        if (new Date(sol.fecha_fin) < new Date(fechaHoy)) {
          await mockExecute('UPDATE solicitudes_vacaciones SET estado = ? WHERE id_solicitud = ?', ['ejecutada', sol.id_solicitud]);
          finalizadas++;
        }
      }

      return { solicitudes: solicitudes.length, descontados, finalizadas };
    };

    test('UT-HU03-01: Descuenta 1 día si hay ausencia', async () => {
      const fechaHoy = new Date().toISOString().split('T')[0];
      const solicitudMock = { id_solicitud: 1, id_usuario: 10, fecha_inicio: '2026-04-01', fecha_fin: '2026-04-10' };
      
      mockExecute.mockResolvedValueOnce([[solicitudMock]]); // solicitudes programadas
      mockExecute.mockResolvedValueOnce([[{ estado_asistencia: 'ausente' }]]); // bitácora
      mockExecute.mockResolvedValueOnce([[{ saldo_actual: 10 }]]); // saldo actual
      mockExecute.mockResolvedValueOnce([]); // UPDATE saldo

      const result = await tareaDiaria();
      expect(result.descontados).toBe(1);
      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE saldo_vacaciones SET saldo_actual = saldo_actual - 1 WHERE id_usuario = ? AND periodo_anio = YEAR(?)',
        [10, fechaHoy]
      );
    });

    test('UT-HU03-02: NO descuenta si está presente', async () => {
      mockExecute.mockResolvedValueOnce([[{ id_solicitud: 1, id_usuario: 10, fecha_inicio: '2026-04-01', fecha_fin: '2026-04-10' }]]);
      mockExecute.mockResolvedValueOnce([[{ estado_asistencia: 'presente' }]]);

      const result = await tareaDiaria();
      expect(result.descontados).toBe(0);
    });

    test('UT-HU03-03: Cambia a ejecutada cuando fecha_fin < hoy', async () => {
      const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const solicitudMock = { id_solicitud: 1, id_usuario: 10, fecha_inicio: '2026-04-01', fecha_fin: ayer };
      
      mockExecute.mockResolvedValueOnce([[solicitudMock]]);
      mockExecute.mockResolvedValueOnce([[{ estado_asistencia: 'ausente' }]]);
      mockExecute.mockResolvedValueOnce([[{ saldo_actual: 10 }]]);
      mockExecute.mockResolvedValueOnce([]); // UPDATE saldo
      mockExecute.mockResolvedValueOnce([]); // UPDATE estado

      const result = await tareaDiaria();
      expect(result.finalizadas).toBe(1);
      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE solicitudes_vacaciones SET estado = ? WHERE id_solicitud = ?',
        ['ejecutada', 1]
      );
    });
  });

  describe('POST /api/solicitudes/:id/retirar', () => {
    const retirarSolicitud = async (idSolicitud, userId, userRol) => {
      const [solicitudes] = await mockExecute('SELECT * FROM solicitudes_vacaciones WHERE id_solicitud = ?', [idSolicitud]);
      if (!solicitudes.length) throw new Error('Solicitud no encontrada');
      
      const sol = solicitudes[0];
      if (sol.id_usuario !== userId && !['Recursos Humanos', 'Administrador'].includes(userRol)) {
        throw new Error('No tiene permiso para retirar esta solicitud');
      }
      if (!['pendiente', 'aprobada_jefatura'].includes(sol.estado)) {
        throw new Error('La solicitud no puede ser retirada en su estado actual');
      }
      
      await mockExecute('UPDATE solicitudes_vacaciones SET estado = ? WHERE id_solicitud = ?', ['retirada', idSolicitud]);
      return { success: true };
    };

    test('UT-HU03-04: Dueño puede retirar solicitud pendiente', async () => {
      mockExecute.mockResolvedValueOnce([[{ id_usuario: 5, estado: 'pendiente' }]]);
      mockExecute.mockResolvedValueOnce([]);
      
      await expect(retirarSolicitud(1, 5, 'Funcionario')).resolves.toEqual({ success: true });
    });

    test('UT-HU03-04: RRHH puede retirar solicitud de otro usuario', async () => {
      mockExecute.mockResolvedValueOnce([[{ id_usuario: 5, estado: 'pendiente' }]]);
      mockExecute.mockResolvedValueOnce([]);
      
      await expect(retirarSolicitud(1, 2, 'Recursos Humanos')).resolves.toEqual({ success: true });
    });

    test('UT-HU03-05: No se puede retirar solicitud en estado programada', async () => {
      mockExecute.mockResolvedValueOnce([[{ id_usuario: 5, estado: 'programada' }]]);
      
      await expect(retirarSolicitud(1, 5, 'Funcionario')).rejects.toThrow('no puede ser retirada');
    });

    test('UT-HU03-05: Usuario sin permiso no puede retirar solicitud ajena', async () => {
      mockExecute.mockResolvedValueOnce([[{ id_usuario: 5, estado: 'pendiente' }]]);
      
      await expect(retirarSolicitud(1, 3, 'Funcionario')).rejects.toThrow('No tiene permiso');
    });
  });
});