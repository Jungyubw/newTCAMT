import { Routes,RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {path: '', component: HomeComponent},
            {path: 'testplan', loadChildren: './testplan/testplan.module#TestplanModule'},
            {path: 'support', loadChildren: './support/support.module#SupportModule'}
        ])
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {}

