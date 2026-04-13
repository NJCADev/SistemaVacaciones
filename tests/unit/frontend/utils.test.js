// Funciones copiadas del frontend para prueba aislada
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
  };
  const texto = {
    'pendiente': 'Pendiente',
    'aprobada_jefatura': 'Aprob. Jefatura',
    'aprobada_rrhh': 'Aprob. RRHH',
    'rechazada': 'Rechazada',
  }[estado] || estado;
  return `<span class="badge ${map[estado] || 'badge-gray'}">${texto}</span>`;
};

describe('Utilidades del frontend', () => {
  test('formatDate devuelve formato dd/mm/yyyy', () => {
    const result = formatDate('2026-04-14T12:00:00');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  test('formatDate con null devuelve —', () => {
    expect(formatDate(null)).toBe('—');
  });

  test('estadoBadge genera HTML correcto para pendiente', () => {
    const html = estadoBadge('pendiente');
    expect(html).toContain('badge-pending');
    expect(html).toContain('Pendiente');
  });

  test('estadoBadge para estado desconocido usa badge-gray', () => {
    const html = estadoBadge('desconocido');
    expect(html).toContain('badge-gray');
  });
});