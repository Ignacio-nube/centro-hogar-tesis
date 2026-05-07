import type { Venta, CartItem, Producto } from '@/types/app.types'
import type { ResumenCompleto } from '@/features/reportes/services/reportesService'

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Genera el PDF del ticket en demanda.
 * Carga dinámicamente @react-pdf/renderer (~1.5MB) sólo cuando el usuario lo necesita,
 * evitando que el chunk pese sobre la carga inicial de páginas como /ventas.
 */
export async function downloadTicketPDF(venta: Venta, items: CartItem[]): Promise<void> {
  const [{ pdf }, { TicketPDF }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./TicketPDF'),
    import('react'),
  ])
  const element = React.createElement(TicketPDF, { venta, items }) as Parameters<typeof pdf>[0]
  const blob = await pdf(element).toBlob()
  triggerDownload(blob, `ticket-${venta.numero_venta}.pdf`)
}

export async function downloadReporteVentasPDF(
  resumen: ResumenCompleto,
  fechaDesde: string,
  fechaHasta: string,
): Promise<void> {
  const [{ pdf }, { ReporteVentasPDF }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./ReporteVentasPDF'),
    import('react'),
  ])
  const element = React.createElement(ReporteVentasPDF, {
    resumen, fechaDesde, fechaHasta,
  }) as Parameters<typeof pdf>[0]
  const blob = await pdf(element).toBlob()
  triggerDownload(blob, `reporte-ventas-${fechaDesde}-${fechaHasta}.pdf`)
}

export async function downloadReporteStockPDF(productos: Producto[]): Promise<void> {
  const [{ pdf }, { ReporteStockPDF }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./ReporteStockPDF'),
    import('react'),
  ])
  const element = React.createElement(ReporteStockPDF, { productos }) as Parameters<typeof pdf>[0]
  const blob = await pdf(element).toBlob()
  const today = new Date().toISOString().slice(0, 10)
  triggerDownload(blob, `reporte-stock-${today}.pdf`)
}
