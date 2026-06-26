import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { KeyRound } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/features/auth/services/authService'
import type { Profile } from '@/types/app.types'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmá la contraseña'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  usuario: Profile | null
}

export function ResetPasswordDialog({ open, onOpenChange, usuario }: ResetPasswordDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (open) form.reset({ newPassword: '', confirmPassword: '' })
  }, [open, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      authService.changePassword(String(usuario!.id), values.newPassword),
    onSuccess: () => {
      toast.success('Contraseña restablecida')
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-brand" />
            Restablecer contraseña
          </DialogTitle>
          <DialogDescription>
            {usuario
              ? `Definí una contraseña temporal para ${usuario.nombre} ${usuario.apellido}. El usuario podrá cambiarla luego desde sus ajustes.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label>Nueva contraseña</Label>
            <Input type="password" autoComplete="new-password" {...form.register('newPassword')} />
            {form.formState.errors.newPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Confirmar contraseña</Label>
            <Input type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Restablecer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
