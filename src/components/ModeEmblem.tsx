// Emblema de cada modo: una forma dibujada a mano que cuenta de qué va.
//
// POR QUÉ NO ALCANZABA CON UN ÍCONO: los siete modos usaban un lucide
// genérico del mismo celeste, así que el selector era una lista de tarjetas
// idénticas donde lo único distinto era el texto. Elegir modo es el momento
// en que alguien decide a qué van a jugar: tiene que verse la diferencia
// antes de leerla.
//
// Cada emblema es geometría propia -dos cartas apiladas, un planeta con su
// anillo, un tablero con peones- sobre una pastilla con el color del modo.
//
// SOBRE EL COLOR: es una paleta CATEGÓRICA, no semántica. Los siete tonos
// solo tienen que distinguirse entre sí, como los colores de peón del
// tablero. Vive acotada al emblema: la tarjeta sigue siendo superficie clay
// y el texto sigue siendo tinta, así que el acento único del sistema no se
// diluye en un arcoíris. Y el color nunca es el único canal: el nombre, la
// descripción y la forma dicen lo mismo.
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import './ModeEmblem.css';

/** Formas por slug.
 *
 *  `currentColor` es la tinta oscura del modo. Los detalles que van ENCIMA de
 *  una forma ya rellena llevan `className="cut"`: se pintan con el color
 *  claro del modo y leen como hueco. Sin eso quedaban tinta sobre tinta y
 *  desaparecían — que es lo que le pasaba a la letra de la carta y a la
 *  pantalla del celular.
 *
 *  La opacidad hace los planos de atrás, que sí contrastan contra el relleno
 *  de la pastilla. */
const FORMAS: Record<string, ReactNode> = {
  // Dos cartas apiladas: la de atrás girada, la de adelante con su letra.
  clasico: (
    <>
      <rect x="5" y="13" width="20" height="27" rx="5" opacity="0.45" transform="rotate(-15 15 26)" />
      <rect x="19" y="8" width="23" height="32" rx="6" />
      <circle className="cut" cx="30.5" cy="19" r="5" />
      <rect className="cut" x="24" y="28" width="13" height="3.2" rx="1.6" />
      <rect className="cut" x="24" y="33.5" width="8.5" height="3.2" rx="1.6" opacity="0.7" />
    </>
  ),
  // Planeta con anillo y un astro chico al costado.
  orbita: (
    <>
      <ellipse
        cx="24" cy="24" rx="19" ry="7.5"
        fill="none" stroke="currentColor" strokeWidth="3.2"
        opacity="0.5" transform="rotate(-22 24 24)"
      />
      <circle cx="24" cy="24" r="9.5" />
      <circle cx="38.5" cy="11.5" r="3.2" opacity="0.7" />
    </>
  ),
  // El perímetro del tablero con tres peones en distintas casillas.
  '1000-nombres': (
    <>
      <rect
        x="6" y="6" width="36" height="36" rx="10"
        fill="none" stroke="currentColor" strokeWidth="3.5" opacity="0.45"
      />
      <circle cx="16" cy="6" r="4.6" />
      <circle cx="42" cy="27" r="4.6" opacity="0.75" />
      <circle cx="27" cy="42" r="4.6" opacity="0.55" />
    </>
  ),
  // Calendario con el día de hoy marcado.
  'palabra-diaria': (
    <>
      <rect x="6" y="11" width="36" height="31" rx="6.5" />
      <rect className="cut" x="11" y="22" width="26" height="15" rx="3" opacity="0.5" />
      <rect x="13.5" y="4" width="5" height="10" rx="2.5" />
      <rect x="29.5" y="4" width="5" height="10" rx="2.5" />
      <circle className="cut" cx="24" cy="29.5" r="4.4" />
    </>
  ),
  // El lazo, de un solo trazo.
  infinito: (
    <path
      d="M24 24s-3.8-8-9.4-8a8 8 0 100 16c5.6 0 9.4-8 9.4-8zm0 0s3.8-8 9.4-8a8 8 0 110 16c-5.6 0-9.4-8-9.4-8z"
      fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
    />
  ),
  // Dos celulares: cada uno con el suyo.
  multijugador: (
    <>
      <rect x="5" y="12" width="17" height="29" rx="4.5" opacity="0.45" transform="rotate(-11 13 26)" />
      <rect x="24" y="7" width="19" height="34" rx="5.5" />
      <rect className="cut" x="28" y="13" width="11" height="3" rx="1.5" />
      <circle className="cut" cx="33.5" cy="24" r="4.5" opacity="0.75" />
    </>
  ),
  // Cronómetro con la aguja corriendo.
  contrarreloj: (
    <>
      <circle cx="24" cy="28" r="14" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="19.5" y="3.5" width="9" height="5" rx="2.5" />
      <rect x="21.5" y="8" width="5" height="4.5" />
      <path
        d="M24 20v8l6 4"
        fill="none" stroke="currentColor" strokeWidth="4"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </>
  ),
};

interface Props {
  /** Slug del modo. Si no hay forma propia, cae al ícono de la capa de datos. */
  slug: string;
  /** Nombre del ícono lucide, como respaldo para modos que vengan de Cerebro. */
  icono?: string;
  /** `card` en el selector, `chip` en la tira de "en camino". */
  size?: 'card' | 'chip';
  className?: string;
}

export function ModeEmblem({ slug, icono, size = 'card', className = '' }: Props) {
  const forma = FORMAS[slug];
  return (
    <span
      className={`emblem emblem--${size} modo-${slug} ${className}`}
      aria-hidden="true"
    >
      {forma ? (
        <svg viewBox="0 0 48 48" fill="currentColor" focusable="false">
          {forma}
        </svg>
      ) : (
        <Icon name={icono} size="70%" />
      )}
    </span>
  );
}
