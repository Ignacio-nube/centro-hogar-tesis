export type Rol = 'admin' | 'encargado_stock' | 'vendedor'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'
export type TarjetaTipo = 'visa' | 'mastercard' | 'naranja' | 'debito'
export type EstadoVenta = 'completada' | 'cancelada' | 'pendiente'
export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste'

export interface Profile {
  id: string
  nombre: string
  apellido: string
  rol: Rol
  activo: boolean
  email?: string
  created_at: string
  updated_at: string
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  precio_costo: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  categoria_id: string | null
  categoria?: Categoria
  imagen_url: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nombre: string
  apellido: string
  dni: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface VentaItem {
  id: string
  venta_id: string
  producto_id: string
  producto?: Producto
  cantidad: number
  precio_unitario: number
  subtotal: number
  created_at: string
}

export interface Venta {
  id: string
  numero_venta: number
  cliente_id: string | null
  cliente?: Cliente
  vendedor_id: string
  vendedor?: Profile
  subtotal: number
  descuento: number
  interes_porcentaje: number
  interes_monto: number
  total_final: number
  metodo_pago: MetodoPago
  tarjeta_tipo: TarjetaTipo | null
  cuotas: number
  estado: EstadoVenta
  notas: string | null
  created_at: string
  items?: VentaItem[]
}

export interface MovimientoStock {
  id: string
  producto_id: string
  producto?: Producto
  usuario_id: string
  usuario?: Profile
  tipo: TipoMovimiento
  cantidad: number
  motivo: string | null
  created_at: string
}

// Cart types (frontend only)
export interface CartItem {
  producto: Producto
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface SaleWizardState {
  step: 1 | 2 | 3 | 4
  cliente: Cliente | null
  items: CartItem[]
  metodo_pago: MetodoPago
  tarjeta_tipo: TarjetaTipo | null
  cuotas: number
  interes_porcentaje: number
  descuento: number
  notas: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuthLoginResult {
  token: string
  usuario: {
    id: number
    nombre: string
    apellido: string
    email: string
    rol: Rol
    activo: boolean
    created_at?: string
    updated_at?: string
  }
}

