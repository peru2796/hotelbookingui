import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { MaterialCollectionModule } from './material-collection.module';
import { MY_DATE_FORMATS } from './date-format';
import { MAT_DATE_FORMATS } from '@angular/material/core';

@NgModule({
  declarations: [
    SidebarComponent,
    NavbarComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MaterialCollectionModule
  ],
  exports: [
    SidebarComponent,
    NavbarComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ]
})
export class SharedModule { }
