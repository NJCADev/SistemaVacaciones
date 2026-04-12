const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Deshabilitar caché para archivos HTML y rutas de la SPA
app.use((req, res, next) => {
  const htmlRoutes = ['/dashboard','/solicitudes','/nueva-solicitud','/aprobaciones','/usuarios','/departamentos'];
  if (req.path.endsWith('.html') || req.path === '/' || htmlRoutes.includes(req.path)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_vacaciones_cuc_2024';

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.execute(
      `SELECT u.id_usuario, u.cedula_unica AS cedula, u.nombre_completo, u.correo_electronico AS email,
              u.estado_usuario, u.id_rol_actual, u.id_departamento,
              r.nombre_rol as rol_nombre, d.nombre_unidad as departamento_nombre
       FROM usuarios u
       JOIN roles r ON u.id_rol_actual = r.id_rol
       JOIN departamentos d ON u.id_departamento = d.id_departamento
       WHERE u.id_usuario = ? AND u.estado_usuario = 'activo'`,
      [decoded.id]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    req.user = users[0];
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol_nombre)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }
    next();
  };
};

// ==================== RUTAS HTML ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/solicitudes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'solicitudes.html'));
});

app.get('/nueva-solicitud', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'nueva-solicitud.html'));
});

app.get('/aprobaciones', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aprobaciones.html'));
});

app.get('/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
});

app.get('/departamentos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'departamentos.html'));
});

// ==================== API AUTH ====================

