import { api } from '@/lib/api'
import type { Producto, Categoria, PaginatedResult } from '@/types/app.types'
import type { ProductoFormValues } from '@/lib/validations/producto.schema'

interface ProductoListParams {
  search?: string
  categoriaId?: string
  soloActivos?: boolean
  soloActivo?: boolean | null
  bajoStock?: boolean
  conStock?: boolean
  sort?: 'top' | 'nombre'
  page?: number
  pageSize?: number
}

function normalizeCategoria(c: any): Categoria {
  return {
    ...c,
    id: String(c.id),
  }
}

function normalizeProducto(p: any): Producto {
  return {
    ...p,
    id: String(p.id),
    categoria_id: p.categoria_id !== null && p.categoria_id !== undefined ? String(p.categoria_id) : null,
    precio_costo: Number(p.precio_costo ?? 0),
    precio_venta: Number(p.precio_venta ?? 0),
    stock_actual: Number(p.stock_actual ?? 0),
    stock_minimo: Number(p.stock_minimo ?? 0),
    activo: Boolean(p.activo),
    categoria: p.categoria
      ? {
          id: String(p.categoria.id),
          nombre: p.categoria.nombre,
          descripcion: p.categoria.descripcion ?? null,
          created_at: p.categoria.created_at ?? '',
        }
      : undefined,
  }
}

function buildListQuery(params?: ProductoListParams): string {
  const q = new URLSearchParams()

  if (!params) return ''

  if (params.search) q.set('search', params.search)

  const categoriaId = params.categoriaId ? parseInt(params.categoriaId, 10) : NaN
  if (!Number.isNaN(categoriaId)) q.set('categoriaId', String(categoriaId))

  if (params.soloActivo !== undefined && params.soloActivo !== null) {
    q.set('soloActivos', String(params.soloActivo))
  } else if (params.soloActivos !== undefined) {
    q.set('soloActivos', String(params.soloActivos))
  }

  if (params.bajoStock) q.set('bajoStock', 'true')
  if (params.conStock) q.set('conStock', 'true')
  if (params.sort) q.set('sort', params.sort)
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))

  const qs = q.toString()
  return qs ? `?${qs}` : ''
}

export const productosService = {
  async list(params?: ProductoListParams): Promise<{ data: Producto[]; count: number }> {
    const result = await api.get<PaginatedResult<any>>(`/productos${buildListQuery(params)}`)
    return { data: result.data.map(normalizeProducto), count: result.total }
  },

  async getById(id: string): Promise<Producto> {
    const producto = await api.get<any>(`/productos/${id}`)
    return normalizeProducto(producto)
  },

  async create(values: ProductoFormValues): Promise<Producto> {
    const producto = await api.post<any>('/productos', {
      ...values,
      categoria_id: values.categoria_id ? parseInt(values.categoria_id, 10) : null,
    })
    return normalizeProducto(producto)
  },

  async update(id: string, values: Partial<ProductoFormValues>): Promise<Producto> {
    const producto = await api.put<any>(`/productos/${id}`, {
      ...values,
      categoria_id: values.categoria_id === undefined
        ? undefined
        : values.categoria_id
          ? parseInt(values.categoria_id, 10)
          : null,
    })
    return normalizeProducto(producto)
  },

  async toggleActivo(id: string, activo: boolean): Promise<Producto> {
    const producto = await api.put<any>(`/productos/${id}`, { activo })
    return normalizeProducto(producto)
  },

  async delete(id: string): Promise<void> {
    await api.put(`/productos/${id}`, { activo: false })
  },

  async updateStock(
    productoId: string,
    delta: number,
    _usuarioId: string,
    tipo: 'entrada' | 'salida' | 'ajuste',
    motivo?: string
  ): Promise<void> {
    const tipoMovimientoId = tipo === 'entrada' ? 1 : tipo === 'salida' ? 2 : 3
    await api.patch(`/productos/${productoId}/stock`, {
      delta,
      tipo_movimiento_id: tipoMovimientoId,
      motivo,
    })
  },

  async listCategorias(): Promise<Categoria[]> {
    const categorias = await api.get<any[]>('/categorias')
    return categorias.map(normalizeCategoria)
  },

  async getBajoStock(): Promise<Producto[]> {
    const productos = await api.get<any[]>('/productos/bajo-stock')
    return productos.map(normalizeProducto)
  },

  async createCategoria(nombre: string, descripcion?: string): Promise<Categoria> {
    const categoria = await api.post<any>('/categorias', { nombre, descripcion: descripcion ?? null })
    return normalizeCategoria(categoria)
  },

  async updateCategoria(id: string, values: { nombre: string; descripcion?: string }): Promise<Categoria> {
    const categoria = await api.put<any>(`/categorias/${id}`, {
      nombre: values.nombre,
      descripcion: values.descripcion ?? null,
    })
    return normalizeCategoria(categoria)
  },

  async deleteCategoria(id: string): Promise<void> {
    await api.delete(`/categorias/${id}`)
  },
}
