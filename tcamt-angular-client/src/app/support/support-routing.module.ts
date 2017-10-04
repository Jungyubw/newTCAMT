import {NgModule}     from '@angular/core';
import {RouterModule} from '@angular/router'
import {Support} from './support';

@NgModule({
	imports: [
		RouterModule.forChild([
			{path:'',component: Support}
		])
	],
	exports: [
		RouterModule
	]
})
export class SupportRoutingModule {}
