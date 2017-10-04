import {NgModule}     from '@angular/core';
import {RouterModule} from '@angular/router';
import {TestplansComponent} from './list/testplans.component';

@NgModule({
	imports: [
		RouterModule.forChild([
			{ path: '', redirectTo: 'testplans', pathMatch: 'full' },
			{ path: 'testplans',  component: TestplansComponent },
			{ path: 'testplandetail', loadChildren: './edit/testplan-edit.module#TestplanEditModule'}

		])
	],
	exports: [
		RouterModule
	]
})
export class TestplanRoutingModule {}