import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Minus, Trash2, ShoppingCart, AlertTriangle, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { productosService } from '@/features/productos/services/productosService'
import { formatCurrency, cn } from '@/lib/utils'
import type { CartItem, Producto } from '@/types/app.types'

interface Step2Props {
  items: CartItem[]
  onAddItem: (item: CartItem) => void
  onUpdateQty: (productoId: string, cantidad: number) => void
  onRemoveItem: (productoId: string) => void
  onBack: () => void
  onNext: () => void
  subtotal: number
}

export function Step2CartBuilder({
  items,
  onAddItem,
  onUpdateQty,
  onRemoveItem,
  onBack,
  onNext,
  subtotal,
}: Step2Props) {
  const [search, setSearch] = useState('')

  const { data: productos, isLoading, isError, refetch } = useQuery({
    queryKey: ['productos-search', search],
    queryFn: () =>
      productosService.list({ search, soloActivos: true, conStock: true, pageSize: 8 }).then((r) => r.data),
  })

  function handleAdd(producto: Producto) {
    const existing = getCartItem(producto.id)
    if (existing) {
      onUpdateQty(producto.id, existing.cantidad + 1)
    } else {
      onAddItem({
        producto,
        cantidad: 1,
        precio_unitario: producto.precio_venta,
        subtotal: producto.precio_venta,
      })
    }
  }

  const isInCart = (productoId: string) => items.some((i) => i.producto.id === productoId)
  const getCartItem = (productoId: string) => items.find((i) => i.producto.id === productoId)

  return (
    <div className="flex gap-6 w-full items-start">
      {/* Left: product catalog */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Catalog label */}
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Catálogo de productos</p>

        {/* Product list */}
        <div className="flex flex-col rounded-xl border border-zinc-100 overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex flex-col gap-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="size-7 text-destructive opacity-70" />
              <p className="text-sm text-muted-foreground">No se pudo cargar los productos.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="size-3.5 mr-1.5" />
                Reintentar
              </Button>
            </div>
          ) : (
            (productos ?? []).map((p) => {
              const cartItem = getCartItem(p.id)
              const stockAgotado = p.stock_actual <= 0
              const limiteAlcanzado = (cartItem?.cantidad ?? 0) >= p.stock_actual

              // Stock display level
              const stockDisplay =
                p.stock_actual === 0 ? (
                  <span className="text-xs text-red-500 font-medium">Sin stock</span>
                ) : p.stock_actual <= 3 ? (
                  <span className="text-xs text-amber-600 font-medium">Stock: {p.stock_actual}</span>
                ) : (
                  <span className="text-xs text-zinc-400">Stock: {p.stock_actual}</span>
                )

              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 py-3 px-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors',
                    stockAgotado && 'opacity-50 pointer-events-none',
                  )}
                >
                  {/* Code */}
                  <span className="font-mono text-xs text-zinc-400 w-16 shrink-0 truncate">
                    {p.codigo}
                  </span>

                  {/* Name */}
                  <span className="font-medium text-sm flex-1 min-w-0 truncate">{p.nombre}</span>

                  {/* Stock */}
                  <span className="shrink-0">{stockDisplay}</span>

                  {/* Price */}
                  <span className="font-semibold text-sm tabular-nums shrink-0 w-24 text-right">
                    {formatCurrency(p.precio_venta)}
                  </span>

                  {/* Add / Qty controls */}
                  {isInCart(p.id) ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className="h-7 w-7 rounded-md border border-zinc-200 flex items-center justify-center hover:border-zinc-400 transition-colors"
                        onClick={() => {
                          const item = getCartItem(p.id)!
                          if (item.cantidad <= 1) onRemoveItem(p.id)
                          else onUpdateQty(p.id, item.cantidad - 1)
                        }}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-brand">
                        {cartItem?.cantidad ?? 0}
                      </span>
                      <button
                        type="button"
                        className={cn(
                          'h-7 w-7 rounded-md border flex items-center justify-center transition-colors',
                          limiteAlcanzado
                            ? 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                            : 'border-zinc-200 hover:border-zinc-400',
                        )}
                        disabled={limiteAlcanzado}
                        onClick={() => handleAdd(p)}
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full border-2 border-brand text-brand hover:bg-brand hover:text-white transition-colors flex items-center justify-center shrink-0"
                      disabled={stockAgotado}
                      onClick={() => handleAdd(p)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right: cart panel */}
      <div className="flex flex-col gap-3 w-80 shrink-0">
        {/* Cart header */}
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-zinc-600" />
          <span className="font-semibold">Carrito</span>
          {items.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-brand text-white text-xs font-bold px-2 py-0.5 min-w-[1.25rem]">
              {items.length}
            </span>
          )}
        </div>

        {/* Cart items or empty state */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-100 py-10 text-center">
            <ShoppingCart className="size-8 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">Carrito vacío</p>
            <p className="text-xs text-muted-foreground">Agregá productos desde la lista</p>
          </div>
        ) : (
          <div className="flex flex-col rounded-xl border border-zinc-100 overflow-hidden bg-white">
            {items.map((item) => {
              const atLimit = item.cantidad >= item.producto.stock_actual
              return (
                <div
                  key={item.producto.id}
                  className="flex flex-col px-3 py-3 border-b border-zinc-100 last:border-0"
                >
                  {/* Name */}
                  <p className="text-sm font-medium leading-snug">{item.producto.nombre}</p>
                  {/* Controls row */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground flex-1">
                      {formatCurrency(item.precio_unitario)} c/u
                    </span>
                    {/* Qty controls */}
                    <button
                      type="button"
                      className="h-7 w-7 rounded-md border border-zinc-200 flex items-center justify-center hover:border-zinc-400 transition-colors shrink-0"
                      onClick={() => onUpdateQty(item.producto.id, item.cantidad - 1)}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-brand">{item.cantidad}</span>
                    <button
                      type="button"
                      className={cn(
                        'h-7 w-7 rounded-md border flex items-center justify-center transition-colors shrink-0',
                        atLimit
                          ? 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                          : 'border-zinc-200 hover:border-zinc-400',
                      )}
                      disabled={atLimit}
                      onClick={() => onUpdateQty(item.producto.id, item.cantidad + 1)}
                    >
                      <Plus className="size-3" />
                    </button>
                    {/* Subtotal */}
                    <span className="text-sm font-semibold tabular-nums w-20 text-right shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                    {/* Delete */}
                    <button
                      type="button"
                      className="shrink-0 p-1"
                      onClick={() => onRemoveItem(item.producto.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-zinc-300 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Subtotal */}
        <div className="border-t border-zinc-200 pt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Subtotal</span>
          <span className="text-xl font-bold tabular-nums">{formatCurrency(subtotal)}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" className="w-full h-11" onClick={onBack}>
            Atrás
          </Button>
          <Button
            type="button"
            className="w-full h-11 bg-brand hover:bg-brand-dark font-semibold text-white disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
            disabled={items.length === 0}
            onClick={onNext}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
