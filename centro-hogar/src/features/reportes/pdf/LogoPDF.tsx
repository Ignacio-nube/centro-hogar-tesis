import { Svg, Path } from '@react-pdf/renderer'

interface LogoPDFProps {
  size?: number
}

/**
 * Logo Centro Hogar adaptado a primitivas Svg de @react-pdf/renderer.
 * @react-pdf no permite renderizar archivos .svg vía <Image>, así que recreamos
 * los paths principales del logo (techo, base de la casa, balaústres).
 */
export function LogoPDF({ size = 36 }: LogoPDFProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 250 250">
      {/* Techo principal */}
      <Path
        d="m124.7 23.76-116.1 75.06 8.38 15.09 107.7-68.8 108.2 68.8 8.38-15.09-46.84-29.67v-30.36h-21.2v16.65l-48.49-31.68z"
        fill="#E97118"
        stroke="#924919"
        strokeWidth={0.5}
      />
      {/* Sombra del techo (mitad derecha) */}
      <Path
        d="m124.7 24.34 0.09 21.06 108.1 67.92 7.8-14.11-46.55-29.77v-30.56h-20.62v16.94l-48.78-31.48z"
        fill="#B54612"
        stroke="#8E3D10"
        strokeWidth={0.5}
      />
      {/* Base derecha */}
      <Path
        d="m129.9 110c-3.96 3.88-2.94 6.85-2.94 17.6v34h58.03c5.67 0 10.28 4.35 10.28 4.35v-13.42c0-11.1 8.43-20.79 17.92-20.79v-7.73c0-9.69-7.12-16.27-14.9-16.27h-55.63c-5.06 0-9.18-1.21-12.76 2.26z"
        fill="#B54612"
        stroke="#924919"
        strokeWidth={0.5}
      />
      {/* Base izquierda */}
      <Path
        d="m122 123v38.6h-57.2c-5.99 0-11.65 4.64-11.65 4.64v-14c0-9.99-8.52-20.4-18.01-21.33v-7.91c0-9.7 7.12-15.26 14.9-15.26h56.86c8.97 0 15.1 7.76 15.1 15.26z"
        fill="#E97118"
        stroke="#924919"
        strokeWidth={0.5}
      />
      {/* Estructura inferior */}
      <Path
        d="m219.1 136.2c-10.18 0-16.93 9.69-16.93 16.23v39.6h-154.5v-40.27c0-8.45-8.09-15.85-17.56-15.85-10.08 0-16.54 8.92-16.54 17.47 0 9.92 8.7 16.25 17.18 16.65v53.75h17.89l7.53-14.8h136.8l7.83 14.8h17.19v-54.04c9.77-1.01 17.9-7.88 17.9-16.81 0-9.42-7.93-16.73-16.77-16.73z"
        fill="#E97118"
        stroke="#924919"
        strokeWidth={0.5}
      />
      {/* Sombra estructura inferior derecha */}
      <Path
        d="m124.5 192.7v15.7h68.42l7.83 15.38h17.19v-54.04c9.77-1.01 17.9-7.88 17.9-16.81 0-9.42-7.93-16.73-16.77-16.73-10.18 0-16.93 9.69-16.93 16.23v39.3l-77.64 0.97z"
        fill="#B54612"
        stroke="#924919"
        strokeWidth={0.5}
      />
      {/* Ventanas / balaústres */}
      <Path d="m122.1 67.29h-10.7v11.37h10.7v-11.37z" fill="#E97118" stroke="#924919" strokeWidth={0.5} />
      <Path d="m137.6 67.29h-10.93v11.37h10.93v-11.37z" fill="#A23F11" stroke="#883A10" strokeWidth={0.5} />
      <Path d="m122.1 83.93h-10.7v10.6h10.7v-10.6z" fill="#E97118" stroke="#924919" strokeWidth={0.5} />
      <Path d="m137.6 83.93h-10.93v10.6h10.93v-10.6z" fill="#A23F11" stroke="#883A10" strokeWidth={0.5} />
      {/* Banda inferior (puerta/zócalo) */}
      <Path
        d="m65.25 167.1h119c7.83 0 10.96 6.17 10.96 11.22v8.12h-141.4v-7.54c0-6.85 4.86-11.8 11.41-11.8z"
        fill="#E97118"
        stroke="#924919"
        strokeWidth={0.5}
      />
      <Path
        d="m124.5 167.6v18.35h70.77v-8.12c0-5.05-4.15-10.23-10.7-10.23h-60.07z"
        fill="#B54612"
        stroke="#924919"
        strokeWidth={0.5}
      />
    </Svg>
  )
}
