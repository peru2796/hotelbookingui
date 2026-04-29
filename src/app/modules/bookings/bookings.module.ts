import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingsRoutingModule } from './bookings-routing.module';
import { BookingsComponent } from './bookings.component';
import { MaterialCollectionModule } from 'src/app/shared/material-collection.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddBookingDialogComponent } from './add-booking-dialog/add-booking-dialog.component';
import { BookingsRepository } from './bookings-repository';
import { BillPrintComponent } from './bill-print/bill-print.component';
import { AddPaymentDialogComponent } from './checkout-dialog/add-payment-dialog.component';


@NgModule({
  declarations: [
    BookingsComponent,
    AddBookingDialogComponent,
    BillPrintComponent,
    AddPaymentDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BookingsRoutingModule,
    MaterialCollectionModule
  ],
  exports: [BookingsComponent,BillPrintComponent],
  providers: [BookingsRepository]
})
export class BookingsModule { }
