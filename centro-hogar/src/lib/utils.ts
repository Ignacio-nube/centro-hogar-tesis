import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: es })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es })
}

export function calcularTotalConInteres(
  subtotal: number,
  descuento: number,
  interestPct: number
): { base: number; interesMonto: number; totalFinal: number } {
  const base = subtotal - descuento
  const interesMonto = base * (interestPct / 100)
  const totalFinal = base + interesMonto
  return { base, interesMonto, totalFinal }
}

export function cuotaMonto(totalFinal: number, cuotas: number): number {
  if (cuotas <= 0) return totalFinal
  return totalFinal / cuotas
}
