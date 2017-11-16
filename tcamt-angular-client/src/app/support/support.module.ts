import {NgModule}     from '@angular/core';
import {CommonModule} from '@angular/common';
import {Support} from './support';
import {SupportRoutingModule} from './support-routing.module';
import {AccordionModule, ButtonModule, TabViewModule, GrowlModule} from 'primeng/primeng';

@NgModule({
	imports: [
		CommonModule,
		SupportRoutingModule,
        AccordionModule,
        ButtonModule,
        TabViewModule,
        GrowlModule
	],
	declarations: [
		Support
	]
})
export class SupportModule {}
