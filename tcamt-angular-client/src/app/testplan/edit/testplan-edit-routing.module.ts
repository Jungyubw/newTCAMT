import {NgModule}     from '@angular/core';
import {RouterModule} from '@angular/router';

import {TestplanEditComponent} from './testplan-edit.component';
import {TestplanMetadataComponent} from './testplan/testplan-metadata.component';
import {TestgroupMetadataComponent} from './testgroup/testgroup-metadata.component';
import {TestcaseMetadataComponent} from './testcase/testcase-metadata.component';
import {TeststepMetadataComponent} from './teststep/teststep-metadata.component';

@NgModule({
	imports: [
		RouterModule.forChild(
			[
				{
					path: '',
					component: TestplanEditComponent,
					children: [
						{
							path: '',
							children: [
								{ path: 'testgroupmetadata', component: TestgroupMetadataComponent },
								{ path: 'testcasemetadata', component: TestcaseMetadataComponent },
								{ path: 'teststepmetadata', component: TeststepMetadataComponent },
								{ path: '', component: TestplanMetadataComponent }
							]
						}
					]
				}
			]
		)
	],
	exports: [
		RouterModule
	]
})
export class TestplanEditRoutingModule {}
