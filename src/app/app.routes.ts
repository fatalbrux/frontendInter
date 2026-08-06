import { Routes } from '@angular/router';
import { AdminLayout } from './admin/admin-layout/admin-layout';
import { Clientes } from './admin/clientes/clientes';
import { Zonas } from './admin/zonas/zonas';
import { Planes } from './admin/planes/planes';

export const routes: Routes = [
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'clientes', pathMatch: 'full' },
      { path: 'clientes', component: Clientes },
      { path: 'zonas', component: Zonas },
      { path: 'planes', component: Planes }
    ]
  },
  { path: '**', redirectTo: 'admin' }
];