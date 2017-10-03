import { NgModule }            from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';

import {ButtonModule} from 'primeng/primeng';

@NgModule({
    imports:      [ CommonModule, ButtonModule ],
    declarations: [ ],
    exports:      [ CommonModule, FormsModule, ButtonModule ]
})
export class SharedModule { }