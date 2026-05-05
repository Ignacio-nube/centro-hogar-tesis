import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, UserPlus, ChevronRight, UserX, AlertTriangle, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { clientesService } from '@/features/clientes/services/clientesService'
import { ClienteDialog } from '@/features/clientes/components/ClienteDialog'
import { useQueryClient } from '@tanstack/react-query'
import type { Cliente } from '@/types/app.types'

interface Step1Props {
  selectedCliente: Cliente | null
  onSelect: (cliente: Cliente) => void
  onSkip: () => void
}

export function Step1ClienteSelect({ onSelect, onSkip }: Step1Props) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [newClienteOpen, setNewClienteOpen] = useState(false)

  const { data: clientes, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientes-search', search],
    queryFn: () =>
      search.length >= 2
        ? clientesService.search(search)
        : clientesService.list({ pageSize: 8 }).then((r) => r.data),
    enabled: true,
  })

  const handleNewCliente = useCallback(
    (cliente?: Cliente) => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      if (cliente) onSelect(cliente)
    },
    [qc, onSelect]
  )

  const isSearching = search.length >= 2

  return (
    <div className="flex gap-6 w-full">
      {/* Left: search + list (~65%) */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, DNI..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* List label */}
        <p className="text-xs uppercase tracking-wide text-muted-foreground -mb-2">
          {isSearching ? 'Resultados' : 'Clientes recientes'}
        </p>

        {/* Client list */}
        {isLoading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="size-7 text-destructive opacity-70" />
            <p className="text-sm text-muted-foreground">No se pudo cargar los clientes.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5 mr-1.5" />
              Reintentar
            </Button>
          </div>
        ) : (clientes ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
            <UserX className="size-8 opacity-40" />
            <p className="text-sm font-medium">No se encontró ningún cliente</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-brand text-brand hover:bg-brand-muted"
              onClick={() => setNewClienteOpen(true)}
            >
              <UserPlus className="size-4 mr-1.5" />
              Crear cliente nuevo
            </Button>
          </div>
        ) : (
          <div className="flex flex-col rounded-xl border border-zinc-100 overflow-hidden bg-white">
            {(clientes ?? []).map((c) => {
              const initials = `${c.nombre[0] ?? ''}${c.apellido[0] ?? ''}`.toUpperCase()
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c)}
                  className="flex items-center gap-3 py-3 px-3 hover:bg-zinc-50 text-left transition-colors border-b border-zinc-100 last:border-0 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-muted text-brand text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-sm">
                      {c.nombre} {c.apellido}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {[c.dni, c.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: quick actions (~35%) */}
      <div className="w-64 shrink-0">
        <div className="bg-zinc-50 rounded-2xl p-5 flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-brand text-brand hover:bg-brand-muted hover:text-brand"
            onClick={() => setNewClienteOpen(true)}
          >
            <UserPlus className="size-4 mr-2" />
            Nuevo cliente
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full h-11 text-muted-foreground"
            onClick={onSkip}
          >
            Continuar sin cliente
          </Button>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Al continuar sin cliente la venta se registra como anónima
          </p>
        </div>
      </div>

      <ClienteDialog
        open={newClienteOpen}
        onOpenChange={setNewClienteOpen}
        cliente={null}
        onSuccess={() => {
          setNewClienteOpen(false)
          handleNewCliente()
        }}
      />
    </div>
  )
}
