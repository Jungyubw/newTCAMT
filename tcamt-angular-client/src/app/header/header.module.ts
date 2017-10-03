import { NgModule }           from '@angular/core';
import { SharedModule }       from '../shared/shared.module';
import { HeaderComponent } from './header.component';

@NgModule({
    imports:      [ SharedModule ],
    declarations: [  HeaderComponent ],
    providers:    [  ],
    exports:      [ HeaderComponent ]
})
export class HeaderModule { }