app.post('/api/login', async (req, res) => {
  try {
    const { cedula, password } = req.body;
    const [users] = await pool.execute(
      `SELECT u.id_usuario, u.cedula_unica AS cedula, u.nombre_completo AS nombre_completo, 
              u.correo_electronico AS email, u.password_hash, u.estado_usuario,
              r.nombre_rol AS rol_nombre, d.nombre_unidad AS departamento_nombre
      FROM usuarios u
      JOIN roles r ON u.id_rol_actual = r.id_rol
      JOIN departamentos d ON u.id_departamento = d.id_departamento
      WHERE u.cedula_unica = ? AND u.estado_usuario = 'activo'`,
      [cedula]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id_usuario, cedula: user.cedula, rol: user.rol_nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      user: {
        id: user.id_usuario,
        nombre_completo: user.nombre_completo,
        cedula: user.cedula,
        email: user.email,
        rol: user.rol_nombre,
        departamento: user.departamento_nombre
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/session', authenticateToken, (req, res) => {
  const nombreCompleto = req.user.nombre_completo || '';
  const partes = nombreCompleto.trim().split(' ');
  const nombre = partes[0] || '';
  const apellidos = partes.slice(1).join(' ') || '';

  res.json({
    user: {
      id: req.user.id_usuario,
      nombre: nombre,
      apellidos: apellidos,
      cedula: req.user.cedula,
      email: req.user.email,
      rol: req.user.rol_nombre,
      departamento: req.user.departamento_nombre
    }
  });
});

// ==================== API SALDO ====================

app.get('/api/saldo', authenticateToken, async (req, res) => {
  try {
    const [saldos] = await pool.execute(
      `SELECT saldo_actual AS dias_disponibles, 0 AS dias_tomados, 0 AS dias_pendientes
       FROM saldo_vacaciones
       WHERE id_usuario = ? AND periodo_anio = YEAR(CURDATE())`,
      [req.user.id_usuario]
    );
    
    if (saldos.length === 0) {
      return res.json({ dias_disponibles: 0, dias_tomados: 0, dias_pendientes: 0 });
    }
    
    res.json(saldos[0]);
  } catch (error) {
    console.error('Error obteniendo saldo:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== API SOLICITUDES ====================

app.get('/api/solicitudes', authenticateToken, async (req, res) => {
  try {
    const rol = req.user.rol_nombre;
    let query = `
      SELECT s.id_solicitud, s.fecha_inicio, s.fecha_fin, s.dias_solicitados, 
             s.estado, s.observaciones, s.fecha_solicitud,
             u.nombre_completo AS usuario_nombre,
             d.nombre_unidad AS departamento_nombre
      FROM solicitudes_vacaciones s
      JOIN usuarios u ON s.id_usuario = u.id_usuario
      JOIN departamentos d ON u.id_departamento = d.id_departamento
    `;
    let params = [];
    let conditions = [];

    if (rol === 'Funcionario') {
      conditions.push('s.id_usuario = ?');
      params.push(req.user.id_usuario);
    } else if (rol === 'Jefatura') {
      // Jefatura ve solo las solicitudes de su departamento
      conditions.push('u.id_departamento = ?');
      params.push(req.user.id_departamento);
    }
    // RRHH y Administrador ven todas (sin condiciones adicionales)

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.fecha_solicitud DESC';
    
    const [solicitudes] = await pool.execute(query, params);
    
    // Dividir nombre_completo para el frontend
    const resultado = solicitudes.map(s => {
      const partes = (s.usuario_nombre || '').split(' ');
      return {
        ...s,
        usuario_nombre: partes[0] || '',
        usuario_apellidos: partes.slice(1).join(' ') || '',
        estado_nombre: s.estado  // compatibilidad con frontend
      };
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/solicitudes', authenticateToken, async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, observaciones } = req.body;
    
    // Calcular días hábiles
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    let dias = 0;
    const current = new Date(inicio);
    
    while (current <= fin) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) dias++;
      current.setDate(current.getDate() + 1);
    }

    // Verificar saldo disponible
    const [saldos] = await pool.execute(
      `SELECT saldo_actual FROM saldo_vacaciones 
       WHERE id_usuario = ? AND periodo_anio = YEAR(CURDATE())`,
      [req.user.id_usuario]
    );

    const saldoDisponible = saldos.length > 0 ? saldos[0].saldo_actual : 0;
    if (saldoDisponible < dias) {
      return res.status(400).json({ error: 'No tiene suficientes días disponibles' });
    }

    // Insertar solicitud
    const [result] = await pool.execute(
      `INSERT INTO solicitudes_vacaciones 
        (id_usuario, fecha_inicio, fecha_fin, dias_solicitados, observaciones, estado)
       VALUES (?, ?, ?, ?, ?, 'pendiente')`,
      [req.user.id_usuario, fecha_inicio, fecha_fin, dias, observaciones || null]
    );

    res.json({ success: true, id: result.insertId, dias });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/solicitudes/:id', authenticateToken, requireRole('Jefatura', 'RRHH', 'Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, observaciones } = req.body;

    // Obtener la solicitud actual
    const [solicitudes] = await pool.execute(
      `SELECT s.*, u.id_departamento AS usuario_depto
       FROM solicitudes_vacaciones s
       JOIN usuarios u ON s.id_usuario = u.id_usuario
       WHERE s.id_solicitud = ?`,
      [id]
    );

    if (solicitudes.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const solicitud = solicitudes[0];
    const usuarioRol = req.user.rol_nombre;
    const usuarioId = req.user.id_usuario;

    // Validar que no se apruebe a sí mismo
    if (accion === 'aprobar' && solicitud.id_usuario === usuarioId) {
      return res.status(403).json({ error: 'No puede aprobar su propia solicitud.' });
    }

    let nuevoEstado = null;

    if (accion === 'aprobar') {
      // Lógica según rol
      if (usuarioRol === 'Jefatura') {
        // Jefatura solo puede aprobar solicitudes en estado 'pendiente' de su departamento
        if (solicitud.estado !== 'pendiente') {
          return res.status(400).json({ error: 'La solicitud no está pendiente.' });
        }
        if (solicitud.usuario_depto !== req.user.id_departamento) {
          return res.status(403).json({ error: 'No tiene permiso para aprobar solicitudes de otro departamento.' });
        }
        nuevoEstado = 'aprobada_jefatura';
      } else if (usuarioRol === 'RRHH' || usuarioRol === 'Administrador') {
        // RRHH puede aprobar solicitudes en 'aprobada_jefatura' (o 'pendiente' si se requiere)
        if (solicitud.estado !== 'aprobada_jefatura' && solicitud.estado !== 'pendiente') {
          return res.status(400).json({ error: 'La solicitud no está en un estado válido para aprobación por RRHH.' });
        }
        nuevoEstado = 'aprobada_rrhh';
      } else {
        return res.status(403).json({ error: 'Rol no autorizado para aprobar.' });
      }
    } else if (accion === 'rechazar') {
      // Cualquiera de los roles autorizados puede rechazar
      if (usuarioRol === 'Jefatura' && solicitud.usuario_depto !== req.user.id_departamento) {
        return res.status(403).json({ error: 'No tiene permiso para rechazar solicitudes de otro departamento.' });
      }
      nuevoEstado = 'rechazada';
    } else {
      return res.status(400).json({ error: 'Acción no válida.' });
    }

    // Actualizar la solicitud
    await pool.execute(
      `UPDATE solicitudes_vacaciones 
       SET estado = ?, comentario_aprobador = ?, fecha_resolucion = NOW(), id_aprobador = ? 
       WHERE id_solicitud = ?`,
      [nuevoEstado, observaciones || null, usuarioId, id]
    );

    res.json({ success: true, nuevoEstado });
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== API USUARIOS ====================

app.get('/api/usuarios', authenticateToken, requireRole('Recursos Humanos', 'Administrador'), async (req, res) => {
  try {
    const [usuarios] = await pool.execute(
      `SELECT u.id_usuario, u.cedula_unica AS cedula, u.nombre_completo, u.correo_electronico AS email, 
              u.estado_usuario,
              r.nombre_rol AS rol, d.nombre_unidad AS departamento, tn.nombre_tipo AS tipo_nombramiento
       FROM usuarios u
       JOIN roles r ON u.id_rol_actual = r.id_rol
       JOIN departamentos d ON u.id_departamento = d.id_departamento
       JOIN tipo_nombramiento tn ON u.id_tipo_nombramiento = tn.id_tipo
       ORDER BY u.nombre_completo`
    );
    
    const usuariosFormateados = usuarios.map(u => {
      const partes = (u.nombre_completo || '').trim().split(' ');
      return {
        id_usuario: u.id_usuario,
        cedula: u.cedula,
        nombre: partes[0] || '',
        apellidos: partes.slice(1).join(' ') || '',
        email: u.email,
        rol: u.rol,
        departamento: u.departamento,
        tipo_nombramiento: u.tipo_nombramiento,
        activo: u.estado_usuario === 'activo'   // booleano
      };
    });
    
    res.json(usuariosFormateados);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/usuarios', authenticateToken, requireRole('RRHH', 'Administrador'), async (req, res) => {
  try {
    const { cedula, nombre, apellidos, email, password, id_rol, id_departamento, id_tipo_nombramiento } = req.body;
    
    const nombre_completo = `${nombre} ${apellidos}`.trim();
    const password_hash = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      `INSERT INTO usuarios (cedula_unica, nombre_completo, correo_electronico, fecha_ingreso,
        id_rol_actual, id_departamento, id_tipo_nombramiento, password_hash, estado_usuario)
       VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, 'activo')`,
      [cedula, nombre_completo, email, id_rol, id_departamento, id_tipo_nombramiento, password_hash]
    );

    const idUsuario = result.insertId;
    const anioActual = new Date().getFullYear();
    
    // Llamar al SP para calcular el saldo inicial según reglas
    await pool.execute(`CALL calcular_y_actualizar_saldo_inicial(?, ?)`, [idUsuario, anioActual]);

    res.json({ success: true, id: idUsuario });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== API DEPARTAMENTOS ====================

app.get('/api/departamentos', authenticateToken, async (req, res) => {
  try {
    const [deptos] = await pool.execute(
      'SELECT id_departamento, nombre_unidad AS nombre FROM departamentos WHERE activo = 1 ORDER BY nombre_unidad'
    );
    res.json(deptos);
  } catch (error) {
    console.error('Error obteniendo departamentos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/departamentos', authenticateToken, requireRole('RRHH', 'Administrador'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    // Generar código único simple (puedes mejorar)
    const codigo = Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0');
    
    const [result] = await pool.execute(
      `INSERT INTO departamentos (codigo_unico_4_digitos, nombre_unidad, categoria_vacacional, activo)
       VALUES (?, ?, 'Administrador', 1)`,
      [codigo, nombre]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creando departamento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== API ROLES ====================

app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const [roles] = await pool.execute(
      'SELECT id_rol, nombre_rol AS nombre FROM roles ORDER BY nombre_rol'
    );
    res.json(roles);
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== API TIPOS NOMBRAMIENTO ====================

app.get('/api/tipos-nombramiento', authenticateToken, async (req, res) => {
  try {
    const [tipos] = await pool.execute(
      'SELECT id_tipo AS id_tipo_nombramiento, nombre_tipo AS nombre FROM tipo_nombramiento ORDER BY nombre_tipo'
    );
    res.json(tipos);
  } catch (error) {
    console.error('Error obteniendo tipos de nombramiento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== API ESTADÍSTICAS ====================

app.get('/api/estadisticas', authenticateToken, async (req, res) => {
  try {
    const stats = {};

    const [misSolicitudes] = await pool.execute(
      `SELECT COUNT(*) as total FROM solicitudes_vacaciones WHERE id_usuario = ?`,
      [req.user.id_usuario]
    );
    stats.misSolicitudes = misSolicitudes[0].total;

    if (['Jefatura', 'RRHH', 'Administrador'].includes(req.user.rol_nombre)) {
      const [pendientes] = await pool.execute(
        `SELECT COUNT(*) as total FROM solicitudes_vacaciones s
         JOIN usuarios u ON s.id_usuario = u.id_usuario
         WHERE s.estado = 'pendiente' AND u.id_departamento = ?`,
        [req.user.id_departamento]
      );
      stats.pendientesAprobacion = pendientes[0].total;
    }

    if (['RRHH', 'Administrador'].includes(req.user.rol_nombre)) {
      const [usuarios] = await pool.execute(`SELECT COUNT(*) as total FROM usuarios WHERE estado_usuario = 'activo'`);
      stats.totalUsuarios = usuarios[0].total;

      const [deps] = await pool.execute(`SELECT COUNT(*) as total FROM departamentos WHERE activo = 1`);
      stats.totalDepartamentos = deps[0].total;
    }

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Recalcular saldo de un usuario específico
app.post('/api/saldo/recalcular/:usuario_id', authenticateToken, requireRole('RRHH', 'Administrador'), async (req, res) => {
  try {
    const usuarioId = req.params.usuario_id;
    const anio = req.query.anio || new Date().getFullYear();
    
    // Verificar que el usuario existe
    const [users] = await pool.execute('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [usuarioId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    await pool.execute(`CALL calcular_y_actualizar_saldo_inicial(?, ?)`, [usuarioId, anio]);
    
    // Obtener el nuevo saldo calculado
    const [saldo] = await pool.execute(
      `SELECT saldo_actual, saldo_inicial_periodo FROM saldo_vacaciones 
       WHERE id_usuario = ? AND periodo_anio = ?`,
      [usuarioId, anio]
    );
    
    res.json({ 
      success: true, 
      message: 'Saldo recalculado correctamente',
      saldo: saldo.length ? saldo[0] : { saldo_actual: 0, saldo_inicial_periodo: 0 }
    });
  } catch (error) {
    console.error('Error recalculando saldo individual:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Recalcular saldo de todos los usuarios activos
app.post('/api/saldo/recalcular-todos', authenticateToken, requireRole('RRHH', 'Administrador'), async (req, res) => {
  try {
    const anio = req.query.anio || new Date().getFullYear();
    
    // Obtener todos los usuarios activos
    const [usuarios] = await pool.execute(
      `SELECT id_usuario FROM usuarios WHERE estado_usuario = 'activo'`
    );
    
    let procesados = 0;
    let errores = [];
    
    for (const u of usuarios) {
      try {
        await pool.execute(`CALL calcular_y_actualizar_saldo_inicial(?, ?)`, [u.id_usuario, anio]);
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
  } catch (error) {
    console.error('Error en recálculo masivo:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});