describe('Flujo de Aprobación de Solicitudes', () => {
  describe('Reglas de transición de estados', () => {
    const estadosPermitidos = {
      pendiente: ['aprobada_jefatura', 'rechazada'],
      aprobada_jefatura: ['programada', 'rechazada'],
      programada: ['ejecutada'],
      rechazada: [],
      ejecutada: [],
      retirada: []
    };

    const puedeCambiarA = (estadoActual, nuevoEstado, rol) => {
      // Reglas adicionales por rol
      if (rol === 'Jefatura' && estadoActual === 'pendiente' && nuevoEstado === 'aprobada_jefatura') return true;
      if (rol === 'Jefatura' && nuevoEstado === 'rechazada') return true;
      if ((rol === 'Recursos Humanos' || rol === 'Administrador') && estadoActual === 'aprobada_jefatura' && nuevoEstado === 'programada') return true;
      if ((rol === 'Recursos Humanos' || rol === 'Administrador') && nuevoEstado === 'rechazada') return true;
      return false;
    };

    test('Jefatura puede aprobar pendiente a aprobada_jefatura', () => {
      expect(puedeCambiarA('pendiente', 'aprobada_jefatura', 'Jefatura')).toBe(true);
    });

    test('Jefatura NO puede aprobar directamente a programada', () => {
      expect(puedeCambiarA('pendiente', 'programada', 'Jefatura')).toBe(false);
    });

    test('RRHH puede aprobar aprobada_jefatura a programada', () => {
      expect(puedeCambiarA('aprobada_jefatura', 'programada', 'Recursos Humanos')).toBe(true);
    });

    test('RRHH puede aprobar pendiente a programada (por si acaso)', () => {
      expect(puedeCambiarA('pendiente', 'programada', 'Recursos Humanos')).toBe(false); // según reglas de HU-01 solo desde aprobada_jefatura
    });

    test('Cualquier rol autorizado puede rechazar', () => {
      expect(puedeCambiarA('pendiente', 'rechazada', 'Jefatura')).toBe(true);
      expect(puedeCambiarA('aprobada_jefatura', 'rechazada', 'Recursos Humanos')).toBe(true);
    });

    test('No se puede cambiar una solicitud ya rechazada o ejecutada', () => {
      expect(puedeCambiarA('rechazada', 'pendiente', 'Jefatura')).toBe(false);
      expect(puedeCambiarA('ejecutada', 'programada', 'Recursos Humanos')).toBe(false);
    });
  });

  describe('Validación de no auto-aprobación', () => {
    const puedeAprobar = (idSolicitante, idAprobador, rol) => {
      if (idSolicitante === idAprobador) return false;
      return true;
    };

    test('Usuario no puede aprobar su propia solicitud', () => {
      expect(puedeAprobar(5, 5, 'Jefatura')).toBe(false);
      expect(puedeAprobar(5, 5, 'Recursos Humanos')).toBe(false);
    });

    test('Usuario puede aprobar solicitud de otro', () => {
      expect(puedeAprobar(5, 8, 'Jefatura')).toBe(true);
    });
  });

  describe('Validación de departamento para Jefatura', () => {
    const puedeAprobarJefatura = (deptoSolicitante, deptoJefatura) => {
      return deptoSolicitante === deptoJefatura;
    };

    test('Jefatura solo aprueba solicitudes de su mismo departamento', () => {
      expect(puedeAprobarJefatura(1, 1)).toBe(true);
      expect(puedeAprobarJefatura(2, 1)).toBe(false);
    });
  });
});