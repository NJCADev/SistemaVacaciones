/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: bitacora_asistencia
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `bitacora_asistencia` (
  `id_registro` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `fecha` date NOT NULL,
  `estado_asistencia` enum('presente', 'ausente', 'justificado') NOT NULL,
  `fuente` varchar(50) DEFAULT 'sistema' COMMENT 'Origen del registro',
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_registro`),
  UNIQUE KEY `uk_usuario_fecha` (`id_usuario`, `fecha`),
  KEY `idx_bitacora_fecha` (`fecha`, `estado_asistencia`),
  CONSTRAINT `bitacora_asistencia_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Bitácora de asistencia diaria';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: bitacora_auditoria
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `bitacora_auditoria` (
  `id_auditoria` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL COMMENT 'Usuario que ejecutó la acción',
  `fecha_hora` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tabla_afectada` varchar(50) NOT NULL,
  `operacion` varchar(20) NOT NULL COMMENT 'INSERT, UPDATE, DELETE',
  `valor_anterior` json DEFAULT NULL,
  `valor_nuevo` json DEFAULT NULL,
  `ip_origen` varchar(45) DEFAULT NULL COMMENT 'Dirección IP del cliente',
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_usuario_fecha` (`id_usuario`, `fecha_hora`),
  KEY `idx_tabla` (`tabla_afectada`),
  KEY `idx_auditoria_fecha` (`fecha_hora`)
) ENGINE = InnoDB AUTO_INCREMENT = 11 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Auditoría de acciones críticas';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: departamentos
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `departamentos` (
  `id_departamento` int unsigned NOT NULL AUTO_INCREMENT,
  `codigo_unico_4_digitos` char(4) NOT NULL COMMENT 'Código único de 4 dígitos',
  `nombre_unidad` varchar(100) NOT NULL,
  `categoria_vacacional` enum(
  'Administrador',
  'Docente',
  'Asistente administrativo'
  ) NOT NULL,
  `id_jefe_unidad` int unsigned DEFAULT NULL COMMENT 'FK a usuarios (jefatura)',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uk_codigo` (`codigo_unico_4_digitos`),
  UNIQUE KEY `uk_nombre_unidad` (`nombre_unidad`),
  KEY `fk_departamentos_jefe` (`id_jefe_unidad`),
  CONSTRAINT `fk_departamentos_jefe` FOREIGN KEY (`id_jefe_unidad`) REFERENCES `usuarios` (`id_usuario`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Departamentos / unidades';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: nombramientos
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `nombramientos` (
  `id_nombramiento` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `id_tipo_nombramiento` int unsigned NOT NULL,
  `id_departamento` int unsigned NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_nombramiento`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_activo` (`activo`),
  KEY `id_tipo_nombramiento` (`id_tipo_nombramiento`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `nombramientos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `nombramientos_ibfk_2` FOREIGN KEY (`id_tipo_nombramiento`) REFERENCES `tipo_nombramiento` (`id_tipo`),
  CONSTRAINT `nombramientos_ibfk_3` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`)
) ENGINE = InnoDB AUTO_INCREMENT = 17 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Historial de nombramientos de usuarios';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: permisos
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `permisos` (
  `id_permiso` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_permiso` varchar(100) NOT NULL,
  `modulo` varchar(50) NOT NULL COMMENT 'Módulo al que pertenece',
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_permiso`),
  UNIQUE KEY `uk_nombre_permiso` (`nombre_permiso`)
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Permisos del sistema';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: rol_permiso
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `rol_permiso` (
  `id_rol` int unsigned NOT NULL,
  `id_permiso` int unsigned NOT NULL,
  PRIMARY KEY (`id_rol`, `id_permiso`),
  KEY `id_permiso` (`id_permiso`),
  CONSTRAINT `rol_permiso_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `rol_permiso_ibfk_2` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id_permiso`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Relación rol-permiso';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: roles
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `roles` (
  `id_rol` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) NOT NULL COMMENT 'Funcionario, Jefatura, Recursos Humanos, Administrador',
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uk_nombre_rol` (`nombre_rol`)
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Roles del sistema';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: saldo_vacaciones
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `saldo_vacaciones` (
  `id_saldo` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `saldo_actual` decimal(6, 2) NOT NULL DEFAULT '0.00' COMMENT 'Días disponibles (pueden ser fracciones 0.5)',
  `saldo_inicial_periodo` decimal(6, 2) NOT NULL DEFAULT '0.00',
  `periodo_anio` year NOT NULL,
  `ultima_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_solicitud_asociada` int unsigned DEFAULT NULL COMMENT 'Para descuentos, FK a solicitud',
  PRIMARY KEY (`id_saldo`),
  UNIQUE KEY `uk_usuario_periodo` (`id_usuario`, `periodo_anio`),
  KEY `fk_saldo_solicitud` (`id_solicitud_asociada`),
  KEY `idx_saldo_periodo` (`periodo_anio`, `saldo_actual`),
  CONSTRAINT `fk_saldo_solicitud` FOREIGN KEY (`id_solicitud_asociada`) REFERENCES `solicitudes_vacaciones` (`id_solicitud`) ON DELETE
  SET
  NULL,
  CONSTRAINT `saldo_vacaciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 17 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Saldo de vacaciones por período';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: sesiones_activas
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sesiones_activas` (
  `id_sesion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `token_sesion` varchar(255) NOT NULL,
  `fecha_inicio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultima_actividad` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` timestamp NOT NULL,
  `ip_usuario` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `cerrada_manualmente` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_sesion`),
  UNIQUE KEY `uk_token` (`token_sesion`),
  KEY `id_usuario` (`id_usuario`),
  KEY `idx_sesiones_token` (`token_sesion`, `fecha_expiracion`),
  CONSTRAINT `sesiones_activas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Sesiones activas de usuarios';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: solicitudes_vacaciones
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `solicitudes_vacaciones` (
  `id_solicitud` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `dias_solicitados` decimal(6, 2) NOT NULL COMMENT 'Calculado automáticamente (días hábiles)',
  `observaciones` text,
  `estado` enum(
  'pendiente',
  'aprobada_jefatura',
  'aprobada_rrhh',
  'rechazada',
  'programada',
  'retirada',
  'ejecutada'
  ) NOT NULL DEFAULT 'pendiente',
  `id_aprobador` int unsigned DEFAULT NULL,
  `comentario_aprobador` text,
  `fecha_solicitud` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_resolucion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_solicitud`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fechas` (`fecha_inicio`, `fecha_fin`),
  KEY `id_aprobador` (`id_aprobador`),
  KEY `idx_solicitudes_usuario_estado` (`id_usuario`, `estado`),
  KEY `idx_solicitudes_fechas_estado` (`fecha_inicio`, `fecha_fin`, `estado`),
  CONSTRAINT `solicitudes_vacaciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `solicitudes_vacaciones_ibfk_2` FOREIGN KEY (`id_aprobador`) REFERENCES `usuarios` (`id_usuario`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Solicitudes de vacaciones';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: tipo_nombramiento
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tipo_nombramiento` (
  `id_tipo` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_tipo` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_tipo`),
  UNIQUE KEY `uk_nombre_tipo` (`nombre_tipo`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Tipos de nombramiento';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: unidades_a_cargo
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `unidades_a_cargo` (
  `id_jefatura` int unsigned NOT NULL,
  `id_departamento` int unsigned NOT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_jefatura`, `id_departamento`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `unidades_a_cargo_ibfk_1` FOREIGN KEY (`id_jefatura`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `unidades_a_cargo_ibfk_2` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Unidades supervisadas por una jefatura';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: usuario_historial_rol
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `usuario_historial_rol` (
  `id_historial` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `id_rol_anterior` int unsigned DEFAULT NULL,
  `id_rol_nuevo` int unsigned NOT NULL,
  `id_autorizador` int unsigned NOT NULL COMMENT 'Usuario que realizó el cambio',
  `fecha_cambio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `vigencia_desde` date NOT NULL,
  `vigencia_hasta` date DEFAULT NULL,
  PRIMARY KEY (`id_historial`),
  KEY `id_rol_anterior` (`id_rol_anterior`),
  KEY `id_rol_nuevo` (`id_rol_nuevo`),
  KEY `id_autorizador` (`id_autorizador`),
  KEY `idx_historial_rol_fecha` (`id_usuario`, `fecha_cambio`),
  CONSTRAINT `usuario_historial_rol_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `usuario_historial_rol_ibfk_2` FOREIGN KEY (`id_rol_anterior`) REFERENCES `roles` (`id_rol`),
  CONSTRAINT `usuario_historial_rol_ibfk_3` FOREIGN KEY (`id_rol_nuevo`) REFERENCES `roles` (`id_rol`),
  CONSTRAINT `usuario_historial_rol_ibfk_4` FOREIGN KEY (`id_autorizador`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Historial de cambios de rol';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: usuarios
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int unsigned NOT NULL AUTO_INCREMENT,
  `cedula_unica` varchar(12) NOT NULL COMMENT 'Cédula 9-12 dígitos numéricos',
  `nombre_completo` varchar(150) NOT NULL,
  `correo_electronico` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_ingreso` date NOT NULL COMMENT 'Fecha de ingreso a la institución',
  `id_rol_actual` int unsigned NOT NULL,
  `id_departamento` int unsigned NOT NULL,
  `id_tipo_nombramiento` int unsigned NOT NULL,
  `id_jefatura_inmediata` int unsigned DEFAULT NULL COMMENT 'Auto-referencia al jefe',
  `estado_usuario` enum('activo', 'inactivo', 'bloqueado') NOT NULL DEFAULT 'activo',
  `password_hash` varchar(255) NOT NULL COMMENT 'Hash de contraseña (bcrypt/SHA-256)',
  `salt` varchar(64) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultimo_acceso` timestamp NULL DEFAULT NULL,
  `id_nombramiento_actual` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uk_cedula` (`cedula_unica`),
  UNIQUE KEY `uk_correo` (`correo_electronico`),
  KEY `idx_estado_usuario` (`estado_usuario`),
  KEY `id_rol_actual` (`id_rol_actual`),
  KEY `id_departamento` (`id_departamento`),
  KEY `id_tipo_nombramiento` (`id_tipo_nombramiento`),
  KEY `id_jefatura_inmediata` (`id_jefatura_inmediata`),
  KEY `id_nombramiento_actual` (`id_nombramiento_actual`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol_actual`) REFERENCES `roles` (`id_rol`),
  CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`),
  CONSTRAINT `usuarios_ibfk_3` FOREIGN KEY (`id_tipo_nombramiento`) REFERENCES `tipo_nombramiento` (`id_tipo`),
  CONSTRAINT `usuarios_ibfk_4` FOREIGN KEY (`id_jefatura_inmediata`) REFERENCES `usuarios` (`id_usuario`) ON DELETE
  SET
  NULL,
  CONSTRAINT `usuarios_ibfk_5` FOREIGN KEY (`id_nombramiento_actual`) REFERENCES `nombramientos` (`id_nombramiento`) ON DELETE
  SET
  NULL
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Usuarios del sistema';

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: vacaciones_colectivas
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `vacaciones_colectivas` (
  `id_feriado` int unsigned NOT NULL AUTO_INCREMENT,
  `fecha_feriado` date NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `creado_por` int unsigned NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_feriado`),
  UNIQUE KEY `uk_fecha_feriado` (`fecha_feriado`),
  KEY `creado_por` (`creado_por`),
  KEY `idx_vacaciones_colectivas_fecha` (`fecha_feriado`, `activo`),
  CONSTRAINT `vacaciones_colectivas_ibfk_1` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Vacaciones colectivas / feriados';

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: bitacora_asistencia
# ------------------------------------------------------------

INSERT INTO
  `bitacora_asistencia` (
    `id_registro`,
    `id_usuario`,
    `fecha`,
    `estado_asistencia`,
    `fuente`,
    `fecha_registro`
  )
VALUES
  (
    1,
    2,
    '2026-04-12',
    'ausente',
    'sistema',
    '2026-04-12 18:08:41'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: bitacora_auditoria
# ------------------------------------------------------------

INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    1,
    2,
    '2026-04-12 16:12:30',
    'solicitudes_vacaciones',
    'UPDATE',
    '{\"estado\": \"pendiente\"}',
    '{\"estado\": \"rechazada\", \"aprobador\": 3}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    2,
    2,
    '2026-04-12 16:18:50',
    'solicitudes_vacaciones',
    'UPDATE',
    '{\"estado\": \"pendiente\"}',
    '{\"estado\": \"rechazada\", \"aprobador\": 3}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    3,
    2,
    '2026-04-12 18:10:07',
    'solicitudes_vacaciones',
    'UPDATE',
    '{\"estado\": \"pendiente\"}',
    '{\"estado\": \"aprobada_jefatura\", \"aprobador\": 3}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    4,
    2,
    '2026-04-13 00:45:27',
    'solicitudes_vacaciones',
    'UPDATE',
    '{\"estado\": \"pendiente\"}',
    '{\"estado\": \"aprobada_jefatura\", \"aprobador\": 3}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    5,
    2,
    '2026-04-13 00:51:27',
    'solicitudes_vacaciones',
    'UPDATE',
    '{\"estado\": \"aprobada_jefatura\"}',
    '{\"estado\": \"programada\", \"aprobador\": 4}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    6,
    6,
    '2026-04-13 01:40:54',
    'usuarios',
    'UPDATE',
    '{\"rol\": 1, \"depto\": 1, \"estado\": \"activo\", \"tipo_nomb\": 1}',
    '{\"rol\": 4, \"depto\": 1, \"estado\": \"activo\", \"tipo_nomb\": 1}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    7,
    5,
    '2026-04-13 01:40:54',
    'usuarios',
    'UPDATE',
    '{\"id_rol_actual\": 1}',
    '{\"id_rol_actual\": 4}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    8,
    3,
    '2026-04-13 02:34:23',
    'usuarios',
    'UPDATE_CONTACTO',
    NULL,
    '{\"email\": \"jefatura@cuc.ac.cr\", \"telefono\": \"8754-6897\"}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    9,
    4,
    '2026-04-13 03:08:27',
    'usuarios',
    'UPDATE_CONTACTO',
    NULL,
    '{\"email\": \"rrhh@cuc.ac.cr\", \"telefono\": \"8754-6899\"}',
    NULL
  );
INSERT INTO
  `bitacora_auditoria` (
    `id_auditoria`,
    `id_usuario`,
    `fecha_hora`,
    `tabla_afectada`,
    `operacion`,
    `valor_anterior`,
    `valor_nuevo`,
    `ip_origen`
  )
VALUES
  (
    10,
    5,
    '2026-04-13 12:11:37',
    'nombramientos',
    'INSERT',
    NULL,
    '{\"id_usuario\": \"9\", \"fecha_inicio\": \"2026-04-14\", \"id_departamento\": \"1\", \"id_tipo_nombramiento\": \"1\"}',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: departamentos
# ------------------------------------------------------------

INSERT INTO
  `departamentos` (
    `id_departamento`,
    `codigo_unico_4_digitos`,
    `nombre_unidad`,
    `categoria_vacacional`,
    `id_jefe_unidad`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    1,
    '0001',
    'Administración Central',
    'Asistente administrativo',
    11,
    1,
    '2026-04-09 20:32:19'
  );
INSERT INTO
  `departamentos` (
    `id_departamento`,
    `codigo_unico_4_digitos`,
    `nombre_unidad`,
    `categoria_vacacional`,
    `id_jefe_unidad`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    2,
    '7054',
    'Prueba departamento',
    'Administrador',
    NULL,
    1,
    '2026-04-12 16:58:52'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: nombramientos
# ------------------------------------------------------------

INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    1,
    1,
    1,
    1,
    '2026-04-09',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    2,
    2,
    1,
    1,
    '2020-01-15',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    3,
    3,
    1,
    1,
    '2026-04-12',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    4,
    4,
    1,
    1,
    '2026-04-12',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    5,
    5,
    1,
    1,
    '2026-04-12',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    6,
    6,
    1,
    1,
    '2026-04-12',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    7,
    7,
    2,
    1,
    '2026-04-13',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    8,
    8,
    1,
    1,
    '2026-04-13',
    '2026-04-13',
    0,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    9,
    9,
    1,
    1,
    '2026-04-13',
    '2026-04-14',
    0,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    10,
    10,
    2,
    1,
    '2026-04-13',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    11,
    11,
    2,
    1,
    '2026-04-13',
    NULL,
    1,
    '2026-04-13 12:08:12'
  );
INSERT INTO
  `nombramientos` (
    `id_nombramiento`,
    `id_usuario`,
    `id_tipo_nombramiento`,
    `id_departamento`,
    `fecha_inicio`,
    `fecha_fin`,
    `activo`,
    `fecha_creacion`
  )
VALUES
  (
    16,
    9,
    1,
    1,
    '2026-04-14',
    '2026-04-17',
    1,
    '2026-04-13 12:11:37'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: permisos
# ------------------------------------------------------------

INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    1,
    'acceso_gestion_organizacional',
    'Gestión Organizacional',
    'Acceso a roles, departamentos, nombramientos'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    2,
    'acceso_seguridad',
    'Seguridad',
    'Acceso a autenticación y gestión de sesiones'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    3,
    'acceso_gestor_vistas',
    'Gestor de Vistas',
    'Carga dinámica de vistas según rol'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    4,
    'acceso_gestion_solicitudes',
    'Gestión de Solicitudes',
    'Crear, validar, aprobar solicitudes'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    5,
    'acceso_registro_control',
    'Registro y Control',
    'Actualización de saldos, vacaciones colectivas, cálculo de saldo'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    6,
    'gestion_roles',
    'Gestión Organizacional',
    'Asignar y modificar roles'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    7,
    'gestion_usuarios',
    'Gestión Organizacional',
    'Crear, editar, bloquear usuarios'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    8,
    'gestion_departamentos',
    'Gestión Organizacional',
    'Crear y editar departamentos'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    9,
    'gestion_nombramientos',
    'Gestión Organizacional',
    'Gestionar nombramientos'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    10,
    'aprobar_solicitudes',
    'Gestión de Solicitudes',
    'Capacidad de aprobar/rechazar solicitudes'
  );
INSERT INTO
  `permisos` (
    `id_permiso`,
    `nombre_permiso`,
    `modulo`,
    `descripcion`
  )
VALUES
  (
    11,
    'configurar_vacaciones_colectivas',
    'Registro y Control',
    'Registrar días de vacaciones colectivas'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: rol_permiso
# ------------------------------------------------------------

INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (3, 1);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 1);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 2);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (1, 3);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (2, 3);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (3, 3);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 3);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (1, 4);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (2, 4);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 4);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (2, 5);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (3, 5);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 5);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 6);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (3, 7);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 7);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (3, 8);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 8);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (3, 9);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 9);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (2, 10);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 10);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (3, 11);
INSERT INTO
  `rol_permiso` (`id_rol`, `id_permiso`)
VALUES
  (4, 11);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: roles
# ------------------------------------------------------------

INSERT INTO
  `roles` (
    `id_rol`,
    `nombre_rol`,
    `descripcion`,
    `fecha_creacion`
  )
VALUES
  (
    1,
    'Funcionario',
    'Usuario estándar que puede solicitar vacaciones',
    '2026-04-09 20:32:19'
  );
INSERT INTO
  `roles` (
    `id_rol`,
    `nombre_rol`,
    `descripcion`,
    `fecha_creacion`
  )
VALUES
  (
    2,
    'Jefatura',
    'Puede aprobar/rechazar solicitudes de su equipo',
    '2026-04-09 20:32:19'
  );
INSERT INTO
  `roles` (
    `id_rol`,
    `nombre_rol`,
    `descripcion`,
    `fecha_creacion`
  )
VALUES
  (
    3,
    'Recursos Humanos',
    'Gestiona departamentos, nombramientos, vacaciones colectivas',
    '2026-04-09 20:32:19'
  );
INSERT INTO
  `roles` (
    `id_rol`,
    `nombre_rol`,
    `descripcion`,
    `fecha_creacion`
  )
VALUES
  (
    4,
    'Administrador',
    'Acceso total al sistema, excepto auto-modificación de rol',
    '2026-04-09 20:32:19'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: saldo_vacaciones
# ------------------------------------------------------------

INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (1, 2, 5.00, 5.00, '2026', '2026-04-12 17:09:35', NULL);
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (
    2,
    3,
    15.00,
    15.00,
    '2026',
    '2026-04-12 15:59:34',
    NULL
  );
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (
    3,
    4,
    15.00,
    15.00,
    '2026',
    '2026-04-12 15:59:34',
    NULL
  );
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (4, 5, 0.00, 0.00, '2026', '2026-04-12 17:07:04', NULL);
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (5, 6, 0.00, 0.00, '2026', '2026-04-12 17:05:32', NULL);
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (11, 7, 0.00, 0.00, '2026', '2026-04-13 04:08:27', NULL);
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (12, 8, 0.00, 0.00, '2026', '2026-04-13 04:16:57', NULL);
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (13, 9, 0.00, 0.00, '2026', '2026-04-13 04:29:56', NULL);
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (
    14,
    10,
    0.00,
    0.00,
    '2026',
    '2026-04-13 04:37:21',
    NULL
  );
INSERT INTO
  `saldo_vacaciones` (
    `id_saldo`,
    `id_usuario`,
    `saldo_actual`,
    `saldo_inicial_periodo`,
    `periodo_anio`,
    `ultima_actualizacion`,
    `id_solicitud_asociada`
  )
VALUES
  (
    15,
    11,
    0.00,
    0.00,
    '2026',
    '2026-04-13 04:41:06',
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: sesiones_activas
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: solicitudes_vacaciones
# ------------------------------------------------------------

INSERT INTO
  `solicitudes_vacaciones` (
    `id_solicitud`,
    `id_usuario`,
    `fecha_inicio`,
    `fecha_fin`,
    `dias_solicitados`,
    `observaciones`,
    `estado`,
    `id_aprobador`,
    `comentario_aprobador`,
    `fecha_solicitud`,
    `fecha_resolucion`
  )
VALUES
  (
    1,
    2,
    '2026-04-13',
    '2026-04-15',
    2.00,
    'Prueba',
    'rechazada',
    3,
    'Prueba rechazado',
    '2026-04-12 11:22:22',
    '2026-04-12 16:12:30'
  );
INSERT INTO
  `solicitudes_vacaciones` (
    `id_solicitud`,
    `id_usuario`,
    `fecha_inicio`,
    `fecha_fin`,
    `dias_solicitados`,
    `observaciones`,
    `estado`,
    `id_aprobador`,
    `comentario_aprobador`,
    `fecha_solicitud`,
    `fecha_resolucion`
  )
VALUES
  (
    2,
    2,
    '2026-04-19',
    '2026-04-20',
    1.00,
    'Prueba2',
    'rechazada',
    3,
    'Prueba Aprobado',
    '2026-04-12 16:09:18',
    '2026-04-12 16:18:50'
  );
INSERT INTO
  `solicitudes_vacaciones` (
    `id_solicitud`,
    `id_usuario`,
    `fecha_inicio`,
    `fecha_fin`,
    `dias_solicitados`,
    `observaciones`,
    `estado`,
    `id_aprobador`,
    `comentario_aprobador`,
    `fecha_solicitud`,
    `fecha_resolucion`
  )
VALUES
  (
    3,
    5,
    '2026-04-29',
    '2026-04-30',
    2.00,
    'Prueba solicitud adminstrador',
    'pendiente',
    NULL,
    NULL,
    '2026-04-12 16:52:20',
    NULL
  );
INSERT INTO
  `solicitudes_vacaciones` (
    `id_solicitud`,
    `id_usuario`,
    `fecha_inicio`,
    `fecha_fin`,
    `dias_solicitados`,
    `observaciones`,
    `estado`,
    `id_aprobador`,
    `comentario_aprobador`,
    `fecha_solicitud`,
    `fecha_resolucion`
  )
VALUES
  (
    4,
    2,
    '2026-04-21',
    '2026-04-23',
    3.00,
    'Prueba historia 3',
    'aprobada_jefatura',
    3,
    'Aprobar prueba historia 3',
    '2026-04-12 18:09:23',
    '2026-04-12 18:10:07'
  );
INSERT INTO
  `solicitudes_vacaciones` (
    `id_solicitud`,
    `id_usuario`,
    `fecha_inicio`,
    `fecha_fin`,
    `dias_solicitados`,
    `observaciones`,
    `estado`,
    `id_aprobador`,
    `comentario_aprobador`,
    `fecha_solicitud`,
    `fecha_resolucion`
  )
VALUES
  (
    5,
    2,
    '2026-04-27',
    '2026-04-28',
    1.00,
    'Preubas hu03',
    'programada',
    4,
    'Prueba aprobar desde RRHH',
    '2026-04-13 00:44:33',
    '2026-04-13 00:51:27'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: tipo_nombramiento
# ------------------------------------------------------------

INSERT INTO
  `tipo_nombramiento` (`id_tipo`, `nombre_tipo`, `descripcion`)
VALUES
  (1, 'propiedad', 'Funcionario en propiedad');
INSERT INTO
  `tipo_nombramiento` (`id_tipo`, `nombre_tipo`, `descripcion`)
VALUES
  (2, 'interino', 'Nombramiento interino');
INSERT INTO
  `tipo_nombramiento` (`id_tipo`, `nombre_tipo`, `descripcion`)
VALUES
  (3, 'suplente', 'Suplente temporal');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: unidades_a_cargo
# ------------------------------------------------------------

INSERT INTO
  `unidades_a_cargo` (
    `id_jefatura`,
    `id_departamento`,
    `fecha_asignacion`
  )
VALUES
  (3, 1, '2026-04-12 15:59:34');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: usuario_historial_rol
# ------------------------------------------------------------

INSERT INTO
  `usuario_historial_rol` (
    `id_historial`,
    `id_usuario`,
    `id_rol_anterior`,
    `id_rol_nuevo`,
    `id_autorizador`,
    `fecha_cambio`,
    `vigencia_desde`,
    `vigencia_hasta`
  )
VALUES
  (
    1,
    6,
    1,
    4,
    5,
    '2026-04-13 01:40:54',
    '2026-04-13',
    '2026-04-30'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: usuarios
# ------------------------------------------------------------

INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    1,
    '999999999',
    'Admin Sistema',
    'admin@sistema.com',
    NULL,
    '2026-04-09',
    4,
    1,
    1,
    NULL,
    'activo',
    'DUMMY_HASH_CAMBIAR_EN_PRODUCCION',
    NULL,
    '2026-04-09 20:32:20',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    2,
    '123456789',
    'Juan Pérez González',
    'juan.perez@cuc.ac.cr',
    NULL,
    '2020-01-15',
    1,
    1,
    1,
    NULL,
    'activo',
    '$2b$10$lwDh3l5ci/B1hYpPL79ZEufm4cmyQOy4tt/ShB7GyQSJsBHKwOdxS',
    NULL,
    '2026-04-12 10:29:36',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    3,
    '111111111',
    'Jefe Unidad Prueba',
    'jefatura@cuc.ac.cr',
    '8754-6897',
    '2026-04-12',
    2,
    1,
    1,
    NULL,
    'activo',
    '$2b$10$jfc6tl9hOfjqnMudG9gic.jtTacAgqNj5.VW.pNGe5NhKJ2Dlid1y',
    NULL,
    '2026-04-12 15:59:34',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    4,
    '222222222',
    'RRHH Usuario',
    'rrhh@cuc.ac.cr',
    '8754-6899',
    '2026-04-12',
    3,
    1,
    1,
    NULL,
    'activo',
    '$2b$10$vrcCluTAm9R4vnRMtVryEe8wRBKU27lZkE08PbjqQWQTjEkWaSiz6',
    NULL,
    '2026-04-12 15:59:34',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    5,
    '333333333',
    'Admin Principal',
    'admin@cuc.ac.cr',
    NULL,
    '2026-04-12',
    4,
    1,
    1,
    NULL,
    'activo',
    '$2b$10$dolM8t7xLRNJP.M2ghl72uvg1JEzXtTcLXTO.s1u5A/RSZrhAT5fS',
    NULL,
    '2026-04-12 15:59:34',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    6,
    '555555555',
    'Prueba Saldo',
    'prueba@cuc.ac.cr',
    NULL,
    '2026-04-12',
    4,
    1,
    1,
    NULL,
    'activo',
    '$2b$10$qCw3.ZnQW1CAuLcnBKrRG.mfP3CQnux867EVPsw1U1dPi0z8zToWS',
    NULL,
    '2026-04-12 17:05:32',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    7,
    '666666666',
    'Prueba correo Mailtrap',
    'prueba2@cuc.ac.cr',
    NULL,
    '2026-04-13',
    1,
    1,
    2,
    NULL,
    'activo',
    '$2b$10$EGvYVAG1zfEo0LvZCv332.mcIc.K4DmgGOIcj5094XOGI4BtEgjbK',
    NULL,
    '2026-04-13 04:08:27',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    8,
    '777777777',
    'sandboz correo',
    'xevacav679@mypethealh.com',
    NULL,
    '2026-04-13',
    1,
    1,
    1,
    NULL,
    'activo',
    '$2b$10$pnDNTbFF5F8ashtoaK7Qi.knQM1KE8D.8EjZjeKkWXmg2ghPWk5Mu',
    NULL,
    '2026-04-13 04:16:57',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    9,
    '888888888',
    'Hola Adios',
    'xevacav456@mypethealh.com',
    NULL,
    '2026-04-13',
    1,
    1,
    1,
    NULL,
    'activo',
    '$2b$10$XDTb9ZIhZyInh5Flr6X21OFwsiq9Nnxy0MIKbU950hhFjLfKw.f9K',
    NULL,
    '2026-04-13 04:29:56',
    NULL,
    16
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    10,
    '000000000',
    'Hola2 Adios2',
    'prueba3@cuc.ac.cr',
    NULL,
    '2026-04-13',
    3,
    1,
    2,
    NULL,
    'activo',
    '$2b$10$IfanxzihTxBLsorUmWrI4.e.zCgeJR4e4DODalnd1d.8YstVLdRw2',
    NULL,
    '2026-04-13 04:37:21',
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `id_usuario`,
    `cedula_unica`,
    `nombre_completo`,
    `correo_electronico`,
    `telefono`,
    `fecha_ingreso`,
    `id_rol_actual`,
    `id_departamento`,
    `id_tipo_nombramiento`,
    `id_jefatura_inmediata`,
    `estado_usuario`,
    `password_hash`,
    `salt`,
    `fecha_creacion`,
    `fecha_ultimo_acceso`,
    `id_nombramiento_actual`
  )
VALUES
  (
    11,
    '987654321',
    'Hola3 Adios3',
    'prueba4@cuc.ac.cr',
    NULL,
    '2026-04-13',
    2,
    1,
    2,
    NULL,
    'activo',
    '$2b$10$wOB5DTeSAUrvczBYMUt7kuIyQ.iGWgglhqQiYFLKIPezRq0eSDCvi',
    NULL,
    '2026-04-13 04:41:06',
    NULL,
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: vacaciones_colectivas
# ------------------------------------------------------------

INSERT INTO
  `vacaciones_colectivas` (
    `id_feriado`,
    `fecha_feriado`,
    `descripcion`,
    `creado_por`,
    `fecha_registro`,
    `activo`
  )
VALUES
  (
    1,
    '2026-04-24',
    'Viernes loco',
    4,
    '2026-04-13 02:06:14',
    1
  );

# ------------------------------------------------------------
# TRIGGER DUMP FOR: trg_sesiones_update_actividad
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_sesiones_update_actividad;
DELIMITER ;;
CREATE TRIGGER `trg_sesiones_update_actividad` BEFORE UPDATE ON `sesiones_activas` FOR EACH ROW BEGIN
    SET NEW.fecha_ultima_actividad = NOW();
END;;
DELIMITER ;

# ------------------------------------------------------------
# TRIGGER DUMP FOR: trg_calcular_dias_solicitados
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_calcular_dias_solicitados;
DELIMITER ;;
CREATE TRIGGER `trg_calcular_dias_solicitados` BEFORE INSERT ON `solicitudes_vacaciones` FOR EACH ROW BEGIN
    IF NEW.dias_solicitados IS NULL OR NEW.dias_solicitados = 0 THEN
        SET NEW.dias_solicitados = `dias_habiles_entre`(NEW.fecha_inicio, NEW.fecha_fin);
    END IF;
END;;
DELIMITER ;

# ------------------------------------------------------------
# TRIGGER DUMP FOR: trg_evitar_traslape_solicitudes
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_evitar_traslape_solicitudes;
DELIMITER ;;
CREATE TRIGGER `trg_evitar_traslape_solicitudes` BEFORE INSERT ON `solicitudes_vacaciones` FOR EACH ROW BEGIN
    IF EXISTS (
        SELECT 1 FROM `solicitudes_vacaciones`
        WHERE id_usuario = NEW.id_usuario
          AND estado IN ('aprobada', 'programada')
          AND NEW.fecha_inicio <= fecha_fin
          AND NEW.fecha_fin >= fecha_inicio
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya existe una solicitud aprobada o programada que traslapa con estas fechas.';
    END IF;
END;;
DELIMITER ;

# ------------------------------------------------------------
# TRIGGER DUMP FOR: trg_descontar_saldo_al_aprobar
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_descontar_saldo_al_aprobar;
DELIMITER ;;
CREATE TRIGGER `trg_descontar_saldo_al_aprobar` BEFORE UPDATE ON `solicitudes_vacaciones` FOR EACH ROW BEGIN
    IF NEW.estado = 'aprobada_rrhh' AND OLD.estado != 'aprobada_rrhh' THEN
        -- Validar saldo suficiente
        IF NOT validar_saldo_suficiente(NEW.id_usuario, NEW.dias_solicitados) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Saldo insuficiente para aprobar esta solicitud.';
        END IF;
        
        -- Descontar saldo
        CALL descontar_saldo(NEW.id_usuario, NEW.dias_solicitados, NEW.id_solicitud);
        
        -- Establecer fecha de resolución
        SET NEW.fecha_resolucion = NOW();
    END IF;
END;;
DELIMITER ;

# ------------------------------------------------------------
# TRIGGER DUMP FOR: trg_audit_solicitudes_update
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_audit_solicitudes_update;
DELIMITER ;;
CREATE TRIGGER `trg_audit_solicitudes_update` AFTER UPDATE ON `solicitudes_vacaciones` FOR EACH ROW BEGIN
    IF OLD.estado != NEW.estado THEN
        INSERT INTO `bitacora_auditoria` (id_usuario, tabla_afectada, operacion, valor_anterior, valor_nuevo)
        VALUES (NEW.id_usuario, 'solicitudes_vacaciones', 'UPDATE',
                JSON_OBJECT('estado', OLD.estado),
                JSON_OBJECT('estado', NEW.estado, 'aprobador', NEW.id_aprobador));
    END IF;
END;;
DELIMITER ;

# ------------------------------------------------------------
# TRIGGER DUMP FOR: trg_validar_jefatura_unidades
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_validar_jefatura_unidades;
DELIMITER ;;
CREATE TRIGGER `trg_validar_jefatura_unidades` AFTER UPDATE ON `usuarios` FOR EACH ROW BEGIN
    DECLARE v_rol_jefatura_id INT;
    SELECT id_rol INTO v_rol_jefatura_id FROM `roles` WHERE nombre_rol = 'Jefatura' LIMIT 1;
    
    IF NEW.id_rol_actual = v_rol_jefatura_id AND (OLD.id_rol_actual != v_rol_jefatura_id OR OLD.id_rol_actual IS NULL) THEN
        IF NOT EXISTS (SELECT 1 FROM `unidades_a_cargo` WHERE id_jefatura = NEW.id_usuario) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Un usuario con rol Jefatura debe tener al menos una unidad a cargo.';
        END IF;
    END IF;
END;;
DELIMITER ;

# ------------------------------------------------------------
# TRIGGER DUMP FOR: trg_audit_usuarios_update
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_audit_usuarios_update;
DELIMITER ;;
CREATE TRIGGER `trg_audit_usuarios_update` AFTER UPDATE ON `usuarios` FOR EACH ROW BEGIN
    IF (OLD.estado_usuario != NEW.estado_usuario) OR
       (OLD.id_rol_actual != NEW.id_rol_actual) OR
       (OLD.id_departamento != NEW.id_departamento) OR
       (OLD.id_tipo_nombramiento != NEW.id_tipo_nombramiento) THEN
       
       INSERT INTO `bitacora_auditoria` (id_usuario, tabla_afectada, operacion, valor_anterior, valor_nuevo)
       VALUES (NEW.id_usuario, 'usuarios', 'UPDATE',
               JSON_OBJECT('estado', OLD.estado_usuario, 'rol', OLD.id_rol_actual, 'depto', OLD.id_departamento, 'tipo_nomb', OLD.id_tipo_nombramiento),
               JSON_OBJECT('estado', NEW.estado_usuario, 'rol', NEW.id_rol_actual, 'depto', NEW.id_departamento, 'tipo_nomb', NEW.id_tipo_nombramiento));
    END IF;
END;;
DELIMITER ;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
