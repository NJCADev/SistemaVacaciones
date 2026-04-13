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

app.get('/vacaciones-colectivas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vacaciones-colectivas.html'));
});

app.get('/perfil', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'perfil.html'));
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

app.put('/api/solicitudes/:id', authenticateToken, requireRole('Jefatura', 'Recursos Humanos', 'Administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, observaciones } = req.body;

    // Obtener la solicitud actual junto con el departamento del usuario solicitante
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
      if (usuarioRol === 'Jefatura') {
        // Jefatura solo puede aprobar solicitudes pendientes de su departamento
        if (solicitud.estado !== 'pendiente') {
          return res.status(400).json({ error: 'La solicitud no está pendiente.' });
        }
        if (solicitud.usuario_depto !== req.user.id_departamento) {
          return res.status(403).json({ error: 'No tiene permiso para aprobar solicitudes de otro departamento.' });
        }
        nuevoEstado = 'aprobada_jefatura';
      } else if (usuarioRol === 'Recursos Humanos' || usuarioRol === 'Administrador') {
        // RRHH/Admin aprueba solicitudes en estado 'aprobada_jefatura' o 'pendiente'
        if (solicitud.estado !== 'aprobada_jefatura' && solicitud.estado !== 'pendiente') {
          return res.status(400).json({ error: 'La solicitud no está en un estado válido para aprobación por RRHH.' });
        }
        // Cambio HU-03: pasa a 'programada' en lugar de 'aprobada_rrhh'
        nuevoEstado = 'programada';
      } else {
        return res.status(403).json({ error: 'Rol no autorizado para aprobar.' });
      }
    } else if (accion === 'rechazar') {
      // Cualquier rol autorizado puede rechazar
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

// Cambiar rol de un usuario
app.put('/api/usuarios/:id/rol', authenticateToken, requireRole('Recursos Humanos', 'Administrador'), async (req, res) => {
  const { id } = req.params;
  const { nuevo_rol_id, password_confirmacion, vigencia_desde, vigencia_hasta } = req.body;
  const adminId = req.user.id_usuario;

  console.log(`[ROL] Solicitud recibida: usuario ${id}, admin ${adminId}, nuevo rol ${nuevo_rol_id}`);

  try {
    // 1. Validar que el administrador no se cambie a sí mismo
    if (parseInt(id) === adminId) {
      console.log('[ROL] Intento de auto-modificación');
      return res.status(403).json({ error: 'No puede cambiar su propio rol.' });
    }

    // 2. Verificar contraseña del administrador
    const [adminRows] = await pool.execute('SELECT password_hash FROM usuarios WHERE id_usuario = ?', [adminId]);
    if (!adminRows.length) {
      console.log('[ROL] Admin no encontrado');
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }
    const passwordValida = await bcrypt.compare(password_confirmacion, adminRows[0].password_hash);
    if (!passwordValida) {
      console.log('[ROL] Contraseña incorrecta');
      return res.status(401).json({ error: 'Contraseña de confirmación incorrecta.' });
    }

    // 3. Obtener usuario a modificar
    const [userRows] = await pool.execute(
      `SELECT u.id_rol_actual, r.nombre_rol 
       FROM usuarios u 
       JOIN roles r ON u.id_rol_actual = r.id_rol 
       WHERE u.id_usuario = ?`, 
      [id]
    );
    if (!userRows.length) {
      console.log('[ROL] Usuario destino no encontrado');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const usuario = userRows[0];

    // 4. Validar que el nuevo rol sea diferente
    if (usuario.id_rol_actual === nuevo_rol_id) {
      console.log('[ROL] El usuario ya tiene ese rol');
      return res.status(400).json({ error: 'El usuario ya posee ese rol.' });
    }

    // 5. Si el nuevo rol es Jefatura, verificar que tenga al menos una unidad a cargo
    const [rolRows] = await pool.execute('SELECT nombre_rol FROM roles WHERE id_rol = ?', [nuevo_rol_id]);
    const nuevoRolNombre = rolRows[0]?.nombre_rol;
    if (nuevoRolNombre === 'Jefatura') {
      const [unidades] = await pool.execute('SELECT 1 FROM unidades_a_cargo WHERE id_jefatura = ?', [id]);
      if (!unidades.length) {
        console.log('[ROL] Usuario no tiene unidades a cargo para ser Jefatura');
        return res.status(400).json({ 
          error: 'El usuario no tiene unidades a cargo. Asigne al menos una unidad antes de asignar rol Jefatura.' 
        });
      }
    }

    // 6. Registrar cambio en historial
    await pool.execute(
      `INSERT INTO usuario_historial_rol 
        (id_usuario, id_rol_anterior, id_rol_nuevo, id_autorizador, vigencia_desde, vigencia_hasta) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, usuario.id_rol_actual, nuevo_rol_id, adminId, vigencia_desde || new Date(), vigencia_hasta || null]
    );

    // 7. Actualizar rol del usuario
    await pool.execute('UPDATE usuarios SET id_rol_actual = ? WHERE id_usuario = ?', [nuevo_rol_id, id]);

    // 8. Registrar en bitácora de auditoría
    await pool.execute(
      `INSERT INTO bitacora_auditoria (id_usuario, tabla_afectada, operacion, valor_anterior, valor_nuevo)
       VALUES (?, 'usuarios', 'UPDATE', ?, ?)`,
      [adminId, 
       JSON.stringify({ id_rol_actual: usuario.id_rol_actual }), 
       JSON.stringify({ id_rol_actual: nuevo_rol_id })]
    );

    console.log(`[ROL] Cambio exitoso para usuario ${id}`);
    res.json({ success: true, message: 'Rol actualizado correctamente' });
  } catch (error) {
    console.error('[ROL] Error en endpoint:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/perfil', authenticateToken, async (req, res) => {
  const userId = req.user.id_usuario;
  try {
    const [rows] = await pool.execute(
      `SELECT u.cedula_unica AS cedula, u.nombre_completo, u.correo_electronico AS email, u.telefono,
              u.fecha_ingreso, u.estado_usuario,
              r.nombre_rol AS rol,
              d.nombre_unidad AS departamento, d.categoria_vacacional,
              tn.nombre_tipo AS tipo_nombramiento,
              (SELECT saldo_actual FROM saldo_vacaciones 
               WHERE id_usuario = u.id_usuario AND periodo_anio = YEAR(CURDATE())) AS saldo_actual
       FROM usuarios u
       JOIN roles r ON u.id_rol_actual = r.id_rol
       JOIN departamentos d ON u.id_departamento = d.id_departamento
       JOIN tipo_nombramiento tn ON u.id_tipo_nombramiento = tn.id_tipo
       WHERE u.id_usuario = ?`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/perfil/contacto', authenticateToken, async (req, res) => {
  const userId = req.user.id_usuario;
  const { email, telefono } = req.body;
  
  // Validaciones básicas
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Formato de correo inválido.' });
  }
  if (telefono && !/^[0-9+\-\s]{7,20}$/.test(telefono)) {
    return res.status(400).json({ error: 'Formato de teléfono inválido.' });
  }

  try {
    await pool.execute(
      `UPDATE usuarios SET correo_electronico = ?, telefono = ? WHERE id_usuario = ?`,
      [email || null, telefono || null, userId]
    );
    
    // Registrar en bitácora
    await pool.execute(
      `INSERT INTO bitacora_auditoria (id_usuario, tabla_afectada, operacion, valor_nuevo)
       VALUES (?, 'usuarios', 'UPDATE_CONTACTO', ?)`,
      [userId, JSON.stringify({ email, telefono })]
    );
    
    res.json({ success: true, message: 'Datos de contacto actualizados correctamente.' });
  } catch (error) {
    console.error('Error actualizando contacto:', error);
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

// Endpoint para ejecutar el descuento diario por asistencia
app.post('/api/tareas/diarias', authenticateToken, requireRole('Recursos Humanos', 'Administrador'), async (req, res) => {
  try {
    const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 1. Obtener solicitudes en estado 'programada' que incluyan la fecha actual
    const [solicitudes] = await pool.execute(
      `SELECT s.id_solicitud, s.id_usuario, s.dias_solicitados, s.fecha_inicio, s.fecha_fin
       FROM solicitudes_vacaciones s
       WHERE s.estado = 'programada'
         AND ? BETWEEN s.fecha_inicio AND s.fecha_fin`,
      [fechaHoy]
    );
    
    let descontados = 0;
    let finalizadas = 0;
    
    for (const sol of solicitudes) {
      // 2. Verificar asistencia del día actual
      const [asistencia] = await pool.execute(
        `SELECT estado_asistencia FROM bitacora_asistencia 
         WHERE id_usuario = ? AND fecha = ?`,
        [sol.id_usuario, fechaHoy]
      );
      
      // 3. Si estuvo ausente (no justificado), descontar 1 día
      if (asistencia.length > 0 && asistencia[0].estado_asistencia === 'ausente') {
        // Verificar que tenga saldo suficiente (al menos 1 día)
        const [saldo] = await pool.execute(
          `SELECT saldo_actual FROM saldo_vacaciones 
           WHERE id_usuario = ? AND periodo_anio = YEAR(?)`,
          [sol.id_usuario, fechaHoy]
        );
        
        if (saldo.length > 0 && saldo[0].saldo_actual >= 1) {
          // Descontar 1 día
          await pool.execute(
            `UPDATE saldo_vacaciones 
             SET saldo_actual = saldo_actual - 1 
             WHERE id_usuario = ? AND periodo_anio = YEAR(?)`,
            [sol.id_usuario, fechaHoy]
          );
          descontados++;
          
          // Registrar en auditoría (opcional)
        }
      }
      
      // 4. Verificar si la solicitud ya terminó (fecha_fin < hoy) y actualizar a 'ejecutada'
      if (new Date(sol.fecha_fin) < new Date(fechaHoy)) {
        await pool.execute(
          `UPDATE solicitudes_vacaciones SET estado = 'ejecutada' WHERE id_solicitud = ?`,
          [sol.id_solicitud]
        );
        finalizadas++;
      }
    }
    
    res.json({
      success: true,
      message: `Proceso completado. Solicitudes procesadas: ${solicitudes.length}, días descontados: ${descontados}, solicitudes finalizadas: ${finalizadas}`
    });
  } catch (error) {
    console.error('Error en tarea diaria:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/solicitudes/:id/retirar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la solicitud pertenezca al usuario o sea RRHH/Admin
    const [solicitudes] = await pool.execute(
      `SELECT * FROM solicitudes_vacaciones WHERE id_solicitud = ?`,
      [id]
    );
    if (solicitudes.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    const sol = solicitudes[0];
    
    // Solo el dueño, RRHH o Admin pueden retirar
    if (sol.id_usuario !== req.user.id_usuario && !['Recursos Humanos', 'Administrador'].includes(req.user.rol_nombre)) {
      return res.status(403).json({ error: 'No tiene permiso para retirar esta solicitud' });
    }
    
    // Solo se puede retirar si está pendiente o aprobada_jefatura (antes de programada)
    if (!['pendiente', 'aprobada_jefatura'].includes(sol.estado)) {
      return res.status(400).json({ error: 'La solicitud no puede ser retirada en su estado actual' });
    }
    
    await pool.execute(
      `UPDATE solicitudes_vacaciones SET estado = 'retirada', fecha_resolucion = NOW() WHERE id_solicitud = ?`,
      [id]
    );
    
    res.json({ success: true, message: 'Solicitud retirada correctamente' });
  } catch (error) {
    console.error('Error retirando solicitud:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== API FERIADOS ====================
app.get('/api/vacaciones-colectivas', authenticateToken, async (req, res) => {
  try {
    const [feriados] = await pool.execute(
      `SELECT id_feriado, fecha_feriado, descripcion, activo 
       FROM vacaciones_colectivas 
       WHERE activo = TRUE 
       ORDER BY fecha_feriado`
    );
    res.json(feriados);
  } catch (error) {
    console.error('Error obteniendo vacaciones colectivas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/vacaciones-colectivas', authenticateToken, requireRole('Recursos Humanos', 'Administrador'), async (req, res) => {
  const { fecha, descripcion } = req.body;
  const creadoPor = req.user.id_usuario;

  if (!fecha) {
    return res.status(400).json({ error: 'La fecha es obligatoria.' });
  }

  try {
    // Validar que no exista ya (activo)
    const [existente] = await pool.execute(
      'SELECT id_feriado FROM vacaciones_colectivas WHERE fecha_feriado = ? AND activo = TRUE',
      [fecha]
    );
    if (existente.length) {
      return res.status(400).json({ error: 'Ya existe un feriado activo en esa fecha.' });
    }

    await pool.execute(
      `INSERT INTO vacaciones_colectivas (fecha_feriado, descripcion, creado_por, activo) 
       VALUES (?, ?, ?, TRUE)`,
      [fecha, descripcion || null, creadoPor]
    );

    res.json({ success: true, message: 'Feriado registrado correctamente.' });
  } catch (error) {
    console.error('Error creando feriado:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.delete('/api/vacaciones-colectivas/:id', authenticateToken, requireRole('Recursos Humanos', 'Administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    // Soft delete: marcar como inactivo
    await pool.execute(
      'UPDATE vacaciones_colectivas SET activo = FALSE WHERE id_feriado = ?',
      [id]
    );
    res.json({ success: true, message: 'Feriado eliminado correctamente.' });
  } catch (error) {
    console.error('Error eliminando feriado:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ==================== API UNIDADES A CARGO ====================
// Obtener unidades a cargo de un usuario
app.get('/api/usuarios/:id/unidades', authenticateToken, requireRole('Recursos Humanos', 'Administrador'), async (req, res) => {
  try {
    const [unidades] = await pool.execute(
      `SELECT d.id_departamento, d.nombre_unidad, d.codigo_unico_4_digitos
       FROM unidades_a_cargo ua
       JOIN departamentos d ON ua.id_departamento = d.id_departamento
       WHERE ua.id_jefatura = ?`,
      [req.params.id]
    );
    res.json(unidades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener unidades' });
  }
});

// Asignar unidad a cargo
app.post('/api/usuarios/:id/unidades', authenticateToken, requireRole('Recursos Humanos', 'Administrador'), async (req, res) => {
  const { id_departamento } = req.body;
  const id_jefatura = req.params.id;
  try {
    await pool.execute(
      'INSERT INTO unidades_a_cargo (id_jefatura, id_departamento) VALUES (?, ?)',
      [id_jefatura, id_departamento]
    );
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Esta unidad ya está asignada a esta jefatura.' });
    }
    res.status(500).json({ error: 'Error al asignar unidad' });
  }
});

// Eliminar unidad a cargo
app.delete('/api/usuarios/:id/unidades/:id_departamento', authenticateToken, requireRole('Recursos Humanos', 'Administrador'), async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM unidades_a_cargo WHERE id_jefatura = ? AND id_departamento = ?',
      [req.params.id, req.params.id_departamento]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar unidad' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const cron = require('node-cron');

// Tarea diaria a las 23:00 hora Costa Rica
cron.schedule('0 23 * * *', async () => {
  console.log('Ejecutando descuento diario por asistencia...');
  try {
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    // Lógica similar al endpoint pero sin autenticación
    const [solicitudes] = await pool.execute(
      `SELECT s.id_solicitud, s.id_usuario, s.dias_solicitados, s.fecha_inicio, s.fecha_fin
       FROM solicitudes_vacaciones s
       WHERE s.estado = 'programada'
         AND ? BETWEEN s.fecha_inicio AND s.fecha_fin`,
      [fechaHoy]
    );
    
    for (const sol of solicitudes) {
      const [asistencia] = await pool.execute(
        `SELECT estado_asistencia FROM bitacora_asistencia 
         WHERE id_usuario = ? AND fecha = ?`,
        [sol.id_usuario, fechaHoy]
      );
      
      if (asistencia.length > 0 && asistencia[0].estado_asistencia === 'ausente') {
        await pool.execute(
          `UPDATE saldo_vacaciones 
           SET saldo_actual = saldo_actual - 1 
           WHERE id_usuario = ? AND periodo_anio = YEAR(?) AND saldo_actual >= 1`,
          [sol.id_usuario, fechaHoy]
        );
      }
      
      if (new Date(sol.fecha_fin) < new Date(fechaHoy)) {
        await pool.execute(
          `UPDATE solicitudes_vacaciones SET estado = 'ejecutada' WHERE id_solicitud = ?`,
          [sol.id_solicitud]
        );
      }
    }
    console.log(`Descuento diario completado.`);
  } catch (error) {
    console.error('Error en cron diario:', error);
  }
}, {
  timezone: "America/Costa_Rica"
});