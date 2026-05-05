import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Producto } from '@/types/app.types'

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
  tableRowAlert: {
    fontSize: 9,
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
  },
  colCodigo: { width: 70 },
  colNombre: { flex: 1 },
  colCategoria: { width: 90 },
  colStockMin: { width: 60, textAlign: 'center' },
  colStockAct: { width: 60, textAlign: 'center' },
  colPrecio: { width: 80, textAlign: 'right' },
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
  alertLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  alertText: {
    fontSize: 8,
    color: '#6b7280',
  },
})

interface ReporteStockPDFProps {
  productos: Producto[]
}

export function ReporteStockPDF({ productos }: ReporteStockPDFProps) {
  const generadoEn = formatDateTime(new Date().toISOString())
  const totalProductos = productos.length
  const activosCount = productos.filter((p) => p.activo).length
  const bajoStockCount = productos.filter((p) => p.stock_actual <= p.stock_minimo).length

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
            <Text style={styles.reportTitle}>Reporte de Stock</Text>
            <Text style={styles.reportMeta}>Generado: {generadoEn}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL PRODUCTOS</Text>
            <Text style={styles.statValue}>{totalProductos}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ACTIVOS</Text>
            <Text style={styles.statValue}>{activosCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>BAJO MÍNIMO</Text>
            <Text style={[styles.statValue, { color: bajoStockCount > 0 ? '#dc2626' : '#111827' }]}>
              {bajoStockCount}
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.alertLegend}>
          <View style={styles.alertDot} />
          <Text style={styles.alertText}>
            Productos marcados en rojo tienen stock igual o menor al mínimo definido.
          </Text>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colCodigo]}>Código</Text>
          <Text style={[styles.tableHeaderText, styles.colNombre]}>Nombre</Text>
          <Text style={[styles.tableHeaderText, styles.colCategoria]}>Categoría</Text>
          <Text style={[styles.tableHeaderText, styles.colStockMin]}>Mín.</Text>
          <Text style={[styles.tableHeaderText, styles.colStockAct]}>Actual</Text>
          <Text style={[styles.tableHeaderText, styles.colPrecio]}>P. Venta</Text>
        </View>

        {/* Rows */}
        {productos.map((p) => {
          const isBajo = p.stock_actual <= p.stock_minimo
          const textStyle = isBajo ? styles.tableRowAlert : styles.tableRowText
          return (
            <View key={p.id} style={styles.tableRow} wrap={false}>
              <Text style={[textStyle, styles.colCodigo]}>{p.codigo}</Text>
              <Text style={[textStyle, styles.colNombre]}>
                {p.nombre}
              </Text>
              <Text style={[textStyle, styles.colCategoria]}>
                {p.categoria?.nombre ?? '—'}
              </Text>
              <Text style={[textStyle, styles.colStockMin]}>{p.stock_minimo}</Text>
              <Text style={[textStyle, styles.colStockAct]}>{p.stock_actual}</Text>
              <Text style={[textStyle, styles.colPrecio]}>
                {formatCurrency(p.precio_venta)}
              </Text>
            </View>
          )
        })}

        {productos.length === 0 && (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af', fontSize: 9 }}>No hay productos registrados.</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Centro Hogar — Reporte de Stock</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
