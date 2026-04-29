import { Component, Inject, TemplateRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RoomsRepository } from '../../rooms/rooms-repository';

@Component({
  selector: 'app-add-payment-dialog',
  templateUrl: './add-payment-dialog.component.html',
  styleUrls: ['./add-payment-dialog.component.scss']
})
export class AddPaymentDialogComponent {
  amount: any;
  discountAmount: any = 0;
  gstEnabled: boolean = true;
  amountPaid: number = 0;
  @ViewChild('ordersDialog') ordersDialog!: TemplateRef<any>;
  ordersDialogRef: any;
  loading: boolean = false;
  orderDetails: any;
  constructor(
    private dialogRef: MatDialogRef<AddPaymentDialogComponent>,
    private repository: RoomsRepository,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any, private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // this.payingAmount = (this.data?.amountRemaining ?? 0) + (this.data?.miscellaneousCharge ?? 0);
  }

  get totalRemaining(): number {
    return (this.data?.amountRemaining ?? 0);
  }

  get balanceAfterPayment(): number {
    return this.totalRemaining - (this.amountPaid ?? 0);
  }

  onPayingAmountChange() {
    if (this.amountPaid > this.totalRemaining) {
      this.amountPaid = this.totalRemaining;
    }
    if (this.amountPaid < 0) {
      this.amountPaid = 0;
    }
  }

  // ── Formats Date to yyyy-MM-ddTHH:mm:ss.mmm ───────────────────────────────
  private formatLocalDateTime(d: Date): string {
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const hh   = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    const ss   = String(d.getSeconds()).padStart(2, '0');
    const ms   = String(d.getMilliseconds()).padStart(3, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}`;
  }

  addPayment() {
    // ── Set current date & time as actual checkout time ────────────────────
    const now = new Date();
    this.data.checkoutDts = this.formatLocalDateTime(now);

    // ── Validate paying amount ─────────────────────────────────────────────
    const paying = this.amountPaid ?? 0;
    if (paying < 0 || paying > this.totalRemaining) {
      this.toastr.error(`Enter an amount between 0 and ${this.totalRemaining}`, 'Invalid Amount');
      return;
    }

    // ── Apply partial or full payment ──────────────────────────────────────
    this.data.amountPaid      = paying;
    this.data.amountRemaining = this.totalRemaining;
    this.repository
      .addPayment(this.data.bookingId, this.data)
      .subscribe({
        next: (data) => {
          if (data?.status === 'Success') {
            this.toastr.success('Payment added successfully', 'Success');
            this.dialogRef.close(true);
          } else {
            this.toastr.error(
              data?.message || 'Failed to add payment',
              'Error'
            );
          }
        },
        error: (err) => {
          this.toastr.error(
            err?.error?.message || 'Something went wrong. Please try again.',
            'Error'
          );
        }
      });
  }

  close() {
    this.dialogRef.close();
  }

  openOrdersDialog() {
    this.getOrders();
    this.ordersDialogRef = this.dialog.open(this.ordersDialog, {
      width: '500px',
      panelClass: 'custom-upload-modalbox',
    });
  }

  getOrders() {
    this.loading = true;
    this.repository.getRoomService(this.data.bookingId).subscribe({
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
      ?.reduce((sum: any, item: { orderValue: any }) => sum + item.orderValue, 0);
  }

}
