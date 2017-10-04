import {NgModule}     from '@angular/core';
import {CommonModule} from '@angular/common';
import {TestplansComponent} from './list/testplans.component';
import {TestplanRoutingModule} from './testplan-routing.module';

import {DataTableModule,SharedModule,ButtonModule} from 'primeng/primeng';

@NgModule({
	imports: [
		CommonModule,
		DataTableModule,
		SharedModule,
		ButtonModule,
		TestplanRoutingModule
	],
	declarations: [
		TestplansComponent
	]
})
export class TestplanModule {}
