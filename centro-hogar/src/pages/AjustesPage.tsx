import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Download, Sheet, AlertTriangle, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type Column } from '@/components/common/DataTable'
import { productosService } from '@/features/productos/services/productosService'
import { downloadBackup, downloadBackupExcel, triggerDownload } from '@/features/backup/backupService'
import { adminService } from '@/features/admin/adminService'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { formatCurrency } from '@/lib/utils'
import type { Categoria } from '@/types/app.types'

// ─── Schemas ────────────────────────────────────────────────────────────────

const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(80),
  descripcion: z.string().max(200).optional(),
})
type CategoriaFormValues = z.infer<typeof categoriaSchema>

// ─── CategoriaDialog ─────────────────────────────────────────────────────────

function CategoriaDialog({
  open,
  onOpenChange,
  categoria,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  categoria: Categoria | null
  onSuccess: () => void
}) {
  const isEdit = !!categoria
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: categoria?.nombre ?? '',
      descripcion: categoria?.descripcion ?? '',
    },
  })

  React.useEffect(() => {
    reset({
      nombre: categoria?.nombre ?? '',
      descripcion: categoria?.descripcion ?? '',
    })
  }, [categoria, reset])

  const onSubmit = async (values: CategoriaFormValues) => {
    try {
      if (isEdit) {
        await productosService.updateCategoria(categoria.id, values)
        toast.success('Categoría actualizada')
      } else {
        await productosService.createCategoria(values.nombre, values.descripcion)
        toast.success('Categoría creada')
      }
      onSuccess()
    } catch (err) {
      toast.error('Error al guardar la categoría')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre')} placeholder="Ej: Dormitorio" />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea id="descripcion" {...register('descripcion')} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── CategoriasTab ───────────────────────────────────────────────────────────

function CategoriasTab() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: categorias, isLoading, isError, refetch } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => productosService.listCategorias(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productosService.deleteCategoria(id),
    onSuccess: () => {
      toast.success('Categoría eliminada')
      qc.invalidateQueries({ queryKey: ['categorias'] })
      setDeleteId(null)
    },
    onError: () => toast.error('No se pudo eliminar la categoría'),
  })

  const columns: Column<Categoria>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (c) => <span className="font-medium">{c.nombre}</span>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      cell: (c) =>
        c.descripcion ? (
          <span className="text-muted-foreground text-sm">{c.descripcion}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      cell: (c) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => { e.stopPropagation(); setEditing(c); setDialogOpen(true) }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); setDeleteId(c.id) }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {categorias?.length ?? 0} categorías registradas
        </p>
        <Button
          size="sm"
          onClick={() => { setEditing(null); setDialogOpen(true) }}
        >
          <Plus data-icon="inline-start" />
          Nueva categoría
        </Button>
      </div>

      {isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={categorias ?? []}
          isLoading={isLoading}
          rowKey={(c) => c.id}
          emptyMessage="No hay categorías registradas."
        />
      )}

      <CategoriaDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null) }}
        categoria={editing}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['categorias'] })
          setDialogOpen(false)
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Eliminar categoría"
        description="¿Estás seguro? Los productos asociados perderán su categoría."
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}

// ─── PurgeOldSalesSection ────────────────────────────────────────────────────
// Permite borrar ventas antiguas (default: > 2 años). venta_items se borran en
// cascada por la FK; movimientos_stock se preservan como historial.

