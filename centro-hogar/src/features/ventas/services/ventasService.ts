import { api } from '@/lib/api'
import type { Venta, VentaItem, CartItem, PaginatedResult } from '@/types/app.types'
import type { VentaFormValues } from '@/lib/validations/venta.schema'
import { calcularTotalConInteres } from '@/lib/utils'

interface CreateVentaInput extends VentaFormValues {
  vendedor_id: string
  items: CartItem[]
}

interface VendedorOption {
  id: number
  nombre: string
  apellido: string
}

function toMetodoPagoId(metodo: string): number {
  if (metodo === 'tarjeta') return 2
  if (metodo === 'transferencia') return 3
  return 1
}

function toTipoTarjetaId(tipo: string | null | undefined): number | null {
  if (tipo === 'visa') return 1
  if (tipo === 'mastercard') return 2
  if (tipo === 'naranja') return 3
  if (tipo === 'debito') return 4
  return null
}

function estadoToId(estado?: string): number | undefined {
  if (estado === 'completada') return 1
  if (estado === 'pendiente') return 2
  if (estado === 'cancelada') return 3
  return undefined
}

function normalizeTarjetaTipo(value: unknown): Venta['tarjeta_tipo'] {
  if (value === null || value === undefined) return null
  const raw = String(value).toLowerCase().trim()
  if (raw.includes('visa')) return 'visa'
  if (raw.includes('master')) return 'mastercard'
  if (raw.includes('naranja')) return 'naranja'
  if (raw.includes('debito') || raw.includes('débito')) return 'debito'
  return null
}

function mapVenta(v: any): Venta {
  const metodo = (v.metodo_pago ?? 'efectivo') as Venta['metodo_pago']
  const tarjeta = normalizeTarjetaTipo(v.tipo_tarjeta)
  const estado = (v.estado ?? 'completada') as Venta['estado']
  const numeroVenta = Number(v.numero_venta ?? v.id ?? 0)

  return {
    ...v,
    id: String(v.id),
    numero_venta: numeroVenta,
    cliente_id: v.cliente_id !== null && v.cliente_id !== undefined ? String(v.cliente_id) : null,
    vendedor_id: String(v.vendedor_id),
    subtotal: Number(v.subtotal ?? 0),
    descuento: Number(v.descuento ?? 0),
    interes_porcentaje: Number(v.interes_porcentaje ?? 0),
    interes_monto: Number(v.interes_monto ?? 0),
    total_final: Number(v.total_final ?? 0),
    cuotas: Number(v.cuotas ?? 1),
    metodo_pago: metodo,
    tarjeta_tipo: tarjeta,
    estado,
    cliente: v.cliente
      ? {
          ...v.cliente,
          id: String(v.cliente.id),
        }
      : undefined,
    vendedor: v.vendedor
      ? {
          ...v.vendedor,
          id: String(v.vendedor.id),
          activo: Boolean(v.vendedor.activo ?? true),
        }
      : undefined,
    items: Array.isArray(v.items)
      ? v.items.map((item: any) => ({
          ...item,
          id: String(item.id),
          venta_id: String(item.venta_id),
          producto_id: String(item.producto_id),
          cantidad: Number(item.cantidad ?? 0),
          precio_unitario: Number(item.precio_unitario ?? 0),
          subtotal: Number(item.subtotal ?? 0),
          producto: item.producto
            ? {
                ...item.producto,
                id: String(item.producto.id),
                codigo: item.producto.codigo ?? '',
                nombre: item.producto.nombre ?? 'Producto',
                descripcion: item.producto.descripcion ?? null,
                categoria_id: item.producto.categoria_id !== null && item.producto.categoria_id !== undefined
                  ? String(item.producto.categoria_id)
                  : null,
                activo: Boolean(item.producto.activo ?? true),
                created_at: item.producto.created_at ?? '',
                updated_at: item.producto.updated_at ?? '',
                precio_venta: Number(item.producto.precio_venta ?? 0),
                precio_costo: Number(item.producto.precio_costo ?? 0),
                stock_actual: Number(item.producto.stock_actual ?? 0),
                stock_minimo: Number(item.producto.stock_minimo ?? 0),
              }
            : undefined,
        }))
      : undefined,
  }
}

export const ventasService = {
  async list(params?: {
    vendedorId?: string
    estado?: string
    metodoPago?: string
    fechaDesde?: string
    fechaHasta?: string
    page?: number
    pageSize?: number
  }): Promise<{ data: Venta[]; count: number }> {
    const { vendedorId, estado, metodoPago, fechaDesde, fechaHasta, page = 1, pageSize = 20 } = params ?? {}
    const q = new URLSearchParams()

    const vendedorIdNum = vendedorId ? parseInt(vendedorId, 10) : NaN
    if (!Number.isNaN(vendedorIdNum)) q.set('vendedorId', String(vendedorIdNum))

    const estadoId = estadoToId(estado)
    if (estadoId) q.set('estadoId', String(estadoId))

    if (metodoPago) q.set('metodoPagoId', String(toMetodoPagoId(metodoPago)))
    if (fechaDesde) q.set('fechaDesde', fechaDesde)
    if (fechaHasta) q.set('fechaHasta', fechaHasta)
    q.set('page', String(page))
    q.set('pageSize', String(pageSize))

    const result = await api.get<PaginatedResult<any>>(`/ventas?${q.toString()}`)
    return { data: result.data.map(mapVenta), count: result.total }
  },

  async getById(id: string): Promise<Venta> {
    const venta = await api.get<any>(`/ventas/${id}`)
    return mapVenta(venta)
  },

  async create(input: CreateVentaInput): Promise<Venta> {
    const { items, ...formValues } = input

    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0)
    const { interesMonto } = calcularTotalConInteres(
      subtotal,
      formValues.descuento ?? 0,
      formValues.interes_porcentaje ?? 0
    )

    const payload = {
      cliente_id: formValues.cliente_id ? parseInt(formValues.cliente_id, 10) : null,
      metodo_pago_id: toMetodoPagoId(formValues.metodo_pago),
      tipo_tarjeta_id: toTipoTarjetaId(formValues.tarjeta_tipo),
      cuotas: formValues.cuotas ?? 1,
      descuento: formValues.descuento ?? 0,
      interes_porcentaje: formValues.interes_porcentaje ?? 0,
      interes_monto: interesMonto,
      notas: formValues.notas ?? null,
      items: items.map((item) => ({
        producto_id: parseInt(item.producto.id, 10),
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
    }

    const venta = await api.post<any>('/ventas', payload)
    return mapVenta(venta)
  },

  async cancelar(id: string): Promise<void> {
    await api.patch(`/ventas/${id}/cancelar`)
  },

  async getStatsHoy(): Promise<{
    totalVentas: number
    montoTotal: number
    ticketPromedio: number
  }> {
    return api.get('/ventas/stats/hoy')
  },

  async getVentasPorDia(dias = 30): Promise<{ fecha: string; total: number; cantidad: number }[]> {
    return api.get(`/ventas/stats/por-dia?dias=${dias}`)
  },

  async listVendedores(): Promise<VendedorOption[]> {
    return api.get<VendedorOption[]>('/ventas/vendedores')
  },

  async getItemsFromVenta(ventaId: string): Promise<VentaItem[]> {
    const venta = await this.getById(ventaId)
    return venta.items ?? []
  },
}
