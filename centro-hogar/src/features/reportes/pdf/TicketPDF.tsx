import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { LogoPDF } from './LogoPDF'
import type { Venta, CartItem } from '@/types/app.types'

const BRAND = '#E97118'
const BRAND_DARK = '#B54612'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 18,
    backgroundColor: '#ffffff',
  },
  header: { alignItems: 'center', marginBottom: 6 },
  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    color: BRAND_DARK,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 1,
  },
  metaBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_DARK,
  },
  metaSub: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 1,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 6 },
  dividerStrong: { borderBottomWidth: 1.5, borderBottomColor: BRAND, marginVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { marginBottom: 4 },
  label: { color: '#6b7280', fontSize: 8 },
  value: { fontFamily: 'Helvetica-Bold' },
  bold: { fontFamily: 'Helvetica-Bold' },
  itemTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#111827',
  },
  itemMeta: {
    fontSize: 8,
    color: '#6b7280',
  },
  totalBlock: {
    marginTop: 6,
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    padding: 8,
  },
  totalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#374151' },
  totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: BRAND_DARK },
  cuotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
    fontSize: 8,
  },
  pagoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 6,
  },
  footer: { marginTop: 10, alignItems: 'center' },
  footerThanks: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_DARK,
  },
  footerText: { fontSize: 7, color: '#9ca3af', marginTop: 1 },
})

interface TicketPDFProps {
  venta: Venta
  items: CartItem[]
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

const TARJETA_LABEL: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  naranja: 'Naranja X',
  debito: 'Débito',
}

export function TicketPDF({ venta, items }: TicketPDFProps) {
  const cuotaMonto = venta.cuotas > 1 ? venta.total_final / venta.cuotas : venta.total_final
  const numeroFmt = `#${String(venta.numero_venta).padStart(4, '0')}`

  return (
    <Document>
      {/* 80mm = 226pt de ancho; alto generoso (auto-ajusta el contenido) */}
      <Page size={[226, 600]} style={styles.page}>
        {/* Header con logo */}
        <View style={styles.header}>
          <LogoPDF size={48} />
          <Text style={styles.title}>CENTRO HOGAR</Text>
          <Text style={styles.subtitle}>Tu mueblería de confianza</Text>
        </View>

        {/* Numero y fecha destacados */}
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Comprobante {numeroFmt}</Text>
          <Text style={styles.metaSub}>{formatDateTime(venta.created_at)}</Text>
        </View>

        {(venta.cliente || venta.vendedor) && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              {venta.cliente && (
                <View style={styles.row}>
                  <Text style={styles.label}>Cliente</Text>
                  <Text style={styles.bold}>
                    {venta.cliente.nombre} {venta.cliente.apellido}
                  </Text>
                </View>
              )}
              {venta.cliente?.dni && (
                <View style={styles.row}>
                  <Text style={styles.label}>DNI</Text>
                  <Text>{venta.cliente.dni}</Text>
                </View>
              )}
              {venta.vendedor && (
                <View style={styles.row}>
                  <Text style={styles.label}>Atendido por</Text>
                  <Text>
                    {venta.vendedor.nombre} {venta.vendedor.apellido}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.dividerStrong} />

        {/* Items */}
        <View style={styles.section}>
          {items.map((item, idx) => (
            <View key={idx} style={{ marginBottom: 4 }}>
              <Text style={styles.itemTitle}>{item.producto.nombre}</Text>
              <View style={styles.row}>
                <Text style={styles.itemMeta}>
                  {item.cantidad} × {formatCurrency(item.precio_unitario)}
                </Text>
                <Text style={styles.bold}>{formatCurrency(item.subtotal)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Totales */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text>{formatCurrency(venta.subtotal)}</Text>
          </View>
          {venta.descuento > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Descuento</Text>
              <Text style={{ color: '#15803d' }}>− {formatCurrency(venta.descuento)}</Text>
            </View>
          )}
          {venta.interes_porcentaje > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Interés ({venta.interes_porcentaje}%)</Text>
              <Text style={{ color: '#b45309' }}>+ {formatCurrency(venta.interes_monto)}</Text>
            </View>
          )}
        </View>

        {/* Total destacado */}
        <View style={styles.totalBlock}>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{formatCurrency(venta.total_final)}</Text>
          </View>
          {venta.cuotas > 1 && (
            <View style={styles.cuotaRow}>
              <Text style={styles.label}>{venta.cuotas} cuotas de</Text>
              <Text style={styles.bold}>{formatCurrency(cuotaMonto)}</Text>
            </View>
          )}
        </View>

        {/* Método de pago */}
        <View style={styles.pagoBox}>
          <Text style={styles.label}>Forma de pago</Text>
          <Text style={styles.bold}>
            {METODO_LABEL[venta.metodo_pago]}
            {venta.tarjeta_tipo ? ` · ${TARJETA_LABEL[venta.tarjeta_tipo]}` : ''}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Text style={styles.footerThanks}>¡Gracias por su compra!</Text>
          <Text style={styles.footerText}>Conserve este comprobante por cualquier consulta.</Text>
        </View>
      </Page>
    </Document>
  )
}
