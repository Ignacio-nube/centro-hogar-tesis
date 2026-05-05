import { api } from '@/lib/api'
import type { Cliente, Venta, PaginatedResult } from '@/types/app.types'
import type { ClienteFormValues } from '@/lib/validations/cliente.schema'

interface HistorialResponse extends PaginatedResult<Venta> {
  stats: {
    compras_completadas: number
    total_comprado: number
    ticket_promedio: number
  }
}

function normalizeCliente(c: any): Cliente {
  return {
    ...c,
    id: String(c.id),
    activo: Boolean(c.activo),
  }
}

function normalizeVenta(v: any): Venta {
  return {
    ...v,
    id: String(v.id),
    cliente_id: v.cliente_id !== null && v.cliente_id !== undefined ? String(v.cliente_id) : null,
    vendedor_id: String(v.vendedor_id),
    subtotal: Number(v.subtotal ?? 0),
    descuento: Number(v.descuento ?? 0),
    interes_porcentaje: Number(v.interes_porcentaje ?? 0),
    interes_monto: Number(v.interes_monto ?? 0),
    total_final: Number(v.total_final ?? 0),
    cuotas: Number(v.cuotas ?? 1),
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
          activo: Boolean(v.vendedor.activo),
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
        }))
      : undefined,
  }
}

export const clientesService = {
  async list(params?: {
    search?: string
    activo?: boolean
    page?: number
    pageSize?: number
  }): Promise<{ data: Cliente[]; count: number }> {
    const query = new URLSearchParams()

    if (params?.search) query.set('search', params.search)
    if (params?.activo !== undefined) query.set('activo', String(params.activo))
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))

    const qs = query.toString()
    const result = await api.get<PaginatedResult<any>>(`/clientes${qs ? `?${qs}` : ''}`)
    return { data: result.data.map(normalizeCliente), count: result.total }
  },

  async getById(id: string): Promise<Cliente> {
    const cliente = await api.get<any>(`/clientes/${id}`)
    return normalizeCliente(cliente)
  },

  async create(values: ClienteFormValues): Promise<Cliente> {
    const cliente = await api.post<any>('/clientes', values)
    return normalizeCliente(cliente)
  },

  async update(id: string, values: Partial<ClienteFormValues>): Promise<Cliente> {
    const cliente = await api.put<any>(`/clientes/${id}`, values)
    return normalizeCliente(cliente)
  },

  async toggleActivo(id: string, activo: boolean): Promise<Cliente> {
    const cliente = await api.put<any>(`/clientes/${id}`, { activo })
    return normalizeCliente(cliente)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/clientes/${id}`)
  },

  async search(query: string): Promise<Cliente[]> {
    const q = new URLSearchParams({ q: query })
    const result = await api.get<any[]>(`/clientes/search?${q.toString()}`)
    return result.map(normalizeCliente)
  },

  async getHistorial(clienteId: string): Promise<Venta[]> {
    const data = await api.get<HistorialResponse>(`/clientes/${clienteId}/historial?page=1&pageSize=100`)
    return data.data.map(normalizeVenta)
  },
}
