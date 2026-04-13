// =====================================================
// SISTEMA DE VACACIONES CUC — Shared JS
// =====================================================

// SVG Icons
const Icons = {
  home: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  list: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  plus: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  check: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  users: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  building: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  logout: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  close: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  calendar: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  user: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  audit: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/></svg>`,
 briefcase: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>`,
};

// ---- Auth / Session ----
let currentUser = null;

async function loadSession() {
  try {
    const res = await fetch('/api/session');
    if (!res.ok) { window.location.href = '/'; return null; }
    const data = await res.json();
    currentUser = data.user;
    return data.user;
  } catch {
    window.location.href = '/';
    return null;
  }
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  currentUser = null;
  window.location.replace('/');
}

// ---- Sidebar Builder ----
function buildSidebar(activeItem) {
  const user = currentUser;
  if (!user) return;

  const initials = (user.nombre[0] + (user.apellidos || '')[0]).toUpperCase();

  const navItems = [
    { id: 'dashboard', href: '/dashboard', label: 'Inicio', icon: Icons.home, roles: null },
    { id: 'solicitudes', href: '/solicitudes', label: 'Mis Solicitudes', icon: Icons.list, roles: null },
    { id: 'nueva-solicitud', href: '/nueva-solicitud', label: 'Nueva Solicitud', icon: Icons.plus, roles: null },
    { id: 'aprobaciones', href: '/aprobaciones', label: 'Aprobaciones', icon: Icons.check, roles: ['Jefatura', 'Recursos Humanos', 'Administrador'] },
    { id: 'usuarios', href: '/usuarios', label: 'Usuarios', icon: Icons.users, roles: ['Recursos Humanos', 'Administrador'] },
    { id: 'departamentos', href: '/departamentos', label: 'Departamentos', icon: Icons.building, roles: ['Recursos Humanos', 'Administrador'] },
    { id: 'vacaciones-colectivas', href: '/vacaciones-colectivas', label: 'Feriados', icon: Icons.calendar, roles: ['Recursos Humanos', 'Administrador'] },
    { id: 'perfil', href: '/perfil', label: 'Mi Perfil', icon: Icons.user, roles: null },
    { id: 'auditoria', href: '/auditoria', label: 'Auditoría', icon: Icons.audit, roles: ['Recursos Humanos', 'Administrador'] },
    { id: 'nombramientos', href: '/nombramientos', label: 'Nombramientos', icon: Icons.briefcase, roles: ['Recursos Humanos', 'Administrador'] },
  ];
  const filtered = navItems.filter(i => !i.roles || i.roles.includes(user.rol));

  const nav = filtered.map(i => `
    <a href="${i.href}" class="nav-item ${activeItem === i.id ? 'active' : ''}">
      ${i.icon} ${i.label}
    </a>
  `).join('');

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="app-name">Vacaciones CUC</div>
      <div class="app-sub">Sistema de Gestión</div>
    </div>
    <div class="sidebar-user">
      <div class="user-avatar">${initials}</div>
      <div class="user-name">${user.nombre} ${user.apellidos}</div>
      <div class="user-role">${user.rol} · ${user.departamento}</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Menú</div>
      ${nav}
    </nav>
    <div class="sidebar-footer">
      <button class="btn-logout" onclick="logout()">
        ${Icons.logout} Cerrar sesión
      </button>
    </div>
  `;
}

// ---- Utilities ----
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  setTimeout(() => el.classList.remove('show'), 5000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

// Estado → badge
function estadoBadge(estado) {
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
}