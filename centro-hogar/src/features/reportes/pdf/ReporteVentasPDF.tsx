import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { LogoPDF } from './LogoPDF'
import type { ResumenCompleto } from '@/features/reportes/services/reportesService'

const BRAND = '#E97118'
const BRAND_DARK = '#B54612'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 50,
    paddingHorizontal: 36,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_DARK,
    letterSpacing: 0.5,
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
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
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
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 6,
    marginTop: 6,
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
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowText: {
    fontSize: 9,
    color: '#374151',
  },
  rank: { width: 22 },
  flex1: { flex: 1 },
  numCol: { width: 70, textAlign: 'right' },
  midCol: { width: 90, textAlign: 'right' },
  empty: { padding: 12, alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 9 },
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
  transferencia: 'Transferencia',
}

interface ReporteVentasPDFProps {
  resumen:    ResumenCompleto
  fechaDesde: string
  fechaHasta: string
}

export function ReporteVentasPDF({ resumen, fechaDesde, fechaHasta }: ReporteVentasPDFProps) {
  const generadoEn = formatDateTime(new Date().toISOString())
  const { resumen: r, por_metodo, por_vendedor, productos_top, ventas_por_dia } = resumen

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.brandRow}>
            <LogoPDF size={42} />
            <View>
              <Text style={styles.brand}>CENTRO HOGAR</Text>
              <Text style={styles.brandSub}>Tu mueblería de confianza</Text>
            </View>
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

        {/* KPIs */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL VENTAS</Text>
            <Text style={styles.statValue}>{r.total_ventas}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MONTO TOTAL</Text>
            <Text style={styles.statValue}>{formatCurrency(r.ingreso_total)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TICKET PROMEDIO</Text>
            <Text style={styles.statValue}>{formatCurrency(r.ticket_promedio)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DESCUENTOS</Text>
            <Text style={styles.statValue}>{formatCurrency(r.total_descuentos)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>INTERESES</Text>
            <Text style={styles.statValue}>{formatCurrency(r.total_intereses)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DÍAS CON VENTAS</Text>
            <Text style={styles.statValue}>{ventas_por_dia.length}</Text>
          </View>
        </View>

        {/* Por método de pago */}
        <Text style={styles.sectionTitle}>Por método de pago</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.flex1]}>Método</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>Ventas</Text>
          <Text style={[styles.tableHeaderText, styles.midCol]}>Total</Text>
        </View>
        {por_metodo.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Sin datos en el período.</Text></View>
        ) : por_metodo.map((m) => (
          <View key={m.metodo_pago} style={styles.tableRow}>
            <Text style={[styles.tableRowText, styles.flex1]}>
              {METODO_LABEL[m.metodo_pago.toLowerCase()] ?? m.metodo_pago}
            </Text>
            <Text style={[styles.tableRowText, styles.numCol]}>{m.cantidad}</Text>
            <Text style={[styles.tableRowText, styles.midCol]}>{formatCurrency(m.total)}</Text>
          </View>
        ))}

        {/* Por vendedor */}
        <Text style={styles.sectionTitle}>Ventas por vendedor</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.rank]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.flex1]}>Vendedor</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>Ventas</Text>
          <Text style={[styles.tableHeaderText, styles.midCol]}>Monto</Text>
        </View>
        {por_vendedor.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Sin datos en el período.</Text></View>
        ) : por_vendedor.map((v, i) => (
          <View key={v.id} style={styles.tableRow}>
            <Text style={[styles.tableRowText, styles.rank]}>{i + 1}</Text>
            <Text style={[styles.tableRowText, styles.flex1]}>{v.vendedor}</Text>
            <Text style={[styles.tableRowText, styles.numCol]}>{v.total_ventas}</Text>
            <Text style={[styles.tableRowText, styles.midCol]}>{formatCurrency(v.monto_total)}</Text>
          </View>
        ))}

        {/* Top productos */}
        <Text style={styles.sectionTitle}>Productos más vendidos</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.rank]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.flex1]}>Producto</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>Unidades</Text>
          <Text style={[styles.tableHeaderText, styles.midCol]}>Ingreso</Text>
        </View>
        {productos_top.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Sin datos en el período.</Text></View>
        ) : productos_top.map((p, i) => (
          <View key={p.id} style={styles.tableRow}>
            <Text style={[styles.tableRowText, styles.rank]}>{i + 1}</Text>
            <Text style={[styles.tableRowText, styles.flex1]}>{p.nombre}</Text>
            <Text style={[styles.tableRowText, styles.numCol]}>{p.unidades_vendidas}</Text>
            <Text style={[styles.tableRowText, styles.midCol]}>{formatCurrency(p.ingreso_total)}</Text>
          </View>
        ))}

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
