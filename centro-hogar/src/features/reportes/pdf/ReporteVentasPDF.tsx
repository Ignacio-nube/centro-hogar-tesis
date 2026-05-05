import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import type { Venta } from '@/types/app.types'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 36,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  brandSub: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    color: '#111827',
  },
  reportMeta: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 10,
  },
  statLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowText: {
    fontSize: 9,
    color: '#374151',
  },
  colNum: { width: 40 },
  colFecha: { width: 70 },
  colCliente: { flex: 1 },
  colMetodo: { width: 80 },
  colTotal: { width: 80, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transf.',
}

interface ReporteVentasPDFProps {
  ventas: Venta[]
  fechaDesde: string
  fechaHasta: string
  stats: {
    totalVentas: number
    montoTotal: number
    ticketPromedio: number
  }
}

export function ReporteVentasPDF({ ventas, fechaDesde, fechaHasta, stats }: ReporteVentasPDFProps) {
  const generadoEn = formatDateTime(new Date().toISOString())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>CENTRO HOGAR</Text>
            <Text style={styles.brandSub}>Tu mueblería de confianza</Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>Reporte de Ventas</Text>
            <Text style={styles.reportMeta}>
              {formatDate(fechaDesde)} — {formatDate(fechaHasta)}
            </Text>
            <Text style={styles.reportMeta}>Generado: {generadoEn}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL VENTAS</Text>
            <Text style={styles.statValue}>{stats.totalVentas}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MONTO TOTAL</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.montoTotal)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TICKET PROMEDIO</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.ticketPromedio)}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colNum]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.colFecha]}>Fecha</Text>
          <Text style={[styles.tableHeaderText, styles.colCliente]}>Cliente</Text>
          <Text style={[styles.tableHeaderText, styles.colMetodo]}>Método</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>

        {/* Rows */}
        {ventas.map((v) => (
          <View key={v.id} style={styles.tableRow}>
            <Text style={[styles.tableRowText, styles.colNum]}>
              {String(v.numero_venta).padStart(4, '0')}
            </Text>
            <Text style={[styles.tableRowText, styles.colFecha]}>
              {formatDate(v.created_at)}
            </Text>
            <Text style={[styles.tableRowText, styles.colCliente]}>
              {v.cliente ? `${v.cliente.apellido}, ${v.cliente.nombre}` : '—'}
            </Text>
            <Text style={[styles.tableRowText, styles.colMetodo]}>
              {METODO_LABEL[v.metodo_pago] ?? v.metodo_pago}
            </Text>
            <Text style={[styles.tableRowText, styles.colTotal]}>
              {formatCurrency(v.total_final)}
            </Text>
          </View>
        ))}

        {ventas.length === 0 && (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af', fontSize: 9 }}>
              No hay ventas en el período seleccionado.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Centro Hogar — Reporte de Ventas</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
