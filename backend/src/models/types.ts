// ─── Tipos de lookup ──────────────────────────────────────────────────────────
export type Rol            = 'admin' | 'encargado_stock' | 'vendedor'
export type MetodoPago     = 'efectivo' | 'tarjeta' | 'transferencia'
export type TarjetaTipo    = 'Visa' | 'Mastercard' | 'Naranja' | 'Débito'
export type EstadoVenta    = 'completada' | 'cancelada' | 'pendiente'
export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste'

// ─── Entidades ────────────────────────────────────────────────────────────────
export interface Usuario {
  id:           number
  nombre:       string
  apellido:     string
  email:        string
  rol_id:       number
  rol?:         Rol
  activo:       boolean
  created_at:   string
  updated_at:   string
}

export interface UsuarioConHash extends Usuario {
  password_hash: string
}

export interface Categoria {
  id:          number
  nombre:      string
  descripcion: string | null
  activo:      boolean
  created_at:  string
  updated_at:  string
}

export interface Producto {
  id:            number
  codigo:        string
  nombre:        string
  descripcion:   string | null
  precio_costo:  number
  precio_venta:  number
  stock_actual:  number
  stock_minimo:  number
  categoria_id:  number | null
  categoria?:    Categoria
  imagen_url:    string | null
  activo:        boolean
  created_at:    string
  updated_at:    string
}

export interface Cliente {
  id:         number
  nombre:     string
  apellido:   string
  dni:        string | null
  telefono:   string | null
  email:      string | null
  direccion:  string | null
  activo:     boolean
  created_at: string
  updated_at: string
}

export interface VentaItem {
  id:              number
  venta_id:        number
  producto_id:     number
  producto?:       Producto
  cantidad:        number
  precio_unitario: number
  subtotal:        number
  created_at:      string
}

export interface Venta {
  id:                 number
  numero_venta:       number
  cliente_id:         number | null
  cliente?:           Cliente
  vendedor_id:        number
  vendedor?:          Usuario
  metodo_pago_id:     number
  metodo_pago?:       string
  tipo_tarjeta_id:    number | null
  tipo_tarjeta?:      string | null
  cuotas:             number
  subtotal:           number
  descuento:          number
  interes_porcentaje: number
  interes_monto:      number
  total_final:        number
  estado_id:          number
  estado?:            string
  notas:              string | null
  items?:             VentaItem[]
  created_at:         string
}

export interface MovimientoStock {
  id:                 number
  producto_id:        number
  producto?:          Producto
  usuario_id:         number
  usuario?:           Usuario
  tipo_movimiento_id: number
  tipo_movimiento?:   string
  cantidad:           number
  motivo:             string | null
  created_at:         string
}

// ─── Payloads de entrada ──────────────────────────────────────────────────────
export interface CreateVentaPayload {
  cliente_id?:         number | null
  metodo_pago_id:      number
  tipo_tarjeta_id?:    number | null
  cuotas?:             number
  descuento?:          number
  interes_porcentaje?: number
  interes_monto?:      number
  notas?:              string | null
  items: {
    producto_id:     number
    cantidad:        number
    precio_unitario: number
  }[]
}

// ─── Paginación ───────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data:       T[]
  total:      number
  page:       number
  pageSize:   number
  totalPages: number
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub:    number   // usuario.id
  email:  string
  rol:    Rol
  iat?:   number
  exp?:   number
}
