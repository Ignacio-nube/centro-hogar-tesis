import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Download, RefreshCw, Link2, Sheet } from 'lucide-react'
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
import { downloadBackup, downloadBackupExcel } from '@/features/backup/backupService'
import { googleSheetsService } from '@/features/integraciones/services/googleSheetsService'
import { QueryErrorState } from '@/components/ui/query-error-state'
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AjustesPage() {
  const qc = useQueryClient()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false)
  const [spreadsheetInput, setSpreadsheetInput] = useState('')

  const { data: sheetsSettings, isLoading: loadingSheetsSettings } = useQuery({
    queryKey: ['google-sheets-settings'],
    queryFn: () => googleSheetsService.getSettings(),
  })

  React.useEffect(() => {
    if (sheetsSettings) {
      setSpreadsheetInput(sheetsSettings.spreadsheetId)
    }
  }, [sheetsSettings?.spreadsheetId])

  const saveSheetsMutation = useMutation({
    mutationFn: () => googleSheetsService.setSpreadsheetId(spreadsheetInput),
    onSuccess: () => {
      toast.success('Vinculación de Google Sheets guardada')
      qc.invalidateQueries({ queryKey: ['google-sheets-settings'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo guardar la vinculación')
    },
  })

  const syncSheetsMutation = useMutation({
    mutationFn: () => googleSheetsService.syncNow(),
    onSuccess: (result) => {
      toast.success(`Sincronización completa: ${result.summary.sheets} hojas, ${result.summary.rows} filas`)
      qc.invalidateQueries({ queryKey: ['google-sheets-settings'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo sincronizar con Google Sheets')
    },
  })

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
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Incluye clientes, productos, categorías, ventas, ítems, usuarios, movimientos y tablas auxiliares.
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sincronización Google Sheets</CardTitle>
          <CardDescription>
            Sincronización unidireccional manual (solo admin). Cada ejecución reemplaza completamente las hojas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="spreadsheetId">URL o Spreadsheet ID</Label>
            <Input
              id="spreadsheetId"
              value={spreadsheetInput}
              onChange={(e) => setSpreadsheetInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              disabled={loadingSheetsSettings || saveSheetsMutation.isPending || syncSheetsMutation.isPending}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => saveSheetsMutation.mutate()}
              disabled={!spreadsheetInput.trim() || saveSheetsMutation.isPending || syncSheetsMutation.isPending}
            >
              <Link2 data-icon="inline-start" />
              {saveSheetsMutation.isPending ? 'Guardando...' : 'Guardar vinculación'}
            </Button>
            <Button
              type="button"
              onClick={() => syncSheetsMutation.mutate()}
              disabled={!spreadsheetInput.trim() || syncSheetsMutation.isPending || saveSheetsMutation.isPending}
            >
              <RefreshCw data-icon="inline-start" className={syncSheetsMutation.isPending ? 'animate-spin' : ''} />
              {syncSheetsMutation.isPending ? 'Sincronizando...' : 'Sincronizar ahora'}
            </Button>
          </div>

          {sheetsSettings && (
            <p className="text-sm text-muted-foreground">
              Última sincronización: {sheetsSettings.lastSyncAt ?? 'nunca'}
              {sheetsSettings.lastSyncStatus ? ` · ${sheetsSettings.lastSyncStatus.toUpperCase()}` : ''}
              {sheetsSettings.lastSyncMessage ? ` · ${sheetsSettings.lastSyncMessage}` : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
