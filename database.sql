-- =============================================================================
-- CENTRO HOGAR - Esquema MySQL
-- Versión: 3.0
-- Normalización: 3FN (Tercera Forma Normal)
-- Motor: InnoDB (soporte transacciones y FK)
-- Charset: utf8mb4 (soporte completo Unicode)
-- =============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET time_zone = '-03:00'; -- Hora Argentina (UTC-3)

CREATE DATABASE IF NOT EXISTS centro_hogar
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE centro_hogar;

-- Desactivar verificación de FK durante el borrado y la creación
SET FOREIGN_KEY_CHECKS = 0;


-- =============================================================================
-- LIMPIEZA COMPLETA
-- Orden inverso a las dependencias FK: primero triggers, luego vistas,
-- luego tablas hijas, finalmente tablas padre y lookups.
-- =============================================================================

DROP TRIGGER IF EXISTS trg_ventas_numero_venta;

DROP VIEW IF EXISTS v_movimientos_stock;
DROP VIEW IF EXISTS v_productos;
DROP VIEW IF EXISTS v_ventas;

DROP TABLE IF EXISTS movimientos_stock;
DROP TABLE IF EXISTS venta_items;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS tipos_movimiento;
DROP TABLE IF EXISTS estados_venta;
DROP TABLE IF EXISTS tipos_tarjeta;
DROP TABLE IF EXISTS metodos_pago;
DROP TABLE IF EXISTS roles;


-- =============================================================================
-- TABLAS DE LOOKUP (eliminan dependencias transitivas de ENUMs → 3FN)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- roles: admin | encargado_stock | vendedor
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
  id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(30)      NOT NULL,
  descripcion VARCHAR(150)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Roles del sistema (admin, encargado_stock, vendedor)';

INSERT INTO roles (nombre, descripcion) VALUES
  ('admin',           'Acceso total al sistema'),
  ('encargado_stock', 'Gestión de productos, stock y reportes'),
  ('vendedor',        'Registro de ventas y consulta de catálogo');


