import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

/** Fondo oscuro semitransparente detrás de un modal (fade simple). */
export const fadeBackdrop = trigger('fadeBackdrop', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('150ms ease-out', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    animate('120ms ease-in', style({ opacity: 0 })),
  ]),
]);

/** La tarjeta/panel de un modal: aparece con un leve zoom + fade. */
export const modalPanel = trigger('modalPanel', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.96) translateY(4px)' }),
    animate('180ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
  ]),
  transition(':leave', [
    animate('120ms ease-in', style({ opacity: 0, transform: 'scale(0.97)' })),
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

/** Lista de elementos (filas, tarjetas) apareciendo con un pequeño desfase entre ellos. */
export const listStagger = trigger('listStagger', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(6px)' }),
      stagger(40, animate('160ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))),
    ], { optional: true }),
  ]),
]);