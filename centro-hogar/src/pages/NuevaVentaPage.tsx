import { PageHeader } from '@/components/common/PageHeader'
import { SaleWizard } from '@/features/ventas/components/SaleWizard'

export default function NuevaVentaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nueva venta"
        description="Registrá una nueva venta paso a paso."
      />
      <SaleWizard />
    </div>
  )
}
