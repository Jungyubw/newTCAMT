import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TestComponentComponent } from './test-component/test-component.component';
import { HeaderModule } from './header/header.module';
import { AngularFontAwesomeModule } from 'angular-font-awesome/angular-font-awesome';


@NgModule({
  declarations: [
    AppComponent,
    TestComponentComponent
  ],
  imports: [
      AngularFontAwesomeModule,
      BrowserModule,
      HeaderModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
