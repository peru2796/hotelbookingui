import { Component, OnInit, ViewChild, AfterViewInit, Input, EventEmitter, Output, TemplateRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { Client } from './client.model';
import { BookingsRepository } from './bookings-repository';
import { AddBookingDialogComponent } from './add-booking-dialog/add-booking-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { RoomBookingDialogComponent } from '../rooms/room-booking-dialog/room-booking-dialog.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { ViewBookingDialogComponent } from '../rooms/view-booking-dialog/view-booking-dialog.component';
import { BillPrintComponent } from './bill-print/bill-print.component';
import { CheckoutDialogComponent } from '../rooms/checkout-dialog/checkout-dialog.component';
import { RoomsRepository } from '../rooms/rooms-repository';
import { ToastrService } from 'ngx-toastr';
import { AddPaymentDialogComponent } from './checkout-dialog/add-payment-dialog.component';


@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit, AfterViewInit {
  @Input() isViewOnly: boolean = false;
  displayedColumns = [
    'bookingId',
    'name',
    'mobileNumber',
    'room',
    'roomTypeName',
    'checkinDts',
    'checkoutDts',
    'billingNumber',
    'payment',
    'actions'
  ];
  fromDate!: Date | null;
  toDate!: Date | null;
  dataSource = new MatTableDataSource<Client>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @Output() printBill = new EventEmitter<any>();
  @ViewChild(MatMenuTrigger) contextMenu!: MatMenuTrigger;

  contextMenuPosition = { x: '0px', y: '0px' };
  rowContext: any;
  inputValue: any;
  @ViewChild('billPrintPage') billPrintPage: BillPrintComponent | undefined;

  billData: any;
  today = new Date();
  isBillPrint = false;

  @ViewChild('ordersDialog') ordersDialog!: TemplateRef<any>;
  @ViewChild('orderSummaryDialog') orderSummaryDialog!: TemplateRef<any>;
  ordersDialogRef: any;
  orderName: string | undefined;
  orderValue: string | undefined;
  roomDetails: any;
  orderDetails: any;
  constructor(private dialog: MatDialog, private bookingRepo: BookingsRepository, private repository: RoomsRepository, private toastr: ToastrService) { }

  ngOnInit() {
    this.setDefaultOneMonthFilter();

    if (this.isViewOnly) {
      this.loadTodayClients();
    } else {
      this.loadClients();
    }

  }

  setDefaultOneMonthFilter() {
    const today = new Date();

    this.toDate = new Date(today);
    this.fromDate = new Date(today);
    this.fromDate.setMonth(this.fromDate.getMonth() - 1);

    this.fromDate.setHours(0, 0, 0, 0);
    this.toDate.setHours(23, 59, 59, 999);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.paginator.pageSize = 10;
  }

  loadClients() {
    if (!this.fromDate || !this.toDate) {
      return;
    }

    const from = this.formatDateTime(this.fromDate, 0, 0, 0);
    const to = this.formatDateTime(this.toDate, 23, 59, 59)
    this.bookingRepo.getBookingList(from, to).subscribe({
      next: (res: any[]) => {
        this.dataSource.data = res;
      },
      error: (err) => {
        console.error('Failed to load clients', err);
      }
    });
  }

  private formatDateTime(date: Date, h: number, m: number, s: number): string {
    const d = new Date(date);
    d.setHours(h, m, s, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  loadTodayClients() {
    this.bookingRepo.getTodayBookingList().subscribe({
      next: (res: any[]) => {
        this.dataSource.data = res;
      },
      error: (err) => {
        console.error('Failed to load clients', err);
      }
    });
  }

  getFullName(client: Client): string {
    return `${client.firstName} ${client.lastName}`;
  }

  getStatusLabel(status: number): string {
    return status === 1 ? 'Active' : 'Inactive';
  }

  openAddBookingModal() {
    const dialogRef = this.dialog.open(RoomBookingDialogComponent, {
      width: '950px'
    });

    dialogRef.afterClosed().subscribe((result: Client) => {
      if (result) {
        // Add new booking to the table
        this.loadClients()
      }
    });
  }

  checkOut(data: any) {
    const dialogRef = this.dialog.open(CheckoutDialogComponent, {
      width: '600px',
      data: data
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.billPrintPage?.printBill(data?.bookingId);
        this.loadClients()
      }
    });
  }

  viewClient(row: any) {
    console.log('View:', row);
  }

  editClient(item: any) {
    const dialogRef = this.dialog.open(RoomBookingDialogComponent, {
      width: '950px',
      data: {
        mode: 'edit',
        data: item
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadClients(); // refresh table
      }
    });
  }

  addPayment(row: any){
    const dialogRef = this.dialog.open(AddPaymentDialogComponent, {
      width: '600px',
      data: row
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadClients()
      }
    });
  }

  deleteClient(row: any) {
    if (confirm('Are you sure you want to delete?')) {
      console.log('Delete:', row);
    }
  }

  getPaymentStatus(row: any): string {
    const remaining = Number(row.amountRemaining) || 0;
    return remaining > 0 ? 'Unpaid' : 'Paid';
  }

  view(data: any) {
    const dialogRef = this.dialog.open(ViewBookingDialogComponent, {
      width: '950px',
      data: {
        data: data,
        mode: 'view-booking'
      }
    });
  }
  edit(data: any) {

  }
  delete(data: any) {

  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  clear() {
    this.inputValue = '';
    this.dataSource.filter = '';
  }

  onPrintClick(booking: any) {
    this.billPrintPage?.printBill(booking?.bookingId);
  }

  resetFilters() {
    this.setDefaultOneMonthFilter();
    this.loadClients();
  }

  addExtraItems(event: any) {
    this.roomDetails = event
    this.ordersDialogRef = this.dialog.open(this.ordersDialog, {
      width: '400px',
      panelClass: 'custom-upload-modalbox',
    });
    this.ordersDialogRef.afterClosed().subscribe(() => {
      this.orderName = '';
      this.orderValue = '';
    });
  }

  saveOrders(event: any) {
    const payload = {
      "id": 0,
      "bookingId": this.roomDetails.bookingId,
      "orderName": this.orderName,
      "orderValue": this.orderValue,
      "status": 0
    }
    this.repository.saveOrders(payload).subscribe({
      next: (data) => {
        if (data?.status === 'Success') {
          this.toastr.success('Order saved successfully', 'Success');
          this.ordersDialogRef.close(true);
          this.loadClients();
          this.orderName = '';
          this.orderValue = '';
        } else {
          this.toastr.error(
            data?.message || 'Order saved failed',
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

  openOrdersDialog(data: any) {
    this.getOrders(data);
    this.ordersDialogRef = this.dialog.open(this.orderSummaryDialog, {
      width: '500px',
      panelClass: 'custom-upload-modalbox',
    });
  }

  getOrders(data:any) {
    this.repository.getRoomService(data.bookingId).subscribe({
      next: (res) => {
        this.orderDetails = res;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  get grandTotal(): number {
    return this.orderDetails
      ?.reduce((sum: any, item: { orderValue: any; }) => sum + item.orderValue, 0);
  }
}
