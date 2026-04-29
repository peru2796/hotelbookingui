import { Component, Inject, TemplateRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RoomsRepository } from '../rooms-repository';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.scss']
})
export class OrderSummaryComponent {
  ordersDialogRef: any;
  loading: boolean = false;
  orderDetails: any;

  constructor(
    private dialogRef: MatDialogRef<OrderSummaryComponent>,
    private repository: RoomsRepository,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any, private toastr: ToastrService
  ) { 
    this.getOrders();
  }

  getOrders() {
    this.loading = true;
    this.repository.getRoomService(this.data?.data?.bookingId).subscribe({
      next: (res) => {
        this.orderDetails = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  get grandTotal(): number {
    return this.orderDetails
      ?.reduce((sum: any, item: { orderValue: any; }) => sum + item.orderValue, 0);
  }
  close(){
    this.dialogRef.close();
  }
}
