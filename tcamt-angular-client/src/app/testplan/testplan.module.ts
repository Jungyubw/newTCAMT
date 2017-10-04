import {NgModule}     from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule, ReactiveFormsModule }    from '@angular/forms';
import {TestplansComponent} from './list/testplans.component';
import {TestplanRoutingModule} from './testplan-routing.module';

import {DataTableModule,SharedModule,ButtonModule, DialogModule} from 'primeng/primeng';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		DataTableModule,
		SharedModule,
		ButtonModule,
		DialogModule,
		TestplanRoutingModule
	],
	declarations: [
		TestplansComponent
	]
})
export class TestplanModule {}
