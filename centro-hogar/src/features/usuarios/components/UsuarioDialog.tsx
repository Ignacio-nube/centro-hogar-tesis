import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { TriangleAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { authService } from '@/features/auth/services/authService'
import type { Profile, Rol } from '@/types/app.types'

const editSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  rol: z.enum(['admin', 'encargado_stock', 'vendedor']),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  password: z.union([z.string().min(6, 'Mínimo 6 caracteres'), z.literal('')]).optional(),
})

const createSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  rol: z.enum(['admin', 'encargado_stock', 'vendedor']),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormValues = {
  nombre: string
  apellido: string
  rol: Rol
  email: string
  password: string
}

interface UsuarioDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  usuario: Profile | null
  onSuccess: () => void
}

export function UsuarioDialog({ open, onOpenChange, usuario, onSuccess }: UsuarioDialogProps) {
  // Capture isEditing at open time only — prevents flash during close animation
  const [isEditing, setIsEditing] = useState(!!usuario)
  const [warnOpen, setWarnOpen] = useState(false)
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)

  useEffect(() => {
    if (open) setIsEditing(!!usuario)
  }, [open, usuario])

  const form = useForm<FormValues>({
    resolver: zodResolver(isEditing ? editSchema : createSchema) as any,
    defaultValues: {
      nombre: '',
      apellido: '',
      rol: 'vendedor' as Rol,
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        nombre: usuario?.nombre ?? '',
        apellido: usuario?.apellido ?? '',
        rol: (usuario?.rol ?? 'vendedor') as Rol,
        email: usuario?.email ?? '',
        password: '',
      })
    }
  }, [open, usuario, form])

  const mutation = useMutation({
    mutationFn: async (values: FormValues): Promise<void> => {
      if (isEditing) {
        const userId = String(usuario!.id)
        await authService.updateProfile(userId, {
          nombre: values.nombre,
          apellido: values.apellido,
          rol: values.rol,
        })
        if (values.email && values.email !== usuario?.email) {
          await authService.changeEmail(userId, values.email)
        }
        if (values.password) {
          await authService.changePassword(userId, values.password)
        }
      } else {
        await authService.createUser(values.email, values.password, {
          nombre: values.nombre,
          apellido: values.apellido,
          rol: values.rol,
        })
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Usuario actualizado' : 'Usuario creado')
      onSuccess()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(values: FormValues) {
    if (isEditing) {
      const emailChanged = values.email !== '' && values.email !== usuario?.email
      const passwordChanged = values.password !== ''
      if (emailChanged || passwordChanged) {
        setPendingValues(values)
        setWarnOpen(true)
        return
      }
    }
    mutation.mutate(values)
  }

  function buildWarnDescription() {
    if (!pendingValues) return ''
    const emailChanged = pendingValues.email !== '' && pendingValues.email !== usuario?.email
    const passwordChanged = pendingValues.password !== ''
    if (emailChanged && passwordChanged) {
      return 'Se modificará el correo electrónico y la contraseña de acceso. El usuario deberá usar las nuevas credenciales para iniciar sesión.'
    }
    if (emailChanged) {
      return 'Se modificará el correo electrónico de acceso. El usuario deberá iniciar sesión con el nuevo correo.'
    }
    return 'Se modificará la contraseña de acceso del usuario.'
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Nombre *</Label>
                <Input {...form.register('nombre')} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Apellido *</Label>
                <Input {...form.register('apellido')} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Rol</Label>
              <Select
                value={form.watch('rol')}
                onValueChange={(v) => form.setValue('rol', v as Rol)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="encargado_stock">Encargado de Stock</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email: required on create, editable on edit */}
            <div className="flex flex-col gap-2">
              <Label>Email {!isEditing && '*'}</Label>
              <Input
                type="email"
                {...form.register('email')}
                placeholder={isEditing ? 'Dejar igual para no cambiar' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {(form.formState.errors.email as any).message}
                </p>
              )}
            </div>

            {/* Password: required on create, optional on edit */}
            <div className="flex flex-col gap-2">
              <Label>{isEditing ? 'Nueva contraseña' : 'Contraseña *'}</Label>
              <Input
                type="password"
                placeholder={isEditing ? 'Dejar en blanco para no cambiar' : ''}
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {(form.formState.errors.password as any).message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Warning dialog for credential changes */}
      <AlertDialog open={warnOpen} onOpenChange={setWarnOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-amber-500" />
              Confirmar cambio de credenciales
            </AlertDialogTitle>
            <AlertDialogDescription>
              {buildWarnDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWarnOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setWarnOpen(false)
                if (pendingValues) mutation.mutate(pendingValues)
              }}
            >
              Confirmar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
