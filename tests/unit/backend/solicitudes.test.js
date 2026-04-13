// Mock del pool de BD
const mockExecute = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

describe('Gestión de Solicitudes (Backend)', () => {
  describe('Cálculo de días hábiles', () => {
    const calcularDiasHabiles = (fechaInicio, fechaFin) => {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      let dias = 0;
      const current = new Date(inicio);
      while (current <= fin) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) dias++;
        current.setDate(current.getDate() + 1);
      }
      return dias;
    };

    test('Rango de lunes a viernes devuelve 5 días', () => {
      expect(calcularDiasHabiles('2026-06-15T12:00:00', '2026-06-19T12:00:00')).toBe(5);
    });

    test('Rango con fin de semana en medio', () => {
      expect(calcularDiasHabiles('2026-06-12T12:00:00', '2026-06-22T12:00:00')).toBe(7);
    });

    test('Fechas iguales devuelve 1 si es día hábil', () => {
      expect(calcularDiasHabiles('2026-06-16T12:00:00', '2026-06-16T12:00:00')).toBe(1); // martes
    });

    test('Fechas iguales devuelve 0 si es fin de semana', () => {
      expect(calcularDiasHabiles('2026-06-14T12:00:00', '2026-06-14T12:00:00')).toBe(0); // domingo
    });
  });

  describe('Validación de saldo', () => {
    const validarSaldoSuficiente = (saldoDisponible, diasSolicitados) => saldoDisponible >= diasSolicitados;

    test('Saldo suficiente retorna true', () => {
      expect(validarSaldoSuficiente(10, 5)).toBe(true);
      expect(validarSaldoSuficiente(5, 5)).toBe(true);
    });

    test('Saldo insuficiente retorna false', () => {
      expect(validarSaldoSuficiente(3, 5)).toBe(false);
      expect(validarSaldoSuficiente(0, 1)).toBe(false);
    });
  });

  describe('Flujo de aprobación', () => {
    const puedeAprobarJefatura = (estado, usuarioDepto, deptoSolicitante) => {
      return estado === 'pendiente' && usuarioDepto === deptoSolicitante;
    };

    const puedeAprobarRRHH = (estado) => {
      return estado === 'aprobada_jefatura' || estado === 'pendiente';
    };

    test('Jefatura puede aprobar solicitud pendiente de su departamento', () => {
      expect(puedeAprobarJefatura('pendiente', 1, 1)).toBe(true);
    });

    test('Jefatura NO puede aprobar solicitud de otro departamento', () => {
      expect(puedeAprobarJefatura('pendiente', 1, 2)).toBe(false);
    });

    test('Jefatura NO puede aprobar solicitud que no esté pendiente', () => {
      expect(puedeAprobarJefatura('aprobada_jefatura', 1, 1)).toBe(false);
    });

    test('RRHH puede aprobar solicitud en aprobada_jefatura', () => {
      expect(puedeAprobarRRHH('aprobada_jefatura')).toBe(true);
    });

    test('RRHH puede aprobar solicitud pendiente', () => {
      expect(puedeAprobarRRHH('pendiente')).toBe(true);
    });

    test('RRHH NO puede aprobar solicitud en programada', () => {
      expect(puedeAprobarRRHH('programada')).toBe(false);
    });
  });
});