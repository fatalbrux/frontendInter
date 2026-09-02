import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
/*
/**
 * Animación única para modales (fondo + tarjeta juntos en un solo trigger).
 * Se pone SOLO en el elemento raíz que controla el *ngIf/@if (el del fondo oscuro).
 * La tarjeta de adentro no necesita su propio trigger — se anima vía query()
 * buscando la clase "modal-panel".
 */
export const modalAnimation = trigger('modalAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    query('.modal-panel', [
      style({ opacity: 0, transform: 'scale(0.96) translateY(4px)' }),
    ], { optional: true }),
    animate('150ms ease-out', style({ opacity: 1 })),
    query('.modal-panel', [
      animate('180ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
    ], { optional: true }),
  ]),
  transition(':leave', [
    query('.modal-panel', [
      animate('120ms ease-in', style({ opacity: 0, transform: 'scale(0.97)' })),
    ], { optional: true }),
    animate('120ms ease-in', style({ opacity: 0 })),
  ]),
]);



/** Contenido de una pestaña: fade + leve deslizamiento al aparecer (para pestañas con *ngIf/@if). */
export const tabContent = trigger('tabContent', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(4px)' }),
    animate('160ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

/** Notificación/toast: entra deslizando, sale con fade. */
export const toastSlide = trigger('toastSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-12px)' }),
    animate('200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' })),
  ]),
]);

/**
 * Transición entre páginas completas (cambiar de /admin/clientes a /admin/planes, etc.).
 * Solo anima la ENTRADA de la página nueva (fade + leve deslizamiento), sin animar
 * la salida de la anterior, para evitar saltos de layout con páginas de alturas distintas.
 */
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(6px)' }),
      animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
    ], { optional: true }),
  ]),
]);

/** Lista de elementos (filas, tarjetas) apareciendo con un pequeño desfase entre ellos. */
export const listStagger = trigger('listStagger', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(6px)' }),
      stagger(40, animate('160ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))),
    ], { optional: true }),
  ]),
]);