import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QueryErrorStateProps {
  /** Message shown under the icon. Defaults to a generic message. */
  message?: string
  /** Callback for the "Reintentar" button. If omitted the button is not rendered. */
  onRetry?: () => void
  className?: string
}

/**
 * Full-area error state for failed useQuery calls.
 * Drop this in place of the normal content when `isError` is true.
 */
export function QueryErrorState({
  message = 'No se pudieron cargar los datos. Verifica tu conexión e intenta de nuevo.',
  onRetry,
  className,
}: QueryErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center ${className ?? ''}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-destructive">Error al cargar</p>
        <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  )
}
