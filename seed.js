    const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function crearUsuarios() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    // 1. Obtener IDs necesarios
    const [roles] = await pool.execute(`SELECT id_rol, nombre_rol FROM roles`);
    const rolMap = {};
    roles.forEach(r => { rolMap[r.nombre_rol] = r.id_rol; });

    const [depto] = await pool.execute(`SELECT id_departamento FROM departamentos WHERE codigo_unico_4_digitos = '0001'`);
    if (!depto.length) throw new Error('Departamento 0001 no encontrado. Ejecuta primero el script SQL.');
    const idDepto = depto[0].id_departamento;

    const [tipo] = await pool.execute(`SELECT id_tipo FROM tipo_nombramiento WHERE nombre_tipo = 'propiedad'`);
    if (!tipo.length) throw new Error('Tipo nombramiento "propiedad" no encontrado.');
    const idTipo = tipo[0].id_tipo;

    // 2. Datos de usuarios a crear (se agregó el Funcionario)
    const usuarios = [
      {
        cedula: '111111111',
        nombre_completo: 'Jefe Unidad Prueba',
        correo: 'jefatura@cuc.ac.cr',
        rol: 'Jefatura',
        password: 'Jefatura123',
      },
      {
        cedula: '222222222',
        nombre_completo: 'RRHH Usuario',
        correo: 'rrhh@cuc.ac.cr',
        rol: 'Recursos Humanos',
        password: 'RRHH123',
      },
      {
        cedula: '333333333',
        nombre_completo: 'Admin Principal',
        correo: 'admin@cuc.ac.cr',
        rol: 'Administrador',
        password: 'Admin123',
      },
      {
        cedula: '123456789',
        nombre_completo: 'Funcionario Prueba',
        correo: 'funcionario@cuc.ac.cr',
        rol: 'Funcionario',
        password: 'Funcionario123',
      },
    ];

    for (const u of usuarios) {
      // Verificar si ya existe
      const [existe] = await pool.execute(`SELECT id_usuario FROM usuarios WHERE cedula_unica = ?`, [u.cedula]);
      if (existe.length) {
        console.log(`⚠️ Usuario con cédula ${u.cedula} ya existe. Se omite.`);
        continue;
      }

      const passwordHash = bcrypt.hashSync(u.password, 10);
      const idRol = rolMap[u.rol];
      if (!idRol) throw new Error(`Rol "${u.rol}" no encontrado en la BD.`);

      // Insertar usuario
      const [result] = await pool.execute(
        `INSERT INTO usuarios (cedula_unica, nombre_completo, correo_electronico, fecha_ingreso,
          id_rol_actual, id_departamento, id_tipo_nombramiento, estado_usuario, password_hash)
         VALUES (?, ?, ?, CURDATE(), ?, ?, ?, 'activo', ?)`,
        [u.cedula, u.nombre_completo, u.correo, idRol, idDepto, idTipo, passwordHash]
      );
      const idUsuario = result.insertId;

      // Inicializar saldo de vacaciones para el año actual
      await pool.execute(
        `INSERT INTO saldo_vacaciones (id_usuario, saldo_actual, saldo_inicial_periodo, periodo_anio)
         VALUES (?, 15.00, 15.00, YEAR(CURDATE()))`,
        [idUsuario]
      );

      // Si el rol es Jefatura, asignarle el departamento como unidad a cargo
      if (u.rol === 'Jefatura') {
        await pool.execute(
          `INSERT INTO unidades_a_cargo (id_jefatura, id_departamento) VALUES (?, ?)`,
          [idUsuario, idDepto]
        );
        // Actualizar el departamento para ponerlo como jefe de unidad
        await pool.execute(
          `UPDATE departamentos SET id_jefe_unidad = ? WHERE id_departamento = ?`,
          [idUsuario, idDepto]
        );
      }

      console.log(`✅ Usuario creado: ${u.nombre_completo} (${u.rol}) - Cédula: ${u.cedula} / Contraseña: ${u.password}`);
    }

    console.log('\n🎉 Proceso completado.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

crearUsuarios();