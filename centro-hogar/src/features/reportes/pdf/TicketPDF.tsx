import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import type { Venta, CartItem } from '@/types/app.types'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 16,
    width: 226, // ~80mm
    backgroundColor: '#ffffff',
  },
  center: { alignItems: 'center', textAlign: 'center' },
  bold: { fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#d1d5db', marginVertical: 6 },
  header: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  subtitle: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  section: { marginBottom: 6 },
  label: { color: '#6b7280', fontSize: 8 },
  value: { fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  footer: { marginTop: 12, alignItems: 'center' },
  footerText: { fontSize: 8, color: '#9ca3af' },
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

  return (
    <Document>
      <Page size={[226, 600]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CENTRO HOGAR</Text>
          <Text style={styles.subtitle}>Comprobante de venta</Text>
          <View style={styles.divider} />
          <Text style={[styles.label, { marginTop: 2 }]}>
            #{String(venta.numero_venta).padStart(4, '0')} · {formatDateTime(venta.created_at)}
          </Text>
        </View>

        {/* Cliente y vendedor */}
        {(venta.cliente || venta.vendedor) && (
          <View style={[styles.section]}>
            {venta.cliente && (
              <View style={styles.row}>
                <Text style={styles.label}>Cliente:</Text>
                <Text style={styles.bold}>{venta.cliente.nombre} {venta.cliente.apellido}</Text>
              </View>
            )}
            {venta.vendedor && (
              <View style={styles.row}>
                <Text style={styles.label}>Vendedor:</Text>
                <Text>{venta.vendedor.nombre} {venta.vendedor.apellido}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.section}>
          {items.map((item, idx) => (
            <View key={idx} style={{ marginBottom: 4 }}>
              <Text style={styles.bold}>{item.producto.nombre}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>{item.cantidad} × {formatCurrency(item.precio_unitario)}</Text>
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
              <Text>- {formatCurrency(venta.descuento)}</Text>
            </View>
          )}
          {venta.interes_porcentaje > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Interés ({venta.interes_porcentaje}%)</Text>
              <Text>+ {formatCurrency(venta.interes_monto)}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(venta.total_final)}</Text>
        </View>

        {venta.cuotas > 1 && (
          <View style={[styles.row, { marginTop: 3 }]}>
            <Text style={styles.label}>{venta.cuotas} cuotas de</Text>
            <Text style={styles.bold}>{formatCurrency(cuotaMonto)}</Text>
          </View>
        )}

        {/* Pago */}
        <View style={[styles.divider, { marginTop: 6 }]} />
        <View style={styles.row}>
          <Text style={styles.label}>Forma de pago</Text>
          <Text style={styles.bold}>
            {METODO_LABEL[venta.metodo_pago]}
            {venta.tarjeta_tipo ? ` · ${TARJETA_LABEL[venta.tarjeta_tipo]}` : ''}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Text style={styles.footerText}>¡Gracias por su compra!</Text>
          <Text style={styles.footerText}>Centro Hogar — Tu mueblería de confianza</Text>
        </View>
      </Page>
    </Document>
  )
}
