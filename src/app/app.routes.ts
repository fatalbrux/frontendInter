import { Routes } from '@angular/router';
import { AdminLayout } from './admin/admin-layout/admin-layout';
import { Clientes } from './admin/clientes/clientes';

export const routes: Routes = [
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'clientes', pathMatch: 'full' },
      { path: 'clientes', component: Clientes }
    ]
  },
  { path: '**', redirectTo: 'admin' }
];