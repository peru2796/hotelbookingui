import { Component, TemplateRef, ViewChild } from '@angular/core';
import { RoomCard } from './room-card';
import { RoomBookingDialogComponent } from '../room-booking-dialog/room-booking-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ViewBookingDialogComponent } from '../view-booking-dialog/view-booking-dialog.component';
import { RoomsRepository } from '../rooms-repository';
import { CheckoutDialogComponent } from '../checkout-dialog/checkout-dialog.component';
import { BillPrintComponent } from '../../bookings/bill-print/bill-print.component';
import { ToastrService } from 'ngx-toastr';
import { OrderSummaryComponent } from '../order-summary/order-summary.component';


@Component({
  selector: 'app-room-cards',
  templateUrl: './room-cards.component.html',
  styleUrls: ['./room-cards.component.scss']
})
export class RoomCardsComponent {
  @ViewChild('billPrintPage') billPrintPage: BillPrintComponent | undefined;
  @ViewChild('ordersDialog') ordersDialog!: TemplateRef<any>;
  rooms: any;
  ordersDialogRef: any;
  isLoading: boolean = false;
  // selected date (normalized to midnight)
  selectedDate: Date | null = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  // minimum allowed date (today at midnight)
  minDate: Date = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  roomsType: string = 'all';
  allRooms: any[] = [];
  orderName: string | undefined;
  orderValue: string | undefined;
  roomDetails: any;
  constructor(private dialog: MatDialog, private repository: RoomsRepository, private toastr: ToastrService) { }
  ngOnInit() {
    // Load rooms for the selected date by default
    this.applyDateFilter();
    /* this.fetchRoomDetails(); */
  }

  fetchRoomDetails(date?: Date | null) {
    this.isLoading = true;
    const targetDate = date ?? this.selectedDate;
    if (targetDate) {
      const dateStr = this.formatDate(targetDate);
      this.repository.getRoomUserDetails(dateStr).subscribe({
        next: (res: any[]) => {
          this.isLoading = false;
          this.rooms = res;
          this.allRooms = res;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Failed to load clients', err);
        }
      });
    }
  }

  getStatusClass(status: string) {
    return {
      'Checked-in': 'status-occupied',
      Available: 'status-available',
      Cleaning: 'status-cleaning',
      Booked: 'status-reserved'
    }[status];
  }

  addGuest(item: any) {
    item.checkinDate = this.selectedDate;
    const dialogRef = this.dialog.open(RoomBookingDialogComponent, {
      width: '950px',
      data: {
        mode: 'booking',
        data: item
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.fetchRoomDetails();
      }
    });
  }

  viewDetails(data: any) {
    this.dialog.open(ViewBookingDialogComponent, {
      width: '950px',
      data: {
        data: data
      }
    });
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

  roomFilter(value: string) {
    console.log('Selected filter:', value);

    switch (value) {
      case 'available':
        this.rooms = this.allRooms.filter(
          room => room.statusName === 'Available'
        );
        break;

      case 'booked':
        this.rooms = this.allRooms.filter(
          room => room.statusName === 'Checked-in'
        );
        break;

      case 'all':
      default:
        this.rooms = this.allRooms;
        break;
    }
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
          this.fetchRoomDetails();
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

  checkOut(data: any) {
    const dialogRef = this.dialog.open(CheckoutDialogComponent, {
      width: '600px',
      data: data
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.billPrintPage?.printBill(data?.bookingId);
        this.fetchRoomDetails();
      }
    });
  }

  formatDate(d: Date | null): string {
    if (!d) { return ''; }
    const date = new Date(d);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  applyDateFilter() {
    this.fetchRoomDetails(this.selectedDate);
    this.roomsType = 'all';
  }

  onSelectedDateChange(val: Date | null) {
    if (!val) {
      this.selectedDate = null;
      this.fetchRoomDetails(null);
      return;
    }

    const d = new Date(val);
    d.setHours(0, 0, 0, 0);

    if (d < this.minDate) {
      // clamp to minDate
      this.selectedDate = new Date(this.minDate);
    } else {
      this.selectedDate = d;
    }

    this.applyDateFilter();
  }

  isPrevDisabled(): boolean {
    if (!this.selectedDate) { return false; }
    const sd = new Date(this.selectedDate);
    sd.setHours(0, 0, 0, 0);
    return sd <= this.minDate;
  }

  previousDay() {
    if (!this.selectedDate) { this.selectedDate = new Date(this.minDate); this.applyDateFilter(); return; }
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);

    if (d < this.minDate) {
      this.selectedDate = new Date(this.minDate);
    } else {
      this.selectedDate = d;
    }

    this.applyDateFilter();
  }

  nextDay() {
    const d = this.selectedDate ? new Date(this.selectedDate) : new Date(this.minDate);
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    this.selectedDate = d;
    this.applyDateFilter();
  }

  goToday() {
    this.selectedDate = new Date(this.minDate);
    this.applyDateFilter();
  }
  editRoom(room: any) {
     const dialogRef = this.dialog.open(RoomBookingDialogComponent, {
      width: '950px',
      data: {
        mode: 'edit',
        data: room
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchRoomDetails(); // refresh table
      }
    });
  }
  viewOrders(room: any) {
     const dialogRef = this.dialog.open(OrderSummaryComponent, {
      width: '500px',
      data: {
        mode: 'booking',
        data: room
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.fetchRoomDetails();
      }
    });
  }
}
