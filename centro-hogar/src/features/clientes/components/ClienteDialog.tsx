import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
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
import { clientesService } from '../services/clientesService'
import { clienteSchema, type ClienteFormValues } from '@/lib/validations/cliente.schema'
import type { Cliente } from '@/types/app.types'

interface ClienteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  onSuccess: () => void
}

export function ClienteDialog({ open, onOpenChange, cliente, onSuccess }: ClienteDialogProps) {
  const isEditing = !!cliente

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: cliente?.nombre ?? '',
      apellido: cliente?.apellido ?? '',
      dni: cliente?.dni ?? '',
      telefono: cliente?.telefono ?? '',
      email: cliente?.email ?? '',
      direccion: cliente?.direccion ?? '',
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        nombre: cliente?.nombre ?? '',
        apellido: cliente?.apellido ?? '',
        dni: cliente?.dni ?? '',
        telefono: cliente?.telefono ?? '',
        email: cliente?.email ?? '',
        direccion: cliente?.direccion ?? '',
      })
    }
  }, [open, cliente, form])

  const mutation = useMutation({
    mutationFn: (values: ClienteFormValues) =>
      isEditing
        ? clientesService.update(cliente!.id, values)
        : clientesService.create(values),
    onSuccess: () => {
      toast.success(isEditing ? 'Cliente actualizado' : 'Cliente creado')
      onSuccess()
    },
    onError: () => toast.error('Ocurrió un error al guardar el cliente'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...form.register('nombre')} />
              {form.formState.errors.nombre && (
                <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input id="apellido" {...form.register('apellido')} />
              {form.formState.errors.apellido && (
                <p className="text-xs text-destructive">{form.formState.errors.apellido.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dni">DNI</Label>
              <Input id="dni" {...form.register('dni')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...form.register('telefono')} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...form.register('direccion')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
