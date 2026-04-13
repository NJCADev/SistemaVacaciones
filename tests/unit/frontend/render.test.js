// Simulación de funciones del frontend
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const estadoBadge = (estado) => {
  const map = {
    'pendiente': 'badge-pending',
    'aprobada_jefatura': 'badge-info',
    'aprobada_rrhh': 'badge-approved',
    'rechazada': 'badge-rejected',
    'programada': 'badge-warning',
    'retirada': 'badge-gray',
    'ejecutada': 'badge-success'
  };
  const texto = {
    'pendiente': 'Pendiente',
    'aprobada_jefatura': 'Aprob. Jefatura',
    'aprobada_rrhh': 'Aprob. RRHH',
    'rechazada': 'Rechazada',
    'programada': 'Programada',
    'retirada': 'Retirada',
    'ejecutada': 'Ejecutada'
  }[estado] || estado;
  return `<span class="badge ${map[estado] || 'badge-gray'}">${texto}</span>`;
};

const renderTableSolicitudes = (solicitudes, filtroEstado) => {
  if (!solicitudes.length) return [];
  let data = solicitudes;
  if (filtroEstado) {
    data = solicitudes.filter(s => s.estado === filtroEstado);
  }
  return data;
};

describe('Renderizado de frontend', () => {
  test('formatDate devuelve formato dd/mm/yyyy', () => {
    const result = formatDate('2026-04-14T12:00:00');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  test('formatDate con null devuelve —', () => {
    expect(formatDate(null)).toBe('—');
  });

  test('estadoBadge genera spans con clases correctas', () => {
    const htmlPendiente = estadoBadge('pendiente');
    expect(htmlPendiente).toContain('badge-pending');
    expect(htmlPendiente).toContain('Pendiente');

    const htmlProgramada = estadoBadge('programada');
    expect(htmlProgramada).toContain('badge-warning');
    expect(htmlProgramada).toContain('Programada');
  });

  test('renderTableSolicitudes filtra por estado', () => {
    const mockSolicitudes = [
      { id: 1, estado: 'pendiente' },
      { id: 2, estado: 'aprobada_jefatura' },
      { id: 3, estado: 'pendiente' }
    ];
    const filtradas = renderTableSolicitudes(mockSolicitudes, 'pendiente');
    expect(filtradas.length).toBe(2);
    expect(filtradas[0].id).toBe(1);
    expect(filtradas[1].id).toBe(3);
  });

  test('renderTableSolicitudes sin filtro devuelve todas', () => {
    const mockSolicitudes = [
      { id: 1, estado: 'pendiente' },
      { id: 2, estado: 'aprobada_jefatura' }
    ];
    const filtradas = renderTableSolicitudes(mockSolicitudes, '');
    expect(filtradas.length).toBe(2);
  });

  test('renderTableSolicitudes con array vacío devuelve array vacío', () => {
    expect(renderTableSolicitudes([], 'pendiente')).toEqual([]);
  });
});