-- -----------------------------------------------------------------------------
-- metodos_pago: efectivo | tarjeta | transferencia
-- -----------------------------------------------------------------------------
CREATE TABLE metodos_pago (
  id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(30)      NOT NULL,
  descripcion VARCHAR(150)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_metodos_pago_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Métodos de pago aceptados';

INSERT INTO metodos_pago (nombre, descripcion) VALUES
  ('efectivo',      'Pago en efectivo'),
  ('tarjeta',       'Tarjeta de crédito o débito'),
  ('transferencia', 'Transferencia bancaria / CBU');


-- -----------------------------------------------------------------------------
-- tipos_tarjeta: visa | mastercard | naranja | debito
-- -----------------------------------------------------------------------------
CREATE TABLE tipos_tarjeta (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(30)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tipos_tarjeta_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tipos de tarjeta de crédito/débito';

INSERT INTO tipos_tarjeta (nombre) VALUES
  ('Visa'),
  ('Mastercard'),
  ('Naranja'),
  ('Débito');


-- -----------------------------------------------------------------------------
-- estados_venta: completada | pendiente | cancelada
-- IDs fijos: 1=completada  2=pendiente  3=cancelada
-- (el backend los referencia por constante numérica — no cambiar el orden)
-- -----------------------------------------------------------------------------
CREATE TABLE estados_venta (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(20)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_estados_venta_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Estados posibles de una venta';

INSERT INTO estados_venta (nombre) VALUES
  ('completada'),   -- id = 1
  ('pendiente'),    -- id = 2
  ('cancelada');    -- id = 3


-- -----------------------------------------------------------------------------
-- tipos_movimiento: entrada | salida | ajuste
-- IDs fijos: 1=entrada  2=salida  3=ajuste
-- (el backend los referencia por constante numérica — no cambiar el orden)
-- -----------------------------------------------------------------------------
CREATE TABLE tipos_movimiento (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(20)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tipos_movimiento_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tipos de movimiento de stock';

INSERT INTO tipos_movimiento (nombre) VALUES
  ('entrada'),  -- id = 1
  ('salida'),   -- id = 2
  ('ajuste');   -- id = 3


-- =============================================================================
-- TABLAS PRINCIPALES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- categorias
-- -----------------------------------------------------------------------------
CREATE TABLE categorias (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(80)   NOT NULL,
  descripcion VARCHAR(255)  NULL,
  activo      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nombre (nombre),
  KEY idx_categorias_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Categorías de productos';


-- -----------------------------------------------------------------------------
-- usuarios
-- Credenciales propias (email + bcrypt hash), FK a roles.
-- uq_usuarios_email sirve de índice de búsqueda por email (login).
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(80)      NOT NULL,
  apellido       VARCHAR(80)      NOT NULL,
  email          VARCHAR(150)     NOT NULL,
  password_hash  VARCHAR(255)     NOT NULL  COMMENT 'bcrypt hash',
  rol_id         TINYINT UNSIGNED NOT NULL,
  activo         TINYINT(1)       NOT NULL DEFAULT 1,
  created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),          -- también sirve de índice de búsqueda
  KEY idx_usuarios_rol    (rol_id),
  KEY idx_usuarios_activo (activo),
  CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (rol_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema con credenciales propias';

-- El usuario admin inicial se crea automáticamente al arrancar el servidor
-- si no existe ningún admin en la base de datos (ver backend/src/services/auth.service.ts).
-- Configura las variables ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env


-- -----------------------------------------------------------------------------
-- clientes
-- FULLTEXT en (nombre, apellido) para búsqueda de texto libre futura.
-- Índice compuesto (activo, created_at) para listados paginados filtrados.
-- -----------------------------------------------------------------------------
CREATE TABLE clientes (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre     VARCHAR(100)  NOT NULL,
  apellido   VARCHAR(100)  NOT NULL,
  dni        VARCHAR(20)   NULL      COMMENT 'DNI u otro documento de identidad',
  telefono   VARCHAR(30)   NULL,
  email      VARCHAR(150)  NULL,
  direccion  VARCHAR(255)  NULL,
  activo     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clientes_dni            (dni),
  UNIQUE KEY uq_clientes_email          (email),
  KEY        idx_clientes_apellido_nombre (apellido, nombre),
  KEY        idx_clientes_activo          (activo),
  KEY        idx_clientes_activo_created  (activo, created_at DESC),
  FULLTEXT KEY ft_clientes_nombre         (nombre, apellido)
    COMMENT 'FULLTEXT para búsqueda de texto libre en nombre/apellido'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Clientes de la tienda';


-- -----------------------------------------------------------------------------
-- productos
-- DECIMAL para precios (nunca FLOAT con dinero).
-- FULLTEXT en (nombre, descripcion) para búsqueda de texto libre futura.
-- Índice (activo, stock_actual, stock_minimo) para getBajoStock().
-- -----------------------------------------------------------------------------
CREATE TABLE productos (
  id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  codigo         VARCHAR(50)      NOT NULL COMMENT 'Código SKU / interno',
  nombre         VARCHAR(150)     NOT NULL,
  descripcion    TEXT             NULL,
  precio_costo   DECIMAL(12, 2)   NOT NULL DEFAULT 0.00,
  precio_venta   DECIMAL(12, 2)   NOT NULL DEFAULT 0.00,
  stock_actual   INT              NOT NULL DEFAULT 0,
  stock_minimo   INT              NOT NULL DEFAULT 0,
  categoria_id   INT UNSIGNED     NULL,
  imagen_url     VARCHAR(500)     NULL,
  activo         TINYINT(1)       NOT NULL DEFAULT 1,
  created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_productos_codigo        (codigo),
  KEY        idx_productos_nombre        (nombre),
  KEY        idx_productos_categoria     (categoria_id),
  KEY        idx_productos_activo_stock  (activo, stock_actual),
  KEY        idx_productos_activo_nombre (activo, nombre),
  KEY        idx_productos_bajo_stock    (activo, stock_actual, stock_minimo)
    COMMENT 'Cubre WHERE activo=1 AND stock_actual <= stock_minimo',
  FULLTEXT KEY ft_productos_nombre       (nombre, descripcion)
    COMMENT 'FULLTEXT para búsqueda de texto libre en nombre/descripción',
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de productos';


-- -----------------------------------------------------------------------------
-- ventas
-- total_final como GENERATED STORED elimina dependencia transitiva (3FN).
-- Índice compuesto (estado_id, created_at) cubre todos los reportes y gráficos.
-- -----------------------------------------------------------------------------
CREATE TABLE ventas (
  id                  INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  numero_venta        INT UNSIGNED     NOT NULL COMMENT 'Número correlativo de venta',
  cliente_id          INT UNSIGNED     NULL,
  vendedor_id         INT UNSIGNED     NOT NULL,
  metodo_pago_id      TINYINT UNSIGNED NOT NULL,
  tipo_tarjeta_id     TINYINT UNSIGNED NULL,
  cuotas              TINYINT UNSIGNED NOT NULL DEFAULT 1,
  subtotal            DECIMAL(12, 2)   NOT NULL DEFAULT 0.00,
  descuento           DECIMAL(12, 2)   NOT NULL DEFAULT 0.00,
  interes_porcentaje  DECIMAL(5, 2)    NOT NULL DEFAULT 0.00,
  interes_monto       DECIMAL(12, 2)   NOT NULL DEFAULT 0.00,
  total_final         DECIMAL(12, 2)
    GENERATED ALWAYS AS (subtotal - descuento + interes_monto) STORED
    COMMENT 'Campo calculado: subtotal - descuento + interes_monto',
  estado_id           TINYINT UNSIGNED NOT NULL,
  notas               TEXT             NULL,
  created_at          DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ventas_numero            (numero_venta),
  KEY        idx_ventas_cliente           (cliente_id),
  KEY        idx_ventas_vendedor_fecha    (vendedor_id, created_at),
  KEY        idx_ventas_estado            (estado_id),
  KEY        idx_ventas_metodo_pago       (metodo_pago_id),
  KEY        idx_ventas_created_at        (created_at),
  KEY        idx_ventas_numero_fecha      (numero_venta, created_at DESC),
  KEY        idx_ventas_estado_fecha      (estado_id, created_at)
    COMMENT 'Cubre todas las queries de reportes: WHERE estado_id = ? AND created_at >= ?',
  CONSTRAINT fk_ventas_cliente
    FOREIGN KEY (cliente_id)      REFERENCES clientes      (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_vendedor
    FOREIGN KEY (vendedor_id)     REFERENCES usuarios      (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_metodo_pago
    FOREIGN KEY (metodo_pago_id)  REFERENCES metodos_pago  (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_tipo_tarjeta
    FOREIGN KEY (tipo_tarjeta_id) REFERENCES tipos_tarjeta (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_ventas_estado
    FOREIGN KEY (estado_id)       REFERENCES estados_venta (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cabecera de ventas';


-- Trigger: auto-incrementar numero_venta antes de insertar
DELIMITER $$
CREATE TRIGGER trg_ventas_numero_venta
BEFORE INSERT ON ventas
FOR EACH ROW
BEGIN
  IF NEW.numero_venta = 0 OR NEW.numero_venta IS NULL THEN
    SET NEW.numero_venta = (
      SELECT COALESCE(MAX(numero_venta), 0) + 1 FROM ventas
    );
  END IF;
END$$
DELIMITER ;


-- -----------------------------------------------------------------------------
-- venta_items
-- subtotal como GENERATED STORED elimina dependencia transitiva (3FN).
-- Índice compuesto (producto_id, venta_id) cubre top-ventas por producto.
-- -----------------------------------------------------------------------------
CREATE TABLE venta_items (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  venta_id         INT UNSIGNED   NOT NULL,
  producto_id      INT UNSIGNED   NOT NULL,
  cantidad         SMALLINT       NOT NULL DEFAULT 1,
  precio_unitario  DECIMAL(12, 2) NOT NULL,
  subtotal         DECIMAL(12, 2)
    GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
    COMMENT 'Campo calculado: cantidad * precio_unitario',
  created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vitems_venta            (venta_id),
  KEY idx_vitems_producto         (producto_id),
  KEY idx_vitems_producto_venta   (producto_id, venta_id),
  CONSTRAINT fk_vitems_venta
    FOREIGN KEY (venta_id)    REFERENCES ventas    (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vitems_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ítems (líneas) de cada venta';


-- -----------------------------------------------------------------------------
-- movimientos_stock
-- usuario_id es NULL para movimientos automáticos (ej.: cancelación sin sesión).
-- Índice compuesto (producto_id, created_at) para historial por producto.
-- -----------------------------------------------------------------------------
CREATE TABLE movimientos_stock (
  id                  INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  producto_id         INT UNSIGNED     NOT NULL,
  usuario_id          INT UNSIGNED     NULL      COMMENT 'NULL = movimiento automático del sistema',
  tipo_movimiento_id  TINYINT UNSIGNED NOT NULL,
  cantidad            INT              NOT NULL  COMMENT 'Positivo=entrada, negativo=salida',
  motivo              VARCHAR(255)     NULL,
  created_at          DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mov_producto_fecha (producto_id, created_at),
  KEY idx_mov_usuario        (usuario_id),
  KEY idx_mov_tipo           (tipo_movimiento_id),
  CONSTRAINT fk_mov_producto
    FOREIGN KEY (producto_id)        REFERENCES productos        (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_mov_usuario
    FOREIGN KEY (usuario_id)         REFERENCES usuarios         (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_mov_tipo
    FOREIGN KEY (tipo_movimiento_id) REFERENCES tipos_movimiento (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Historial de movimientos de stock';


-- =============================================================================
-- VISTAS ÚTILES (simplifican consultas ad-hoc y herramientas externas)
-- =============================================================================

-- Vista: ventas con todos los campos resueltos
CREATE OR REPLACE VIEW v_ventas AS
SELECT
  v.id,
  v.numero_venta,
  v.cliente_id,
  CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
  v.vendedor_id,
  CONCAT(u.nombre, ' ', u.apellido) AS vendedor_nombre,
  mp.nombre                          AS metodo_pago,
  tt.nombre                          AS tipo_tarjeta,
  v.cuotas,
  v.subtotal,
  v.descuento,
  v.interes_porcentaje,
  v.interes_monto,
  v.total_final,
  ev.nombre                          AS estado,
  v.notas,
  v.created_at
FROM ventas v
JOIN usuarios      u  ON u.id  = v.vendedor_id
JOIN metodos_pago  mp ON mp.id = v.metodo_pago_id
JOIN estados_venta ev ON ev.id = v.estado_id
LEFT JOIN clientes      c  ON c.id  = v.cliente_id
LEFT JOIN tipos_tarjeta tt ON tt.id = v.tipo_tarjeta_id;


-- Vista: productos con nombre de categoría
CREATE OR REPLACE VIEW v_productos AS
SELECT
  p.*,
  c.nombre AS categoria_nombre
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id;


-- Vista: movimientos de stock con nombres resueltos
CREATE OR REPLACE VIEW v_movimientos_stock AS
SELECT
  m.id,
  m.producto_id,
  pr.nombre                         AS producto_nombre,
  m.usuario_id,
  CONCAT(u.nombre, ' ', u.apellido) AS usuario_nombre,
  tm.nombre                         AS tipo_movimiento,
  m.cantidad,
  m.motivo,
  m.created_at
FROM movimientos_stock m
JOIN productos        pr ON pr.id = m.producto_id
LEFT JOIN usuarios     u  ON u.id  = m.usuario_id
JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id;


-- =============================================================================
-- RESTAURAR FK CHECK
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1;
