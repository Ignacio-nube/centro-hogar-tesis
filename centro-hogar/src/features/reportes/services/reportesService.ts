import { api } from '@/lib/api'

export interface ResumenPeriodo {
  total_ventas: number
  ingreso_total: number
  ticket_promedio: number
  total_descuentos: number
  total_intereses: number
}

export interface MetodoPagoStats {
  metodo_pago: string
  cantidad: number
  total: number
}

export interface VendedorStats {
  id: number
  vendedor: string
  total_ventas: number
  monto_total: number
}

export interface ProductoTop {
  id: number
  codigo: string
  nombre: string
  unidades_vendidas: number
  ingreso_total: number
}

export interface ClienteTop {
  id: number
  cliente: string
  total_compras: number
  monto_total: number
}

export interface VentaDia {
  fecha: string
  cantidad: number
  total: number
}

export interface ResumenCompleto {
  resumen: ResumenPeriodo
  por_metodo: MetodoPagoStats[]
  por_vendedor: VendedorStats[]
  productos_top: ProductoTop[]
  clientes_top: ClienteTop[]
  ventas_por_dia: VentaDia[]
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export type DashboardPeriodo = 'semana' | 'mes' | 'trimestre' | 'anio'

export interface CategoriaTop {
  categoria: string
  unidades: number
  ingreso: number
}

export interface ProductoPorCategoria {
  categoria: string
  producto: string
  unidades: number
  ingreso: number
}

export interface VendedorTop {
  vendedor: string
  total_ventas: number
  monto_total: number
}

export interface DashboardData {
  periodo:                 DashboardPeriodo
  dias:                    number
  categorias_top:          CategoriaTop[]
  productos_por_categoria: ProductoPorCategoria[]
  vendedores_top:          VendedorTop[]
}

export const reportesService = {
  async getResumen(fechaDesde: string, fechaHasta: string): Promise<ResumenCompleto> {
    return api.get<ResumenCompleto>(
      `/reportes/resumen?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
    )
  },

  async getStock() {
    return api.get<Array<{
      id: number
      codigo: string
      nombre: string
      stock_actual: number
      stock_minimo: number
      categoria: string
      bajo_stock: boolean
    }>>('/reportes/stock')
  },

  async getDashboardData(periodo: DashboardPeriodo = 'mes'): Promise<DashboardData> {
    return api.get<DashboardData>(`/reportes/dashboard?periodo=${periodo}`)
  },
}
