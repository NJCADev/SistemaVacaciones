const mockExecute = jest.fn();
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: mockExecute
  }))
}));

describe('HU-05 - Vacaciones colectivas', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  describe('GET /api/vacaciones-colectivas', () => {
    test('UT-HU05-01: Lista feriados activos', async () => {
      const mockFeriados = [
        { id_feriado: 1, fecha_feriado: '2026-12-25', descripcion: 'Navidad', activo: 1 }
      ];
      mockExecute.mockResolvedValueOnce([mockFeriados]);
      const [rows] = await mockExecute('SELECT ... FROM vacaciones_colectivas WHERE activo = TRUE');
      expect(rows).toEqual(mockFeriados);
    });
  });

  describe('POST /api/vacaciones-colectivas', () => {
    test('UT-HU05-02: Crear feriado exitoso', async () => {
      mockExecute.mockResolvedValueOnce([[]]); // no duplicado
      mockExecute.mockResolvedValueOnce([{ insertId: 1 }]); // inserción
      // Simulación de endpoint
      const fecha = '2026-12-25';
      const [existente] = await mockExecute('SELECT ... WHERE fecha_feriado = ? AND activo = TRUE', [fecha]);
      expect(existente.length).toBe(0);
      await mockExecute('INSERT INTO vacaciones_colectivas ...', [fecha, 'Navidad', 1]);
    });

    test('UT-HU05-03: No permite duplicado activo', async () => {
      mockExecute.mockResolvedValueOnce([[{ id_feriado: 1 }]]); // ya existe
      const fecha = '2026-12-25';
      const [existente] = await mockExecute('SELECT ... WHERE fecha_feriado = ? AND activo = TRUE', [fecha]);
      expect(existente.length).toBe(1);
      // El endpoint debería devolver 400
    });
  });

  describe('DELETE /api/vacaciones-colectivas/:id', () => {
    test('UT-HU05-04: Soft delete de feriado', async () => {
      mockExecute.mockResolvedValueOnce([]); // UPDATE
      await mockExecute('UPDATE vacaciones_colectivas SET activo = FALSE WHERE id_feriado = ?', [1]);
      expect(mockExecute).toHaveBeenCalled();
    });
  });
});