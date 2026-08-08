import { Routes } from '@angular/router';
import { AdminLayout } from './admin/admin-layout/admin-layout';
import { Clientes } from './admin/clientes/clientes';
import { Zonas } from './admin/zonas/zonas';
import { Planes } from './admin/planes/planes';
import { Equipos } from './admin/equipos/equipos';
import { Pagos } from './admin/pagos/pagos';
import { Instalaciones } from './admin/instalaciones/instalaciones';
import { PerfilCliente } from './admin/perfil-cliente/perfil-cliente';
import { Dashboard } from './admin/dashboard/dashboard';
import { Reportes } from './admin/reportes/reportes';
import { Morosos } from './admin/morosos/morosos';
import { Login } from './auth/login/login';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'clientes', pathMatch: 'full' },
      { path: 'clientes', component: Clientes, data: { title: 'Clientes' } },
      { path: 'zonas', component: Zonas, data: { title: 'Zonas' } },
      { path: 'planes', component: Planes, data: { title: 'Planes' } },
      { path: 'equipos', component: Equipos, data: { title: 'Equipos' } },
      { path: 'pagos', component: Pagos, data: { title: 'Cobros' } },
      { path: 'instalaciones', component: Instalaciones, data: { title: 'Instalaciones' } },
      { path: 'clientes/:id', component: PerfilCliente, data: { title: 'Perfil del Cliente' } },
      { path: 'dashboard', component: Dashboard, data: { title: 'Dashboard' } },
      { path: 'reportes', component: Reportes, data: { title: 'Reportes' } },
      { path: 'morosos', component: Morosos, data: { title: 'Morosos' } },
    ]
  },
  { path: '**', redirectTo: 'login' }
];