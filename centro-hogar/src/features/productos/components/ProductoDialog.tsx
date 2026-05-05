import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { productosService } from '../services/productosService'
import { productoSchema, type ProductoFormValues } from '@/lib/validations/producto.schema'
import type { Producto } from '@/types/app.types'

interface ProductoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto | null
  onSuccess: () => void
}

export function ProductoDialog({ open, onOpenChange, producto, onSuccess }: ProductoDialogProps) {
  const isEditing = !!producto

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => productosService.listCategorias(),
  })

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema) as Resolver<ProductoFormValues>,
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      precio_costo: 0,
      precio_venta: 0,
      stock_actual: 0,
      stock_minimo: 0,
      categoria_id: null,
      activo: true,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        codigo: producto?.codigo ?? '',
        nombre: producto?.nombre ?? '',
        descripcion: producto?.descripcion ?? '',
        precio_costo: producto?.precio_costo ?? 0,
        precio_venta: producto?.precio_venta ?? 0,
        stock_actual: producto?.stock_actual ?? 0,
        stock_minimo: producto?.stock_minimo ?? 0,
        categoria_id: producto?.categoria_id ?? null,
        activo: producto?.activo ?? true,
      })
    }
  }, [open, producto, form])

  const mutation = useMutation({
    mutationFn: (values: ProductoFormValues) =>
      isEditing
        ? productosService.update(producto!.id, values)
        : productosService.create(values),
    onSuccess: () => {
      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado')
      onSuccess()
    },
    onError: (err: Error) => toast.error(err.message || 'Error al guardar el producto'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v: ProductoFormValues) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" {...form.register('codigo')} />
              {form.formState.errors.codigo && (
                <p className="text-xs text-destructive">{form.formState.errors.codigo.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={form.watch('categoria_id') ?? 'none'}
                onValueChange={(v) => form.setValue('categoria_id', v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {(categorias ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" {...form.register('nombre')} />
            {form.formState.errors.nombre && (
              <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" {...form.register('descripcion')} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="precio_costo">Precio costo *</Label>
              <Input id="precio_costo" type="number" step="0.01" min="0" {...form.register('precio_costo')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="precio_venta">Precio venta *</Label>
              <Input id="precio_venta" type="number" step="0.01" min="0" {...form.register('precio_venta')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock_actual">Stock actual</Label>
              <Input id="stock_actual" type="number" min="0" {...form.register('stock_actual')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock_minimo">Stock mínimo</Label>
              <Input id="stock_minimo" type="number" min="0" {...form.register('stock_minimo')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
