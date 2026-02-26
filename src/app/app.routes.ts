import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./charts/charts.component').then((m) => m.ChartsComponent)
	}
];
