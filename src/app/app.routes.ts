import { Routes } from '@angular/router';
import { AdminLayout } from './admin/admin-layout/admin-layout';
import { Clientes } from './admin/clientes/clientes';
import { Zonas } from './admin/zonas/zonas';
import { Planes } from './admin/planes/planes';
import { Equipos } from './admin/equipos/equipos';
import { Pagos } from './admin/pagos/pagos';
import { Instalaciones } from './admin/instalaciones/instalaciones';

export const routes: Routes = [
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'clientes', pathMatch: 'full' },
      { path: 'clientes', component: Clientes },
      { path: 'zonas', component: Zonas },
      { path: 'planes', component: Planes },
      { path: 'equipos', component: Equipos },
      { path: 'pagos', component: Pagos },
      { path: 'instalaciones', component: Instalaciones },
    ]
  },
  { path: '**', redirectTo: 'admin' }
];