function PurgeOldSalesSection() {
  const qc = useQueryClient()
  const [years, setYears] = useState<number>(2)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const previewQuery = useQuery({
    queryKey: ['admin-purge-preview', years],
    queryFn: () => adminService.previewPurgeOldSales(years),
    staleTime: 1000 * 30,
  })

  const purgeMutation = useMutation({
    mutationFn: (y: number) => adminService.purgeOldSales(y),
    onSuccess: (data) => {
      toast.success(`${data.deleted.toLocaleString('es-AR')} ventas eliminadas`)
      // Invalidar caches relacionadas con ventas / dashboard
      qc.invalidateQueries({ queryKey: ['ventas'] })
      qc.invalidateQueries({ queryKey: ['stats-hoy'] })
      qc.invalidateQueries({ queryKey: ['ventas-por-dia'] })
      qc.invalidateQueries({ queryKey: ['dashboard-data'] })
      qc.invalidateQueries({ queryKey: ['admin-purge-preview'] })
      setConfirmOpen(false)
      setConfirmText('')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar ventas')
    },
  })

  const preview     = previewQuery.data
  const isReady     = !!preview && preview.count > 0
  const fechaCorte  = preview?.fecha_corte ? preview.fecha_corte.slice(0, 10) : '—'
  const fechaAntigua = preview?.fecha_mas_antigua ? preview.fecha_mas_antigua.slice(0, 10) : '—'

  const busy = isExporting || purgeMutation.isPending
  const canConfirm = confirmText.trim().toUpperCase() === 'ELIMINAR' && !busy

  // Primero descarga la copia en Excel; sólo si eso sale OK, ejecuta el borrado.
  async function handleConfirmarEliminar() {
    setIsExporting(true)
    try {
      const { blob, filename } = await adminService.exportPurgeOldSales(years)
      triggerDownload(blob, filename ?? `ventas-eliminadas-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `No se pudo generar la copia: ${err.message}. No se eliminó nada.`
          : 'No se pudo generar la copia. No se eliminó nada.',
      )
      setIsExporting(false)
      return
    }
    setIsExporting(false)
    purgeMutation.mutate(years)
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          Limpieza de ventas antiguas
        </CardTitle>
        <CardDescription>
          Eliminá definitivamente las ventas más antiguas que el umbral elegido.
          Las líneas de cada venta se borran en cascada; el historial de movimientos
          de stock <span className="font-medium">no se toca</span>. Esta acción no se puede deshacer.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="purge-years">Antigüedad mínima</Label>
            <Select value={String(years)} onValueChange={(v) => setYears(Number(v))}>
              <SelectTrigger id="purge-years" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Más de 2 años</SelectItem>
                <SelectItem value="3">Más de 3 años</SelectItem>
                <SelectItem value="5">Más de 5 años</SelectItem>
                <SelectItem value="10">Más de 10 años</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => previewQuery.refetch()}
            disabled={previewQuery.isFetching}
          >
            {previewQuery.isFetching ? 'Calculando...' : 'Actualizar vista previa'}
          </Button>
        </div>

        {previewQuery.isError ? (
          <p className="text-sm text-destructive">
            {previewQuery.error instanceof Error ? previewQuery.error.message : 'Error al cargar la vista previa'}
          </p>
        ) : preview ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-md border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Ventas a eliminar</p>
              <p className="text-2xl font-bold tabular-nums">
                {preview.count.toLocaleString('es-AR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monto involucrado</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(preview.monto_total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rango</p>
              <p className="text-sm font-medium">
                {fechaAntigua} <span className="text-muted-foreground">a</span> {fechaCorte}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            disabled={!isReady}
            onClick={() => { setConfirmText(''); setConfirmOpen(true) }}
          >
            <Trash data-icon="inline-start" />
            Eliminar {preview?.count?.toLocaleString('es-AR') ?? '0'} ventas
          </Button>
          {!isReady && preview && (
            <span className="text-xs text-muted-foreground">No hay ventas anteriores a esa fecha.</span>
          )}
        </div>
      </CardContent>

      {/* Diálogo de confirmación con doble validación: hay que escribir "ELIMINAR" */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => { if (!busy) { setConfirmOpen(v); if (!v) setConfirmText('') } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Confirmar eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <p>
              Vas a eliminar <span className="font-bold">{preview?.count.toLocaleString('es-AR')} ventas</span>
              {' '}anteriores al <span className="font-bold">{fechaCorte}</span>
              {' '}por un total de <span className="font-bold">{formatCurrency(preview?.monto_total ?? 0)}</span>.
            </p>
            <p className="text-muted-foreground">
              Se descargará automáticamente una copia en Excel de estas ventas
              (con su detalle) y recién después se eliminarán. Esta operación no
              se puede deshacer.
            </p>
            <div className="flex flex-col gap-1.5 pt-2">
              <Label htmlFor="confirm-text">
                Para continuar, escribí <span className="font-mono font-bold">ELIMINAR</span>
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!canConfirm}
              onClick={handleConfirmarEliminar}
            >
              {isExporting
                ? 'Generando copia...'
                : purgeMutation.isPending
                  ? 'Eliminando...'
                  : 'Eliminar definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AjustesPage() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)

  const handleBackup = async () => {
    setIsDownloading(true)
    try {
      await downloadBackup()
      toast.success('Copia de seguridad descargada correctamente')
    } catch {
      toast.error('Error al generar la copia de seguridad')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleBackupExcel = async () => {
    setIsDownloadingExcel(true)
    try {
      await downloadBackupExcel()
      toast.success('Backup Excel descargado correctamente')
    } catch {
      toast.error('Error al generar el backup Excel')
    } finally {
      setIsDownloadingExcel(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ajustes"
        description="Administrá las categorías de productos y generá copias de seguridad"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestión de categorías</CardTitle>
          <CardDescription>
            Organizá tus productos por categoría para facilitar la búsqueda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriasTab />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Copia de seguridad</CardTitle>
          <CardDescription>
            Descargá todos los datos del sistema en CSV comprimido (ZIP) o en Excel (.xlsx).
            Incluye ventas, clientes, productos, stock y más.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              El archivo Excel contiene una hoja por cada tabla, con columnas de ancho
              automático y encabezados resaltados.
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={handleBackup} disabled={isDownloading} variant="outline">
                <Download data-icon="inline-start" />
                {isDownloading ? 'Generando...' : 'Backup CSV (ZIP)'}
              </Button>
              <Button onClick={handleBackupExcel} disabled={isDownloadingExcel}>
                <Sheet data-icon="inline-start" />
                {isDownloadingExcel ? 'Generando...' : 'Backup Excel'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PurgeOldSalesSection />
    </div>
  )
}
