import {NgModule}     from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule}    from '@angular/forms';

import {TestplanEditComponent} from './testplan-edit.component';
import {TestplanMetadataComponent} from './testplan/testplan-metadata.component';
import {TestgroupMetadataComponent} from './testgroup/testgroup-metadata.component';
import {TestcaseMetadataComponent} from './testcase/testcase-metadata.component';
import {TeststepMetadataComponent} from './teststep/teststep-metadata.component';
import {TestplanEditRoutingModule} from './testplan-edit-routing.module';
import {TreeTableModule, DropdownModule,InputTextareaModule, ButtonModule} from 'primeng/primeng';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		TestplanEditRoutingModule,
		TreeTableModule,
		DropdownModule,
		InputTextareaModule,
		ButtonModule
	],
	declarations: [
		TestplanEditComponent, TestplanMetadataComponent, TestgroupMetadataComponent, TestcaseMetadataComponent, TeststepMetadataComponent
	]
})

export class TestplanEditModule {}