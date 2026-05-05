-- ============================================================================
-- CENTRO HOGAR — Datos de Prueba
-- seed.sql v1.0
-- ============================================================================
-- Prerrequisito: ejecutar database.sql primero.
--
-- Ejecución recomendada (evita timeouts de phpMyAdmin):
--   mysql -u root -p centro_hogar < seed.sql
--
-- Tiempo estimado: 5-15 min según hardware.
-- Registros:
--   22 usuarios · 150 clientes · 120 productos
--   120 movimientos stock inicial
--   ~64.000 ventas · ~134.000 venta_items · ~124.000 movimientos (total)
--
-- Contraseña de todos los usuarios: test123
-- ============================================================================

SET NAMES utf8mb4;
USE centro_hogar;

SET FOREIGN_KEY_CHECKS = 0;
SET unique_checks      = 0;

-- ============================================================================
-- 0. LIMPIEZA (orden inverso de dependencias)
-- ============================================================================
DELETE FROM movimientos_stock;
DELETE FROM venta_items;
DELETE FROM ventas;
DELETE FROM productos;
DELETE FROM categorias;
DELETE FROM clientes;
DELETE FROM usuarios;

ALTER TABLE movimientos_stock AUTO_INCREMENT = 1;
ALTER TABLE venta_items       AUTO_INCREMENT = 1;
ALTER TABLE ventas            AUTO_INCREMENT = 1;
ALTER TABLE productos         AUTO_INCREMENT = 1;
ALTER TABLE categorias        AUTO_INCREMENT = 1;
ALTER TABLE clientes          AUTO_INCREMENT = 1;
ALTER TABLE usuarios          AUTO_INCREMENT = 1;

-- ============================================================================
-- 1. CATEGORÍAS (15)
-- ============================================================================
START TRANSACTION;

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Sillones y Sofás',         'Sofás, sillones, poltronas y futones'),
  ('Dormitorios',               'Camas, placards, mesas de luz y cómodas'),
  ('Comedores y Living',        'Mesas, sillas de comedor, muebles de living y racks TV'),
  ('Cocina',                    'Muebles de cocina, alacenas, islas y accesorios'),
  ('Jardín y Exterior',         'Muebles de jardín, pérgolas, decks y sombrillas'),
  ('Iluminación',               'Lámparas, apliques, arañas y tiras LED'),
  ('Decoración',                'Cuadros, espejos, figuras y accesorios decorativos'),
  ('Textiles y Alfombras',      'Alfombras, cortinas, almohadones y mantas'),
  ('Electrodomésticos',         'Lavarropas, heladeras, aires acondicionados y más'),
  ('Baño',                      'Espejos, vanitorios, mamparas y accesorios de baño'),
  ('Organización',              'Repisas, bibliotecas, zapateros y sistemas de organización'),
  ('Infantil y Juvenil',        'Cunas, camas, escritorios y placards para niños y jóvenes'),
  ('Oficina y Estudio',         'Escritorios, sillas ergonómicas y muebles de oficina'),
  ('Herramientas y Ferretería', 'Taladros, amoladoras, sierras y herramientas de mano'),
  ('Colchones y Sommiers',      'Colchones, sommiers, almohadas y ropa de cama');

