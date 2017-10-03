import { Routes,RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {path: '', component: HomeComponent},
            {path: 'setup', loadChildren: './footer/footer.module#FooterModule'},
            {path: 'support', loadChildren: './footer/footer.module#FooterModule'}
        ])
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {}