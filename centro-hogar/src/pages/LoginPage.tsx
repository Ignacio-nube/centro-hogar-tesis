import React, { useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast.error('No se pudo iniciar sesión', {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logo.svg" alt="Centro Hogar" className="size-16" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Centro Hogar</h1>
            <p className="text-sm text-muted-foreground">Panel de gestión interno</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Iniciar sesión</CardTitle>
            <CardDescription>Ingresá con tu cuenta del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@centrhogar.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Recuperar acceso</DialogTitle>
            <DialogDescription className="leading-relaxed pt-1">
              Por seguridad, el restablecimiento de contraseña lo realiza un
              administrador. Pedí a un administrador del sistema que restablezca
              tu contraseña desde la sección <span className="font-medium">Usuarios</span> y te
              entregue una contraseña temporal.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setForgotOpen(false)} className="w-full">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