-- ============================================================================
-- 2. USUARIOS (22)  — contraseña: test123
-- ============================================================================
-- Hash bcrypt (10 rounds): $2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, activo) VALUES
  ('Marcelo',   'Barrientos',  'admin@centrohogar.com',             '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 1, 1),
  ('Elena',     'Correa',      'elena.correa@centrohogar.com',      '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 2, 1),
  ('Pablo',     'Figueroa',    'pablo.figueroa@centrohogar.com',    '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 2, 1),
  ('Natalia',   'Ibarra',      'natalia.ibarra@centrohogar.com',    '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 2, 1),
  ('Lucas',     'García',      'lucas.garcia@centrohogar.com',      '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Valeria',   'Rodríguez',   'valeria.rodriguez@centrohogar.com', '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Diego',     'Martínez',    'diego.martinez@centrohogar.com',    '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Florencia', 'López',       'florencia.lopez@centrohogar.com',   '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Nicolás',   'Pérez',       'nicolas.perez@centrohogar.com',     '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('María',     'González',    'maria.gonzalez@centrohogar.com',    '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Sebastián', 'Romero',      'sebastian.romero@centrohogar.com',  '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Daniela',   'Torres',      'daniela.torres@centrohogar.com',    '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Matías',    'Flores',      'matias.flores@centrohogar.com',     '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Laura',     'Díaz',        'laura.diaz@centrohogar.com',        '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Federico',  'Morales',     'federico.morales@centrohogar.com',  '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Carla',     'Herrera',     'carla.herrera@centrohogar.com',     '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Santiago',  'Medina',      'santiago.medina@centrohogar.com',   '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Verónica',  'Castro',      'veronica.castro@centrohogar.com',   '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Alejandro', 'Vargas',      'alejandro.vargas@centrohogar.com',  '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Patricia',  'Álvarez',     'patricia.alvarez@centrohogar.com',  '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Hernán',    'Molina',      'hernan.molina@centrohogar.com',     '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1),
  ('Silvina',   'Gutiérrez',   'silvina.gutierrez@centrohogar.com', '$2a$10$KydVHquecoydQQ7JFo8xFuD/2x2oBqp17qLi2v3FNJkQk2y4KbXke', 3, 1);

-- ============================================================================
-- 3. CLIENTES (150)
-- Distribución: ~70% DNI · ~55% teléfono · ~37% email · 5 inactivos
-- ============================================================================
INSERT INTO clientes (nombre, apellido, dni, telefono, email, direccion, activo) VALUES
-- ── Grupo A (1-56): DNI + teléfono + email + dirección ───────────────────────
('Juan',      'García',      '20456789', '11 1541-2301', 'juan.garcia@gmail.com',          'Av. Corrientes 1234, CABA',            1),
('María',     'López',       '27891234', '11 1562-4502', 'maria.lopez@hotmail.com',         'Sarmiento 456, Rosario',              1),
('Carlos',    'Martínez',    '25678901', '351 155-7803', 'carlos.martinez@gmail.com',       '9 de Julio 789, Córdoba',             1),
('Laura',     'González',    '30234567', '261 155-3204', 'laura.gonzalez@yahoo.com.ar',     'San Martín 321, Mendoza',             1),
('Roberto',   'Fernández',   '22345678', '11 1541-5505', 'roberto.fernandez@gmail.com',     'Rivadavia 567, La Plata',             1),
('Patricia',  'Sánchez',     '28901234', '11 1562-7806', 'patricia.sanchez@hotmail.com',    'Belgrano 890, Mar del Plata',         1),
('Miguel',    'Romero',      '26789012', '221 155-2107', 'miguel.romero@gmail.com',         'Mitre 123, Bahía Blanca',             1),
('Claudia',   'Torres',      '31234567', '11 1541-8208', 'claudia.torres@outlook.com',      'Tucumán 456, Santa Fe',               1),
('Fernando',  'Díaz',        '24567890', '11 1562-1609', 'fernando.diaz@gmail.com',         'Lavalle 789, CABA',                   1),
('Sandra',    'Flores',      '29012345', '381 155-4910', 'sandra.flores@hotmail.com',       'Independencia 321, S.M. de Tucumán',  1),
('Gustavo',   'Ruiz',        '23456789', '11 1541-3211', 'gustavo.ruiz@gmail.com',          'Florida 654, CABA',                   1),
('Verónica',  'Morales',     '32345678', '11 1562-6512', 'veronica.morales@yahoo.com.ar',   'Maipú 987, Rosario',                  1),
('Pablo',     'Herrera',     '21234567', '351 155-9813', 'pablo.herrera@gmail.com',         'Álvear 132, Córdoba',                 1),
('Marcela',   'Medina',      '35678901', '11 1541-2714', 'marcela.medina@gmail.com',        'Pellegrini 465, CABA',                1),
('Diego',     'Castro',      '33901234', '11 1562-5015', 'diego.castro@hotmail.com',        'Callao 798, CABA',                    1),
('Natalia',   'Álvarez',     '28456789', '264 155-8216', 'natalia.alvarez@gmail.com',       'Belgrano 231, San Juan',              1),
('Alejandro', 'Vargas',      '26012345', '11 1541-1617', 'alejandro.vargas@outlook.com',    'Libertad 564, Mar del Plata',         1),
('Silvina',   'Molina',      '31567890', '343 155-4418', 'silvina.molina@gmail.com',        'Colón 897, Paraná',                   1),
('Ernesto',   'Gutiérrez',   '24901234', '11 1562-7819', 'ernesto.gutierrez@hotmail.com',   'Serrano 130, CABA',                   1),
('Gabriela',  'Ortiz',       '29456789', '11 1541-3120', 'gabriela.ortiz@gmail.com',        'Thames 463, CABA',                    1),
('Horacio',   'Vega',        '22890123', '381 155-6521', 'horacio.vega@yahoo.com.ar',       '24 de Septiembre 796, Tucumán',       1),
('Adriana',   'Ríos',        '36234567', '11 1562-9822', 'adriana.rios@gmail.com',          'Scalabrini Ortiz 229, CABA',          1),
('Oscar',     'Navarro',     '25678012', '351 155-2623', 'oscar.navarro@gmail.com',         'Figueroa Alcorta 562, Córdoba',       1),
('Mónica',    'Moreno',      '30123456', '11 1541-5924', 'monica.moreno@hotmail.com',       'Gorriti 895, CABA',                   1),
('Ricardo',   'Aguilar',     '27567890', '261 155-9325', 'ricardo.aguilar@gmail.com',       'Arístides Villanueva 128, Mendoza',   1),
('Valeria',   'Mendoza',     '34012345', '11 1562-3626', 'valeria.mendoza@yahoo.com.ar',    'Jorge Newbery 461, CABA',             1),
('Andrés',    'Cruz',        '23456012', '11 1541-7927', 'andres.cruz@gmail.com',           'Lavalleja 794, CABA',                 1),
('Florencia', 'Blanco',      '28901678', '221 155-1328', 'florencia.blanco@outlook.com',    '1 y 60, La Plata',                    1),
('Martín',    'Gómez',       '26345234', '11 1562-4729', 'martin.gomez@gmail.com',          'Virrey del Pino 327, CABA',           1),
('Carolina',  'Ramos',       '32789890', '11 1541-8130', 'carolina.ramos@hotmail.com',      'Arenales 660, CABA',                  1),
('Néstor',    'Suárez',      '25234456', '387 155-2431', 'nestor.suarez@gmail.com',         'Caseros 993, Salta',                  1),
('Daniela',   'Pereyra',     '29678012', '11 1562-6832', 'daniela.pereyra@yahoo.com.ar',    'Guatemala 226, CABA',                 1),
('Eduardo',   'Acosta',      '24123678', '11 1541-1233', 'eduardo.acosta@gmail.com',        'El Salvador 559, CABA',               1),
('Luciana',   'Cabrera',     '33567234', '299 155-5634', 'luciana.cabrera@hotmail.com',     'Argentina 892, Neuquén',              1),
('Raúl',      'Sosa',        '27012890', '11 1562-9035', 'raul.sosa@gmail.com',             'Salguero 125, CABA',                  1),
('Romina',    'Reyes',       '31456456', '11 1541-3436', 'romina.reyes@outlook.com',        'Sinclair 458, CABA',                  1),
('Facundo',   'Benítez',     '26901012', '3522 15-5837', 'facundo.benitez@gmail.com',       'San Martín 791, Villa María',         1),
('Victoria',  'Paredes',     '30345678', '11 1562-7238', 'victoria.paredes@yahoo.com.ar',   'Billinghurst 224, CABA',              1),
('Gonzalo',   'Paz',         '23890234', '11 1541-1639', 'gonzalo.paz@gmail.com',           'Laprida 557, CABA',                   1),
('Celeste',   'Ibarra',      '28234890', '11 1562-4040', 'celeste.ibarra@hotmail.com',      'Uriarte 890, CABA',                   1),
('Leandro',   'Aguirre',     '32678456', '11 1541-8441', 'leandro.aguirre@gmail.com',       'Fitz Roy 223, CABA',                  1),
('Sofía',     'Villanueva',  '25123012', '351 155-2842', 'sofia.villanueva@outlook.com',    'Duarte Quirós 556, Córdoba',          1),
('Sebastián', 'Espinosa',    '29567678', '11 1562-6243', 'sebastian.espinosa@gmail.com',    'Garay 889, CABA',                     1),
('Mariela',   'Carrizo',     '34012234', '388 155-1044', 'mariela.carrizo@yahoo.com.ar',    'Independencia 222, Jujuy',            1),
('Damián',    'Figueroa',    '26456890', '11 1541-4445', 'damian.figueroa@gmail.com',       'Defensa 555, CABA',                   1),
('Lorena',    'Cáceres',     '30901456', '11 1562-7846', 'lorena.caceres@hotmail.com',      'Bolívar 888, CABA',                   1),
('Matías',    'Miranda',     '24345012', '11 1541-2247', 'matias.miranda@gmail.com',        'Piedras 221, CABA',                   1),
('Norma',     'Rojas',       '28789678', '370 155-6648', 'norma.rojas@yahoo.com.ar',        'Güemes 554, Resistencia',             1),
('Ezequiel',  'Correa',      '33234234', '11 1562-1049', 'ezequiel.correa@gmail.com',       'Tacuarí 887, CABA',                   1),
('Mabel',     'Maldonado',   '27678890', '11 1541-5050', 'mabel.maldonado@outlook.com',     'Alsina 220, CABA',                    1),
('Cristian',  'Salinas',     '32123456', '11 1562-8451', 'cristian.salinas@gmail.com',      'Venezuela 553, CABA',                 1),
('Noemí',     'Vidal',       '25567012', '261 155-2852', 'noemi.vidal@hotmail.com',         'Chile 886, Mendoza',                  1),
('Leonardo',  'Luna',        '29012678', '11 1541-6253', 'leonardo.luna@gmail.com',         'México 219, CABA',                    1),
('Fabiana',   'Campos',      '34456234', '11 1562-9654', 'fabiana.campos@yahoo.com.ar',     'Estados Unidos 552, CABA',            1),
('Esteban',   'Barrios',     '26901890', '11 1541-3055', 'esteban.barrios@gmail.com',       'Cochabamba 885, CABA',                1),
('Gladys',    'Núñez',       '31345456', '11 1562-7556', 'gladys.nunez@hotmail.com',        'San Juan 218, CABA',                  1),
-- ── Grupo B (57-69): DNI + teléfono + dirección ──────────────────────────────
('Tomás',     'Lara',        '24789012', '11 1541-2157', NULL, 'Tacuarí 551, CABA',          1),
('Hilda',     'Silva',       '28234678', '11 1562-5458', NULL, 'Moreno 884, CABA',           1),
('Ramiro',    'Ponce',       '33678234', '351 155-8759', NULL, 'Obispo Trejo 217, Córdoba',  1),
('Ana',       'Arrieta',     '27123890', '11 1541-3160', NULL, 'Entre Ríos 550, CABA',       1),
('Rubén',     'Ayala',       '31567456', '11 1562-6461', NULL, 'Matheu 883, CABA',           1),
('Cecilia',   'Barrientos',  '25012012', '381 155-9762', NULL, 'Laprida 216, Tucumán',       1),
('Germán',    'Bravo',       '29456678', '11 1541-4063', NULL, 'Saavedra 549, CABA',         1),
('Isabel',    'Bustos',      '34901234', '11 1562-7364', NULL, 'Larrea 882, CABA',           1),
('Claudio',   'Cano',        '26345890', '261 155-1765', NULL, 'Azcuénaga 215, Mendoza',     1),
('Diana',     'Coronel',     '30789456', '11 1541-5166', NULL, 'Acevedo 548, CABA',          1),
('Walter',    'Dávila',      '24234012', '11 1562-8467', NULL, 'Triunvirato 881, CABA',      1),
('Eva',       'Falcón',      '28678678', '299 155-2768', NULL, 'Olazábal 214, Neuquén',      1),
('Javier',    'Galván',      '33123234', '11 1541-2069', NULL, 'Mendoza 547, CABA',          1),
-- ── Grupo C (70-83): DNI + dirección ─────────────────────────────────────────
('Nora',      'Haro',        '38901234', NULL, NULL, 'Uriburu 880, CABA',             1),
('Alberto',   'Ledesma',     '32012456', NULL, NULL, 'Thames 213, CABA',              1),
('Yésica',    'Mamani',      '25456012', NULL, NULL, 'Godoy Cruz 546, CABA',          1),
('Hugo',      'Nieva',       '29901678', NULL, NULL, 'Gurruchaga 879, CABA',          1),
('Rosa',      'Oliva',       '34345234', NULL, NULL, 'Malabia 212, CABA',             1),
('César',     'Quiroga',     '26789890', NULL, NULL, 'Serrano 545, CABA',             1),
('Viviana',   'Rivas',       '31234456', NULL, NULL, 'Armenia 878, CABA',             1),
('Patricio',  'Sandoval',    '24678012', NULL, NULL, 'Honduras 211, CABA',            1),
('Soledad',   'Tapia',       '28123678', NULL, NULL, 'Costa Rica 544, CABA',          1),
('Inés',      'Vásquez',     '39012345', NULL, NULL, 'Nicaragua 877, CABA',           1),
('Alfredo',   'Zárate',      '38234567', NULL, NULL, 'El Salvador 210, CABA',         1),
('Liliana',   'Ferreira',    '39345678', NULL, NULL, 'Gorriti 543, CABA',             1),
('Osvaldo',   'Ocampo',      '25901012', NULL, NULL, 'Honduras 876, CABA',            1),
('Nora',      'Palavecino',  '29345678', NULL, NULL, 'Costa Rica 209, CABA',          1),
-- ── Grupo D (84-105): sólo DNI ───────────────────────────────────────────────
('Jorge',     'Segovia',     '34789234', NULL, NULL, NULL, 1),
('Susana',    'Zelaya',      '26234890', NULL, NULL, NULL, 1),
('Arnaldo',   'Argüello',    '30678456', NULL, NULL, NULL, 1),
('Irene',     'Domínguez',   '24123012', NULL, NULL, NULL, 1),
('Edmundo',   'Fuentes',     '28567678', NULL, NULL, NULL, 1),
('Dolores',   'Guerrero',    '33012234', NULL, NULL, NULL, 1),
('Aurelio',   'Ibáñez',      '27456890', NULL, NULL, NULL, 1),
('Graciela',  'Juárez',      '31901456', NULL, NULL, NULL, 1),
('Rodrigo',   'Krueger',     '25345012', NULL, NULL, NULL, 1),
('Carmen',    'Leguizamón',  '29789678', NULL, NULL, NULL, 1),
('Héctor',    'Mansilla',    '34234234', NULL, NULL, NULL, 1),
('Beatriz',   'Noriega',     '26678890', NULL, NULL, NULL, 1),
('Federico',  'Pedraza',     '31123456', NULL, NULL, NULL, 1),
('Alicia',    'Quintero',    '24567012', NULL, NULL, NULL, 1),
('Sergio',    'Roldán',      '28012678', NULL, NULL, NULL, 1),
('Teresa',    'Serrano',     '33456234', NULL, NULL, NULL, 1),
('Ignacio',   'Ureña',       '27901890', NULL, NULL, NULL, 1),
('Claudia',   'Viveros',     '38456789', NULL, NULL, NULL, 1),
('Norberto',  'Palacios',    '25790012', NULL, NULL, NULL, 1),
('Miriam',    'Quispe',      '29234678', NULL, NULL, NULL, 1),
('Claudio',   'Rivero',      '34678234', NULL, NULL, NULL, 1),
('Stella',    'Sotelo',      '26123890', NULL, NULL, NULL, 1),
-- ── Grupo E (106-118): sólo teléfono ─────────────────────────────────────────
('Darío',     'Rossi',       NULL, '11 1541-6170', NULL, NULL, 1),
('Melina',    'Salas',       NULL, '11 1562-9471', NULL, NULL, 1),
('Ariel',     'Toro',        NULL, '11 1541-3872', NULL, NULL, 1),
('Karina',    'Uribe',       NULL, '351 155-7173', NULL, NULL, 1),
('Mauro',     'Valencia',    NULL, '11 1562-1474', NULL, NULL, 1),
('Lidia',     'Villalba',    NULL, '11 1541-5875', NULL, NULL, 1),
('Gastón',    'Zamora',      NULL, '261 155-9276', NULL, NULL, 1),
('Pilar',     'Acuña',       NULL, '11 1562-3677', NULL, NULL, 1),
('Germán',    'Bernal',      NULL, '11 1541-8078', NULL, NULL, 1),
('Cintia',    'Cárdenas',    NULL, '299 155-2479', NULL, NULL, 1),
('Iván',      'Delgado',     NULL, '11 1562-6880', NULL, NULL, 1),
('Lucía',     'Espinoza',    NULL, '11 1541-1281', NULL, NULL, 1),
('Mariano',   'Franco',      NULL, '381 155-5682', NULL, NULL, 1),
-- ── Grupo F (119-145): sin datos opcionales ───────────────────────────────────
('Amanda',    'Galindo',     NULL, NULL, NULL, NULL, 1),
('Blas',      'Higuera',     NULL, NULL, NULL, NULL, 1),
('Celia',     'Infante',     NULL, NULL, NULL, NULL, 1),
('David',     'Jaime',       NULL, NULL, NULL, NULL, 1),
('Elisa',     'Kalnicky',    NULL, NULL, NULL, NULL, 1),
('Felipe',    'Leiva',       NULL, NULL, NULL, NULL, 1),
('Gloria',    'Medrano',     NULL, NULL, NULL, NULL, 1),
('Héctor',    'Naranjo',     NULL, NULL, NULL, NULL, 1),
('Iris',      'Ojeda',       NULL, NULL, NULL, NULL, 1),
('Joel',      'Palma',       NULL, NULL, NULL, NULL, 1),
('Keila',     'Quintana',    NULL, NULL, NULL, NULL, 1),
('Lorenzo',   'Ríos',        NULL, NULL, NULL, NULL, 1),
('Marta',     'Soriano',     NULL, NULL, NULL, NULL, 1),
('Nicolás',   'Trujillo',    NULL, NULL, NULL, NULL, 1),
('Olga',      'Ugarte',      NULL, NULL, NULL, NULL, 1),
('Pedro',     'Varela',      NULL, NULL, NULL, NULL, 1),
('Queila',    'Watson',      NULL, NULL, NULL, NULL, 1),
('Rita',      'Xaviér',      NULL, NULL, NULL, NULL, 1),
('Simón',     'Yépez',       NULL, NULL, NULL, NULL, 1),
('Tania',     'Zúñiga',      NULL, NULL, NULL, NULL, 1),
('Ulises',    'Aráoz',       NULL, NULL, NULL, NULL, 1),
('Valentina', 'Britos',      NULL, NULL, NULL, NULL, 1),
('Waldo',     'Coria',       NULL, NULL, NULL, NULL, 1),
('Ximena',    'Doria',       NULL, NULL, NULL, NULL, 1),
('Yolanda',   'Estrada',     NULL, NULL, NULL, NULL, 1),
('Zaida',     'Funes',       NULL, NULL, NULL, NULL, 1),
('Adolfo',    'Giménez',     NULL, NULL, NULL, NULL, 1),
-- ── Grupo G (146-150): inactivos ──────────────────────────────────────────────
('Bernardo',  'Hinojosa',    NULL, NULL, NULL, NULL, 0),
('Clara',     'Insúa',       NULL, NULL, NULL, NULL, 0),
('Donato',    'Jalil',       NULL, NULL, NULL, NULL, 0),
('Eugenia',   'Kessler',     NULL, NULL, NULL, NULL, 0),
('Florencio', 'Lema',        NULL, NULL, NULL, NULL, 0);

-- ============================================================================
-- 4. PRODUCTOS (120 = 15 categorías × 8)
-- Columnas: codigo, nombre, descripcion, precio_costo, precio_venta,
--           stock_actual, stock_minimo, categoria_id
-- ============================================================================
INSERT INTO productos (codigo, nombre, descripcion, precio_costo, precio_venta, stock_actual, stock_minimo, categoria_id) VALUES
-- ── Cat 1: Sillones y Sofás (44k – 895k) ─────────────────────────────────────
('SOF-001','Sillón Tapizado Básico',         'Sillón individual tela chenille, estructura de madera',                             28000.00,  44000.00, 0, 8,  1),
('SOF-002','Sillón Individual Oslo',         'Sillón nórdico patas madera, tapizado en tela gris',                                54000.00,  85000.00, 0, 6,  1),
('SOF-003','Sofá 2 Cuerpos Milán',           'Sofá dos plazas, espuma HR35, tela antimanchas',                                  124000.00, 195000.00, 0, 5,  1),
('SOF-004','Sofá 3 Cuerpos Roma',            'Sofá tres plazas con almohadones, tela bouclé gris',                              185000.00, 292000.00, 0, 4,  1),
('SOF-005','Poltrona Relax Bergen',          'Sillón reclinable manual, tapizado cuero ecológico negro',                        145000.00, 228000.00, 0, 4,  1),
('SOF-006','Sofá Esquinero L-Shape',         'Sofá esquinero modular 280x180cm, tapizado tela beige',                           345000.00, 545000.00, 0, 3,  1),
('SOF-007','Sillón Masajeador Pro',          'Sillón masajeador eléctrico 8 puntos, calor lumbar, mando',                       368000.00, 578000.00, 0, 2,  1),
('SOF-008','Sofá Chester Premium',           'Sofá Chester 3 plazas capitoné, cuero genuino, patas latón',                     568000.00, 895000.00, 0, 2,  1),
-- ── Cat 2: Dormitorios (72k – 695k) ──────────────────────────────────────────
('DOR-001','Mesa de Luz Flotante',           'Mesa de luz suspendida 2 cajones, MDF lacado blanco',                              45000.00,  72000.00, 0, 10, 2),
('DOR-002','Cama 1 Plaza Venecia',           'Cama 1 plaza 90x190cm, estructura madera, cabecera tapizada',                     95000.00, 150000.00, 0, 6,  2),
('DOR-003','Cabecera Tapizada Queen',        'Cabecera cama queen 160cm, tapizado tela gris perla, patas doradas',              115000.00, 182000.00, 0, 5,  2),
('DOR-004','Cómoda 5 Cajones',              'Cómoda 110cm, 5 cajones con rieles metálicos, MDF blanco',                        125000.00, 198000.00, 0, 5,  2),
('DOR-005','Cama 2 Plazas Madrid',           'Cama 2 plazas 140x190cm, cabecera acolchada, patas madera',                       175000.00, 278000.00, 0, 4,  2),
('DOR-006','Cama 2½ Plazas Premium',        'Cama 2 plazas y media 160x200cm, somier incluido, tela premium',                  255000.00, 403000.00, 0, 3,  2),
('DOR-007','Placard 2 Puertas Batientes',   'Placard 2 puertas 160cm, interior con cajones y estantes, MDF',                   198000.00, 315000.00, 0, 3,  2),
('DOR-008','Placard 3 Puertas Corredizas',  'Placard 3 puertas 270cm, espejo central, interior organizado',                    438000.00, 695000.00, 0, 2,  2),
-- ── Cat 3: Comedores y Living (135k – 338k) ───────────────────────────────────
('COM-001','Rack TV Flotante 180cm',         'Mueble TV suspendido 180cm, 3 cajones, MDF grafito',                               85000.00, 135000.00, 0, 6,  3),
('COM-002','Juego 4 Sillas Comedor',         'Set 4 sillas tapizadas tela gris, patas metal negro',                              95000.00, 150000.00, 0, 5,  3),
('COM-003','Mesa Living Ratán',              'Mesa ratán sintético ø80cm, tapa vidrio templado',                                135000.00, 215000.00, 0, 4,  3),
('COM-004','Mesa Comedor 4 Personas',        'Mesa comedor roble 120x80cm, estructura metal negro',                             155000.00, 245000.00, 0, 4,  3),
('COM-005','Mueble TV Living 200cm',         'Rack living 200cm, 2 puertas + estantes abiertos, color nogal',                   148000.00, 235000.00, 0, 4,  3),
('COM-006','Rack + Módulos Living Completo', 'Sistema living 250cm, rack central + 2 módulos laterales',                        165000.00, 262000.00, 0, 3,  3),
('COM-007','Mesa Comedor 6 Personas',        'Mesa comedor extensible 160-200cm, madera sólida roble',                          195000.00, 310000.00, 0, 3,  3),
('COM-008','Juego Comedor 6 + 6 Sillas',    'Mesa extensible + 6 sillas tapizadas, madera nogal',                              212000.00, 338000.00, 0, 2,  3),
-- ── Cat 4: Cocina (28k – 425k) ────────────────────────────────────────────────
('COC-001','Porta Condimentos Bambú',        'Porta especias giratorio 360°, bambú natural, 12 frascos',                         17000.00,  28000.00, 0, 15, 4),
('COC-002','Organizador Cajones Cocina',     'Set 3 organizadores expandibles acero inoxidable, para cajones',                   25000.00,  40000.00, 0, 12, 4),
('COC-003','Mesa Auxiliar Cocina',           'Mesa auxiliar rodante 60x40cm, 2 estantes, acero + madera',                       52000.00,  83000.00, 0, 8,  4),
('COC-004','Mueble Bajo Mesada 60cm',        'Módulo bajo mesada con puerta abatible, MDF blanco alto brillo',                   95000.00, 152000.00, 0, 5,  4),
('COC-005','Alacena 2 Puertas',             'Alacena mural 60cm, 2 puertas vidriadas, MDF blanco',                             118000.00, 188000.00, 0, 5,  4),
('COC-006','Despensero 5 Estantes',          'Despensero tall 40x180cm, 5 estantes regulables, blanco',                         135000.00, 215000.00, 0, 4,  4),
('COC-007','Mueble Cocina Integral 180cm',  'Módulo integral 180cm bajo + alacena, MDF blanco UV',                             198000.00, 318000.00, 0, 3,  4),
('COC-008','Isla de Cocina con Cajones',     'Isla cocina 120x60cm, 4 cajones, tapa enchape roble, ruedas',                     265000.00, 425000.00, 0, 2,  4),
-- ── Cat 5: Jardín y Exterior (55k – 318k) ────────────────────────────────────
('JAR-001','Silla Jardín Apilable',          'Silla plástico reforzado UV, apilable, varios colores',                            34000.00,  55000.00, 0, 12, 5),
('JAR-002','Sombrilla Reforzada 2.5m',       'Sombrilla 2.5m aluminio, tela olefin anti-UV, base incluida',                      55000.00,  88000.00, 0, 8,  5),
('JAR-003','Mesa Jardín Redonda',            'Mesa redonda ø80cm polipropileno texturado, resistente al sol',                    58000.00,  92000.00, 0, 8,  5),
('JAR-004','Reposera Reclinable',            'Reposera aluminio 5 posiciones, tela textilene gris',                              78000.00, 125000.00, 0, 6,  5),
('JAR-005','Juego Jardín 4 Sillas + Mesa',  'Set 5 piezas polirratán, cojines incluidos',                                       125000.00, 198000.00, 0, 4,  5),
('JAR-006','Living Exterior 3 Piezas',       'Sofá 2 plazas + 2 sillones wicker sintético, cojines impermeables',               155000.00, 248000.00, 0, 3,  5),
('JAR-007','Pérgola Aluminio 3x3m',          'Pérgola aluminio 3x3m, techo corredizo, fácil montaje',                            185000.00, 295000.00, 0, 2,  5),
('JAR-008','Deck Modular Madera Composite',  'Deck composite 10 placas 30x30cm, antideslizante, sin mantenimiento',             198000.00, 318000.00, 0, 3,  5),
-- ── Cat 6: Iluminación (18k – 95k) ───────────────────────────────────────────
('ILU-001','Lámpara de Mesa Básica',         'Lámpara mesa E27 pantalla lino, base cerámica blanca',                             11000.00,  18000.00, 0, 15, 6),
('ILU-002','Tira LED 5m',                   'Tira LED RGB+W 5m autoadhesiva, control por app, IP65',                            15000.00,  24000.00, 0, 15, 6),
('ILU-003','Aplique de Pared LED',           'Aplique pared LED 12W, luz cálida, aluminio negro, IP44',                          18000.00,  29000.00, 0, 12, 6),
('ILU-004','Lámpara de Pie Arc',            'Lámpara de pie arco 180cm, pantalla lino beige, regulable',                        25000.00,  40000.00, 0, 8,  6),
('ILU-005','Lámpara Colgante Nórdica',      'Colgante E27 rattan natural ø40cm, cable trenzado',                                28000.00,  45000.00, 0, 8,  6),
('ILU-006','Araña 5 Luces',                 'Araña 5 brazos metal negro E14, estilo industrial',                                35000.00,  56000.00, 0, 6,  6),
('ILU-007','Ventilador de Techo con Luz',   'Ventilador techo 3 aspas 52", LED integrado 24W, control remoto',                  42000.00,  67000.00, 0, 5,  6),
('ILU-008','Lámpara Diseño Premium',        'Lámpara colgante diseño globo cristal ahumado ø30cm',                              59000.00,  95000.00, 0, 4,  6),
-- ── Cat 7: Decoración (14.5k – 95k) ──────────────────────────────────────────
('DEC-001','Cuadro Decorativo 50x70',        'Cuadro canvas impresión artística, bastidor madera, 50x70cm',                       9000.00,  14500.00, 0, 15, 7),
('DEC-002','Set Velas Aromáticas x3',        'Set 3 velas soja lavanda/vainilla/madera, en caja regalo',                         11000.00,  18000.00, 0, 20, 7),
('DEC-003','Marco Fotos Madera 20x30',       'Marco fotos 20x30cm, madera pino natural, vidrio antirreflejo',                    10000.00,  16000.00, 0, 20, 7),
('DEC-004','Maceta Cerámica Grande',         'Maceta cerámica esmaltada ø30cm, drenaje incluido, color terracota',               18000.00,  29000.00, 0, 10, 7),
('DEC-005','Reloj de Pared Diseño',          'Reloj pared ø60cm, metal negro calado, silent sweep',                              25000.00,  40000.00, 0, 8,  7),
('DEC-006','Figura Decorativa Resina',       'Figura resina abstracta, acabado marmolizado, 30cm altura',                        22000.00,  35000.00, 0, 10, 7),
('DEC-007','Espejo Redondo Decorativo 60cm','Espejo ø60cm con marco metal dorado, para pared',                                   28000.00,  45000.00, 0, 8,  7),
('DEC-008','Espejo Cuerpo Entero',           'Espejo cuerpo entero 50x180cm, marco metal negro, pie incluido',                   59000.00,  95000.00, 0, 5,  7),
-- ── Cat 8: Textiles y Alfombras (18k – 185k) ─────────────────────────────────
('TEX-001','Almohadón Decorativo 45x45',    'Almohadón velvet 45x45cm, relleno pluma sintética, varios colores',                 11000.00,  18000.00, 0, 20, 8),
('TEX-002','Manta Polar Queen',              'Manta polar fleece 220x240cm, suave, lavable a máquina',                            14000.00,  23000.00, 0, 15, 8),
('TEX-003','Cortinas Blackout 2 Paños',     'Cortinas blackout 140x220cm cada paño, varilla no incluida',                        25000.00,  40000.00, 0, 12, 8),
('TEX-004','Alfombra 1.5x2m Liso',          'Alfombra liso suave 150x200cm, pelo corto 12mm, antideslizante',                    38000.00,  60000.00, 0, 8,  8),
('TEX-005','Alfombra 2x3m Diseño',          'Alfombra geométrica 200x300cm, pelo corto, lavable',                                65000.00, 105000.00, 0, 5,  8),
('TEX-006','Cortinas Lino Premium',         'Cortinas lino 100% 140x260cm, efecto natural, semitransparente',                    55000.00,  88000.00, 0, 6,  8),
('TEX-007','Alfombra Shaggy 2x3m',          'Alfombra shaggy 200x300cm, pelo largo 50mm, ultra suave',                           78000.00, 125000.00, 0, 4,  8),
('TEX-008','Alfombra Persa 2.5x3.5m',       'Alfombra persa tradicional 250x350cm, lana+algodón, hecha a mano',                 115000.00, 185000.00, 0, 2,  8),
-- ── Cat 9: Electrodomésticos (44k – 985k) ────────────────────────────────────
('ELK-001','Aspiradora de Mano',             'Aspiradora portátil 18V inalámbrica, HEPA, 2 cabezales',                            27500.00,  44000.00, 0, 8,  9),
('ELK-002','Licuadora 800W',                'Licuadora 800W vaso vidrio 1.5L, 3 velocidades + pulso',                            37000.00,  60000.00, 0, 8,  9),
('ELK-003','Microondas 20L',                'Microondas 20 litros, 700W, 6 programas, display digital',                          58000.00,  92000.00, 0, 6,  9),
('ELK-004','Aspiradora Robot',              'Robot aspiradora y trapeador, app WiFi, mapeo láser',                              175000.00, 278000.00, 0, 4,  9),
('ELK-005','Lavarropas 7kg',                'Lavarropas carga frontal 7kg, 1200rpm, clase A, inverter',                          225000.00, 358000.00, 0, 3,  9),
('ELK-006','Heladera No Frost 370L',        'Heladera dos puertas 370L, no frost total, dispensador agua',                      345000.00, 548000.00, 0, 2,  9),
('ELK-007','Aire Acondicionado Split 3000fg','Split frío/calor 3000fg, inverter A++, WiFi, instalación no incluida',             425000.00, 678000.00, 0, 2,  9),
('ELK-008','Smart TV 65" 4K',              'Smart TV 65 pulgadas 4K OLED, HDR10+, Google TV, HDMI 2.1',                        618000.00, 985000.00, 0, 2,  9),
-- ── Cat 10: Baño (18k – 285k) ─────────────────────────────────────────────────
('BAN-001','Espejo Baño 60x80cm',           'Espejo baño 60x80cm, marco aluminio, bordes biselados',                             11000.00,  18000.00, 0, 10, 10),
('BAN-002','Set Accesorios Baño Cromado',   'Set 5 piezas cromo: jabonera, portarrollo, toallero, percha x2',                    18000.00,  29000.00, 0, 10, 10),
('BAN-003','Porta Toallas Flotante',        'Toallero flotante 60cm, acero inox cromado, instalación adhesiva',                  22000.00,  35000.00, 0, 12, 10),
('BAN-004','Mueble Bajo Mesada Baño 60cm',  'Mueble bajo mesada 60cm, 2 puertas, MDF lacado blanco',                             48000.00,  78000.00, 0, 6,  10),
('BAN-005','Vanitory Doble Pileta 120cm',   'Vanitory 120cm, 2 bacha oval, MDF, sin griferías',                                  98000.00, 158000.00, 0, 4,  10),
('BAN-006','Mampara de Ducha 80x190cm',     'Mampara ducha 80x190cm, vidrio templado 8mm, perfil aluminio',                     135000.00, 215000.00, 0, 3,  10),
('BAN-007','Bañera Hidromasaje',            'Bañera acrílica 150x70cm, sistema jets hidromasaje, blanca',                       115000.00, 185000.00, 0, 2,  10),
('BAN-008','Jacuzzi Empotrado',             'Jacuzzi empotrado 180x80cm, 10 jets, cromoterapia LED',                             178000.00, 285000.00, 0, 2,  10),
-- ── Cat 11: Organización (28k – 195k) ────────────────────────────────────────
('ORG-001','Organizador Zapatero 10 Pares', 'Zapatero apilable 10 pares, plástico transparente, apilable',                       17000.00,  28000.00, 0, 15, 11),
('ORG-002','Caja Organizadora Apilable',    'Set 3 cajas con tapa 40x30x20cm, PP, apilables, etiquetas',                         18000.00,  29000.00, 0, 15, 11),
('ORG-003','Repisa Flotante 80cm',          'Repisa madera maciza 80x22cm, soporte oculto, tono roble',                          22000.00,  35000.00, 0, 12, 11),
('ORG-004','Sistema de Repisas Modular',    'Kit 3 repisas 60cm + soportes, MDF blanco, montaje fácil',                          45000.00,  72000.00, 0, 8,  11),
('ORG-005','Estantería Metálica 5 Niveles', 'Estante acero 90x40x180cm, 5 bandejas, 150kg por nivel',                            58000.00,  92000.00, 0, 6,  11),
('ORG-006','Mueble Zapatero 30 Pares',      'Zapatero tall 30 pares, 5 compartimentos, MDF blanco',                              82000.00, 130000.00, 0, 5,  11),
('ORG-007','Biblioteca 6 Estantes 90cm',   'Biblioteca 90x30x200cm, 6 estantes, MDF roble, patas regulables',                   95000.00, 152000.00, 0, 4,  11),
('ORG-008','Sistema Pared Organización',    'Panel perforado 120x60cm + 20 accesorios, acero negro',                             122000.00, 195000.00, 0, 3,  11),
-- ── Cat 12: Infantil y Juvenil (38k – 420k) ──────────────────────────────────
('INF-001','Silla Escritorio Juvenil',      'Silla escritorio juvenil regulable, tapizado gamer, ruedas',                        24000.00,  38000.00, 0, 8,  12),
('INF-002','Cuna Portátil Plegable',        'Cuna portátil aluminio 120x60cm, colchoneta incluida, plegable',                    52000.00,  83000.00, 0, 6,  12),
('INF-003','Cuna Colecho',                  'Cuna colecho 3 en 1, madera pino, 60x120cm, con ruedas',                            85000.00, 135000.00, 0, 5,  12),
('INF-004','Escritorio Juvenil 100x60',     'Escritorio juvenil 100x60cm, MDF color, estante flotante',                         115000.00, 185000.00, 0, 5,  12),
('INF-005','Cama Cucheta',                  'Cama cucheta madera sólida 90x190cm, escalera lateral, barandas',                   145000.00, 228000.00, 0, 4,  12),
('INF-006','Placard Infantil Decorado',     'Placard 2 puertas 120cm, con vinilos temáticos, interior cajones',                  175000.00, 278000.00, 0, 3,  12),
('INF-007','Cama Sofá Juvenil',             'Cama sofá 90x200cm, respaldos removibles, tapizado tela azul',                      195000.00, 308000.00, 0, 3,  12),
('INF-008','Habitación Infantil Completa',  'Set cama + escritorio + placard + estante, MDF laminado color',                     265000.00, 420000.00, 0, 2,  12),
-- ── Cat 13: Oficina y Estudio (44.5k – 318k) ─────────────────────────────────
('OFI-001','Silla de Oficina Básica',       'Silla giratoria regulable, respaldo malla, sin apoyabrazos',                        28000.00,  44500.00, 0, 8,  13),
('OFI-002','Escritorio 120x60cm',           'Escritorio 120x60cm, MDF, cable manager trasero, color nogal',                      55000.00,  88000.00, 0, 6,  13),
('OFI-003','Silla Ergonómica Mesh',         'Silla ergonómica malla 3D, lumbar ajustable, apoyabrazos 3D',                       88000.00, 140000.00, 0, 5,  13),
('OFI-004','Mueble Archivador 4 Cajones',   'Archivador 4 cajones A4, llave, ruedas, MDF gris',                                  95000.00, 152000.00, 0, 4,  13),
('OFI-005','Escritorio en L 160x120cm',     'Escritorio en L 160x120cm, MDF, 2 cajones laterales, blanco',                      125000.00, 198000.00, 0, 4,  13),
('OFI-006','Silla Ergonómica Premium',      'Silla ejecutiva cuero ecológico, headrest, lumbar motorizado',                      145000.00, 230000.00, 0, 3,  13),
('OFI-007','Escritorio Ejecutivo 180cm',    'Escritorio ejecutivo 180x80cm, 3 cajones, madera sólida roble',                    178000.00, 285000.00, 0, 3,  13),
('OFI-008','Home Office Completo',          'Escritorio en L + silla ergonómica + archivador, set coordinado',                   198000.00, 318000.00, 0, 2,  13),
-- ── Cat 14: Herramientas y Ferretería (12k – 84k) ────────────────────────────
('HER-001','Llave Ajustable 12"',           'Llave ajustable 12 pulgadas, acero cromo-vanadio, antideslizante',                   7500.00,  12000.00, 0, 20, 14),
('HER-002','Set Destornilladores 10pz',     'Set 10 destornilladores magnéticos, mango ergonómico bicolor',                       9500.00,  15000.00, 0, 15, 14),
('HER-003','Juego Llaves Allen 9pz',        'Juego llaves Allen 9 piezas 1.5-10mm, acero S2, estuche',                           12000.00,  19000.00, 0, 15, 14),
('HER-004','Nivel Láser',                   'Nivel láser autonivelante 2 líneas, alcance 20m, trípode',                           22000.00,  35000.00, 0, 10, 14),
('HER-005','Sierra Circular 1200W',         'Sierra circular 1200W, hoja 185mm, guía paralela, base aluminio',                   35000.00,  56000.00, 0, 5,  14),
('HER-006','Taladro Inalámbrico 18V',       'Taladro atornillador 18V Li-Ion, 2 baterías, cargador, maletín',                    38000.00,  60000.00, 0, 6,  14),
('HER-007','Amoladora Angular 750W',        'Amoladora 750W 115mm, 11.000rpm, protección antibloqueo',                            45000.00,  72000.00, 0, 5,  14),
('HER-008','Combo Taladro + Amoladora',     'Pack taladro 18V + amoladora 750W, 3 baterías, maletín doble',                      52500.00,  84000.00, 0, 3,  14),
-- ── Cat 15: Colchones y Sommiers (38k – 485k) ────────────────────────────────
('COL-001','Almohada Viscoelástica',         'Almohada viscoelástica 70x50cm, cubierta bambú, firmeza media',                     24000.00,  38000.00, 0, 15, 15),
('COL-002','Colchón 1 Plaza Espuma',         'Colchón 1 plaza 90x190x22cm, espuma HR40, funda lavable',                           78000.00, 125000.00, 0, 8,  15),
('COL-003','Colchón 2 Plazas Resortes',      'Colchón 2 plazas 140x190x26cm, resortes bicónicos 320, pillow top',               115000.00, 185000.00, 0, 5,  15),
('COL-004','Sommier Base 2 Plazas',          'Base sommier 2 plazas 140x190cm, tela gris, patas madera',                          95000.00, 152000.00, 0, 5,  15),
('COL-005','Colchón 2½ Plazas Premium',     'Colchón 2 y media 160x200x28cm, resortes ensacados, memory foam',                  148000.00, 235000.00, 0, 4,  15),
('COL-006','Colchón Queen Pillow Top',       'Colchón queen 160x200x32cm, pillow top desmontable, hipoalergénico',               178000.00, 285000.00, 0, 3,  15),
('COL-007','Conjunto Sommier + Colchón 2P', 'Set sommier + colchón resortes 140x190cm, tela gris antracita',                    195000.00, 312000.00, 0, 3,  15),
('COL-008','Colchón Viscoelástico King',     'Colchón king size 200x200x34cm, viscoelástico 5cm, gel frío',                      305000.00, 485000.00, 0, 2,  15);

-- ============================================================================
-- 5. MOVIMIENTOS DE STOCK INICIALES
-- ============================================================================
INSERT INTO movimientos_stock (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo, created_at)
  SELECT id, 1, 1, 9999, 'Stock inicial', '2024-04-01 08:00:00' FROM productos;

UPDATE productos SET stock_actual = 9999;

COMMIT;

-- ============================================================================
-- 6. STORED PROCEDURE — genera 64.000 ventas con distribución estacional
-- ============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_generar_ventas$$

CREATE PROCEDURE sp_generar_ventas()
BEGIN
  -- ── Declaraciones (TODAS deben ir primero) ───────────────────────────────
  DECLARE v_i               INT              DEFAULT 0;
  DECLARE v_year            SMALLINT         DEFAULT 2024;
  DECLARE v_month           TINYINT          DEFAULT 1;
  DECLARE v_day             TINYINT          DEFAULT 1;
  DECLARE v_max_day         TINYINT          DEFAULT 31;
  DECLARE v_hora            TINYINT          DEFAULT 9;
  DECLARE v_fecha           DATETIME;
  DECLARE v_r               DOUBLE           DEFAULT 0;
  DECLARE v_rmonth          INT              DEFAULT 0;
  DECLARE v_rcuotas         DOUBLE           DEFAULT 0;
  DECLARE v_rdesc           DOUBLE           DEFAULT 0;
  DECLARE v_n_vids          INT              DEFAULT 0;
  DECLARE v_n_cids          INT              DEFAULT 0;
  DECLARE v_n_pids          INT              DEFAULT 0;
  DECLARE v_pick_idx        INT UNSIGNED     DEFAULT 1;
  DECLARE v_vendedor_id     INT UNSIGNED     DEFAULT 0;
  DECLARE v_cliente_id      INT UNSIGNED     DEFAULT NULL;
  DECLARE v_metodo_pago_id  TINYINT UNSIGNED DEFAULT 1;
  DECLARE v_tipo_tarjeta_id TINYINT UNSIGNED DEFAULT NULL;
  DECLARE v_cuotas          TINYINT UNSIGNED DEFAULT 1;
  DECLARE v_estado_id       TINYINT UNSIGNED DEFAULT 1;
  DECLARE v_n_items         TINYINT          DEFAULT 1;
  DECLARE v_venta_id        INT UNSIGNED     DEFAULT 0;
  DECLARE v_subtotal        DECIMAL(12,2)    DEFAULT 0.00;
  DECLARE v_descuento       DECIMAL(12,2)    DEFAULT 0.00;
  DECLARE v_interes_pct     DECIMAL(5,2)     DEFAULT 0.00;
  DECLARE v_interes_monto   DECIMAL(12,2)    DEFAULT 0.00;
  DECLARE v_pid1            INT UNSIGNED     DEFAULT 0;
  DECLARE v_pid2            INT UNSIGNED     DEFAULT 0;
  DECLARE v_pid3            INT UNSIGNED     DEFAULT 0;
  DECLARE v_pid4            INT UNSIGNED     DEFAULT 0;
  DECLARE v_pid5            INT UNSIGNED     DEFAULT 0;
  DECLARE v_qty1            TINYINT UNSIGNED DEFAULT 1;
  DECLARE v_qty2            TINYINT UNSIGNED DEFAULT 1;
  DECLARE v_qty3            TINYINT UNSIGNED DEFAULT 1;
  DECLARE v_qty4            TINYINT UNSIGNED DEFAULT 1;
  DECLARE v_qty5            TINYINT UNSIGNED DEFAULT 1;
  DECLARE v_price1          DECIMAL(12,2)    DEFAULT 0.00;
  DECLARE v_price2          DECIMAL(12,2)    DEFAULT 0.00;
  DECLARE v_price3          DECIMAL(12,2)    DEFAULT 0.00;
  DECLARE v_price4          DECIMAL(12,2)    DEFAULT 0.00;
  DECLARE v_price5          DECIMAL(12,2)    DEFAULT 0.00;

  -- ── Tablas temporales ────────────────────────────────────────────────────
  DROP TEMPORARY TABLE IF EXISTS _tmp_vids;
  DROP TEMPORARY TABLE IF EXISTS _tmp_cids;
  DROP TEMPORARY TABLE IF EXISTS _tmp_pids;

  CREATE TEMPORARY TABLE _tmp_vids (
    rn  INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    vid INT UNSIGNED NOT NULL
  ) ENGINE=MEMORY;

  CREATE TEMPORARY TABLE _tmp_cids (
    rn  INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cid INT UNSIGNED NOT NULL
  ) ENGINE=MEMORY;

  CREATE TEMPORARY TABLE _tmp_pids (
    rn     INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    pid    INT UNSIGNED    NOT NULL,
    precio DECIMAL(12,2)  NOT NULL
  ) ENGINE=MEMORY;

  -- Vendedores: rol_id = 3 (18 usuarios, IDs 5-22)
  INSERT INTO _tmp_vids (vid)
    SELECT id FROM usuarios WHERE rol_id = 3 AND activo = 1 ORDER BY id;

  -- Clientes activos
  INSERT INTO _tmp_cids (cid)
    SELECT id FROM clientes WHERE activo = 1 ORDER BY id;

  -- Productos activos
  INSERT INTO _tmp_pids (pid, precio)
    SELECT id, precio_venta FROM productos WHERE activo = 1 ORDER BY id;

  SELECT COUNT(*) INTO v_n_vids FROM _tmp_vids;
  SELECT COUNT(*) INTO v_n_cids FROM _tmp_cids;
  SELECT COUNT(*) INTO v_n_pids FROM _tmp_pids;

  IF v_n_vids = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seed error: no hay vendedores activos';
  END IF;
  IF v_n_cids = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seed error: no hay clientes activos';
  END IF;
  IF v_n_pids = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seed error: no hay productos activos';
  END IF;

  -- ── Loop principal ───────────────────────────────────────────────────────
  START TRANSACTION;

  WHILE v_i < 64000 DO

    -- 1. AÑO  (45% 2024 · 45% 2025 · 10% 2026)
    SET v_r = RAND();
    IF    v_r < 0.45 THEN SET v_year = 2024;
    ELSEIF v_r < 0.90 THEN SET v_year = 2025;
    ELSE                    SET v_year = 2026;
    END IF;

    -- 2. MES  (pesos estacionales Argentina, mueblería)
    IF v_year < 2026 THEN
      -- total peso = 1600
      SET v_rmonth = FLOOR(RAND() * 1600);
      IF    v_rmonth <   60 THEN SET v_month =  1;   -- ×0.6 baja post-verano
      ELSEIF v_rmonth <  180 THEN SET v_month =  2;   -- ×1.2
      ELSEIF v_rmonth <  320 THEN SET v_month =  3;   -- ×1.4 mudanzas
      ELSEIF v_rmonth <  420 THEN SET v_month =  4;   -- ×1.0
      ELSEIF v_rmonth <  600 THEN SET v_month =  5;   -- ×1.8 Día de la Madre
      ELSEIF v_rmonth <  800 THEN SET v_month =  6;   -- ×2.0 aguinaldo invierno
      ELSEIF v_rmonth <  870 THEN SET v_month =  7;   -- ×0.7
      ELSEIF v_rmonth <  940 THEN SET v_month =  8;   -- ×0.7
      ELSEIF v_rmonth < 1030 THEN SET v_month =  9;   -- ×0.9
      ELSEIF v_rmonth < 1170 THEN SET v_month = 10;   -- ×1.4 Día del Padre
      ELSEIF v_rmonth < 1300 THEN SET v_month = 11;   -- ×1.3 pre-Navidad
      ELSE                        SET v_month = 12;   -- ×3.0 Navidad+aguinaldo
      END IF;
    ELSE
      -- 2026: sólo ene-abr (total peso = 420)
      SET v_rmonth = FLOOR(RAND() * 420);
      IF    v_rmonth <  60 THEN SET v_month = 1;
      ELSEIF v_rmonth < 180 THEN SET v_month = 2;
      ELSEIF v_rmonth < 320 THEN SET v_month = 3;
      ELSE                        SET v_month = 4;
      END IF;
    END IF;

    -- 3. DÍA
    SET v_max_day = CASE v_month
      WHEN  2 THEN IF(v_year = 2024, 29, 28)
      WHEN  4 THEN 30  WHEN  6 THEN 30
      WHEN  9 THEN 30  WHEN 11 THEN 30
      ELSE 31
    END;
    SET v_day = 1 + FLOOR(RAND() * v_max_day);

    -- 4. HORA  (picos: 11-12 mañana, 16-17 tarde; siesta 14-15 baja)
    SET v_r = RAND() * 100;
    IF    v_r <  4 THEN SET v_hora =  9;
    ELSEIF v_r < 10 THEN SET v_hora = 10;
    ELSEIF v_r < 23 THEN SET v_hora = 11;
    ELSEIF v_r < 36 THEN SET v_hora = 12;
    ELSEIF v_r < 42 THEN SET v_hora = 13;
    ELSEIF v_r < 45 THEN SET v_hora = 14;
    ELSEIF v_r < 50 THEN SET v_hora = 15;
    ELSEIF v_r < 63 THEN SET v_hora = 16;
    ELSEIF v_r < 76 THEN SET v_hora = 17;
    ELSEIF v_r < 86 THEN SET v_hora = 18;
    ELSEIF v_r < 94 THEN SET v_hora = 19;
    ELSE                   SET v_hora = 20;
    END IF;

    SET v_fecha = DATE_ADD(
                   DATE_ADD(
                     DATE_ADD(
                       DATE_ADD(MAKEDATE(v_year, 1), INTERVAL (v_month - 1) MONTH),
                       INTERVAL (v_day - 1) DAY),
                     INTERVAL v_hora HOUR),
                   INTERVAL FLOOR(RAND() * 60) MINUTE);

    -- 5. VENDEDOR
    SET v_pick_idx = 1 + FLOOR(RAND() * v_n_vids);
    SELECT vid INTO v_vendedor_id
      FROM _tmp_vids WHERE rn = v_pick_idx LIMIT 1;

    -- 6. CLIENTE  (75% con cliente; 25% anónimo)
    IF RAND() < 0.75 THEN
      SET v_pick_idx = 1 + FLOOR(RAND() * v_n_cids);
      SELECT cid INTO v_cliente_id
        FROM _tmp_cids WHERE rn = v_pick_idx LIMIT 1;
    ELSE
      SET v_cliente_id = NULL;
    END IF;

    -- 7. MÉTODO DE PAGO  (45% efectivo · 38% tarjeta · 17% transferencia)
    SET v_tipo_tarjeta_id = NULL;
    SET v_cuotas          = 1;
    SET v_interes_pct     = 0.00;
    SET v_interes_monto   = 0.00;

    SET v_r = RAND();
    IF v_r < 0.45 THEN
      SET v_metodo_pago_id = 1;                             -- efectivo
    ELSEIF v_r < 0.83 THEN
      SET v_metodo_pago_id  = 2;                            -- tarjeta
      SET v_tipo_tarjeta_id = 1 + FLOOR(RAND() * 4);       -- Visa/MC/Naranja/Déb.
      SET v_rcuotas = RAND();
      IF    v_rcuotas < 0.35 THEN SET v_cuotas =  1; SET v_interes_pct =  0.00;
      ELSEIF v_rcuotas < 0.55 THEN SET v_cuotas =  3; SET v_interes_pct =  0.00;
      ELSEIF v_rcuotas < 0.73 THEN SET v_cuotas =  6; SET v_interes_pct = ROUND(12 + RAND() * 13, 2);
      ELSEIF v_rcuotas < 0.88 THEN SET v_cuotas = 12; SET v_interes_pct = ROUND(40 + RAND() * 20, 2);
      ELSE                          SET v_cuotas = 18; SET v_interes_pct = ROUND(80 + RAND() * 30, 2);
      END IF;
    ELSE
      SET v_metodo_pago_id = 3;                             -- transferencia
    END IF;

    -- 8. ESTADO  (87% completada · 5% pendiente · 8% cancelada)
    SET v_r = RAND();
    IF    v_r < 0.87 THEN SET v_estado_id = 1;
    ELSEIF v_r < 0.92 THEN SET v_estado_id = 2;
    ELSE                    SET v_estado_id = 3;
    END IF;

    -- 9. CANTIDAD DE ÍTEMS  (40%×1 · 30%×2 · 15%×3 · 10%×4 · 5%×5)
    SET v_r = RAND();
    IF    v_r < 0.40 THEN SET v_n_items = 1;
    ELSEIF v_r < 0.70 THEN SET v_n_items = 2;
    ELSEIF v_r < 0.85 THEN SET v_n_items = 3;
    ELSEIF v_r < 0.95 THEN SET v_n_items = 4;
    ELSE                    SET v_n_items = 5;
    END IF;

    -- 10. PRODUCTOS POR ÍTEM
    SET v_pick_idx = 1 + FLOOR(RAND() * v_n_pids);
    SELECT pid, precio INTO v_pid1, v_price1
      FROM _tmp_pids WHERE rn = v_pick_idx LIMIT 1;
    SET v_qty1 = 1 + FLOOR(RAND() * 3);

    SET v_pid2 = 0; SET v_qty2 = 0; SET v_price2 = 0.00;
    SET v_pid3 = 0; SET v_qty3 = 0; SET v_price3 = 0.00;
    SET v_pid4 = 0; SET v_qty4 = 0; SET v_price4 = 0.00;
    SET v_pid5 = 0; SET v_qty5 = 0; SET v_price5 = 0.00;

    IF v_n_items >= 2 THEN
      SET v_pick_idx = 1 + FLOOR(RAND() * v_n_pids);
      SELECT pid, precio INTO v_pid2, v_price2
        FROM _tmp_pids WHERE rn = v_pick_idx LIMIT 1;
      SET v_qty2 = 1 + FLOOR(RAND() * 3);
    END IF;
    IF v_n_items >= 3 THEN
      SET v_pick_idx = 1 + FLOOR(RAND() * v_n_pids);
      SELECT pid, precio INTO v_pid3, v_price3
        FROM _tmp_pids WHERE rn = v_pick_idx LIMIT 1;
      SET v_qty3 = 1 + FLOOR(RAND() * 3);
    END IF;
    IF v_n_items >= 4 THEN
      SET v_pick_idx = 1 + FLOOR(RAND() * v_n_pids);
      SELECT pid, precio INTO v_pid4, v_price4
        FROM _tmp_pids WHERE rn = v_pick_idx LIMIT 1;
      SET v_qty4 = 1 + FLOOR(RAND() * 3);
    END IF;
    IF v_n_items >= 5 THEN
      SET v_pick_idx = 1 + FLOOR(RAND() * v_n_pids);
      SELECT pid, precio INTO v_pid5, v_price5
        FROM _tmp_pids WHERE rn = v_pick_idx LIMIT 1;
      SET v_qty5 = 1 + FLOOR(RAND() * 3);
    END IF;

    -- 11. SUBTOTAL + DESCUENTO + INTERÉS
    SET v_subtotal = v_qty1 * v_price1
                   + v_qty2 * v_price2
                   + v_qty3 * v_price3
                   + v_qty4 * v_price4
                   + v_qty5 * v_price5;

    SET v_rdesc = RAND();
    IF    v_rdesc < 0.70 THEN SET v_descuento = 0.00;
    ELSEIF v_rdesc < 0.90 THEN SET v_descuento = ROUND(v_subtotal * (0.05 + RAND() * 0.05), 2);
    ELSE                        SET v_descuento = ROUND(v_subtotal * (0.10 + RAND() * 0.10), 2);
    END IF;

    SET v_interes_monto = ROUND((v_subtotal - v_descuento) * v_interes_pct / 100.0, 2);

    -- 12. INSERT VENTA
    INSERT INTO ventas
      (numero_venta, cliente_id, vendedor_id,
       metodo_pago_id, tipo_tarjeta_id, cuotas,
       subtotal, descuento, interes_porcentaje, interes_monto,
       estado_id, created_at)
    VALUES
      (0, v_cliente_id, v_vendedor_id,
       v_metodo_pago_id, v_tipo_tarjeta_id, v_cuotas,
       v_subtotal, v_descuento, v_interes_pct, v_interes_monto,
       v_estado_id, v_fecha);

    SET v_venta_id = LAST_INSERT_ID();

    -- 13. INSERT VENTA_ITEMS
    INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, created_at)
      VALUES (v_venta_id, v_pid1, v_qty1, v_price1, v_fecha);
    IF v_n_items >= 2 THEN
      INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, created_at)
        VALUES (v_venta_id, v_pid2, v_qty2, v_price2, v_fecha);
    END IF;
    IF v_n_items >= 3 THEN
      INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, created_at)
        VALUES (v_venta_id, v_pid3, v_qty3, v_price3, v_fecha);
    END IF;
    IF v_n_items >= 4 THEN
      INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, created_at)
        VALUES (v_venta_id, v_pid4, v_qty4, v_price4, v_fecha);
    END IF;
    IF v_n_items >= 5 THEN
      INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, created_at)
        VALUES (v_venta_id, v_pid5, v_qty5, v_price5, v_fecha);
    END IF;

    -- 14. MOVIMIENTOS DE STOCK  (sólo ventas no canceladas)
    IF v_estado_id != 3 THEN
      INSERT INTO movimientos_stock
        (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo, created_at)
        VALUES (v_pid1, v_vendedor_id, 2, -v_qty1, 'Venta', v_fecha);
      IF v_n_items >= 2 THEN
        INSERT INTO movimientos_stock
          (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo, created_at)
          VALUES (v_pid2, v_vendedor_id, 2, -v_qty2, 'Venta', v_fecha);
      END IF;
      IF v_n_items >= 3 THEN
        INSERT INTO movimientos_stock
          (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo, created_at)
          VALUES (v_pid3, v_vendedor_id, 2, -v_qty3, 'Venta', v_fecha);
      END IF;
      IF v_n_items >= 4 THEN
        INSERT INTO movimientos_stock
          (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo, created_at)
          VALUES (v_pid4, v_vendedor_id, 2, -v_qty4, 'Venta', v_fecha);
      END IF;
      IF v_n_items >= 5 THEN
        INSERT INTO movimientos_stock
          (producto_id, usuario_id, tipo_movimiento_id, cantidad, motivo, created_at)
          VALUES (v_pid5, v_vendedor_id, 2, -v_qty5, 'Venta', v_fecha);
      END IF;
    END IF;

    -- 15. COMMIT cada 500 ventas (mejora rendimiento InnoDB)
    SET v_i = v_i + 1;
    IF v_i MOD 500 = 0 THEN
      COMMIT;
      START TRANSACTION;
    END IF;

  END WHILE;

  COMMIT;

  DROP TEMPORARY TABLE IF EXISTS _tmp_vids;
  DROP TEMPORARY TABLE IF EXISTS _tmp_cids;
  DROP TEMPORARY TABLE IF EXISTS _tmp_pids;

END$$

DELIMITER ;

-- ============================================================================
-- 7. EJECUTAR Y LIMPIAR
-- ============================================================================
CALL sp_generar_ventas();
DROP PROCEDURE IF EXISTS sp_generar_ventas;

-- ============================================================================
-- 8. STOCK FINAL REALISTA (20-200 unidades por producto)
-- ============================================================================
UPDATE productos SET stock_actual = 20 + FLOOR(RAND() * 181);

-- ============================================================================
-- 9. RESTAURAR CONFIGURACIÓN
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;
SET unique_checks      = 1;
