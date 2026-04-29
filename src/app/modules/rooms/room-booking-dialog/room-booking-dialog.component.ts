import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RoomsRepository } from '../rooms-repository';
import { ToastrService } from 'ngx-toastr';
import { DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';

export class MyDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-room-booking-dialog',
  templateUrl: './room-booking-dialog.component.html',
  styleUrls: ['./room-booking-dialog.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MyDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ]
})

export class RoomBookingDialogComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  isDragging = false;
  selectedFile!: File;
  previewUrl: string | ArrayBuffer | null = null;
  roomsLoaded = false;
  MAX_SIZE = 1 * 1024 * 1024; // 1MB
  room = this.data;
  today = new Date();

  // Helper: checkout default = tomorrow, same time as now
  private get defaultCheckout(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }

  model: any = {
    clientObject: {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      idNumber: '',
      gstInNo: '',
      city: '',
      state: '',
      status: 1,
      address2: '',
      address1: '',
      id: ''
    },
    bookingObject: {
      id: '',
      roomId: '',
      roomNumber: '',
      roomType: '',
      clientId: '',
      totalAmount: '',
      amountPaid: 0,
      amountRemaining: 0,
      adultCount: 0,
      childrenCount: 0,
      paymentType: 1,
      transactionStatus: 22,
      discountAmount: 0,
      discountPercentage: 0,
      gstEnabled: true,
      checkinDts: new Date(),                // ✅ current date + current time
      checkoutDts: this.defaultCheckout,     // ✅ tomorrow  + current time
      comments: '',
      status: 1
    },
    files: ''
  };

  rooms: any;
  loading: boolean = false;
  isEditMode: boolean = false;
  isNewBooking: boolean = false;
  roomDetails: any;
  selectedTabIndex = 0;
  stateLists:any;
  totalTabs = 3;
  constructor(
    private dialogRef: MatDialogRef<RoomBookingDialogComponent>, private repository: RoomsRepository,
    @Inject(MAT_DIALOG_DATA) public data: any, private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    const now = new Date(); // capture current time once for consistency
    if (this.data?.mode === 'edit') {
      this.isEditMode = true;
      this.selectedTabIndex = 1;
      this.model = {
        clientObject: {
          firstName: this.data.data.firstName,
          lastName: this.data.data.lastName,
          email: this.data.data.email,
          mobileNumber: this.data.data.mobileNumber,
          gstInNo: this.data.data.gstInNo,
          idNumber: this.data.data.idNumber,
          city: this.data.data.city,
          state: this.data.data.state,
          address1: this.data.data.address1,
        },
        bookingObject: {
          id: this.data.data.bookingId,
          roomId: this.data.data.roomId,
          roomNumber: this.data.data.roomNumber,
          roomType: this.data.data.roomType,
          clientId: this.data.data.clientId,
          adultCount: this.data.data.adultCount,
          childrenCount: this.data.data.childrenCount,
          totalAmount: this.data.data.totalAmount,
          amountPaid: this.data.data.amountPaid,
          amountRemaining: this.data.data.amountRemaining,
          paymentType: this.data.data.paymentType,
          transactionStatus: 22,
          checkinDts: this.data.data.checkinDts,
          checkoutDts: this.data.data.checkoutDts,
          comments: this.data.data.comments,
        }
      }
    } else if (this.data?.mode === 'booking') {
      this.isNewBooking = true;
      // checkin: use the date from data but apply current time
      const checkin = new Date(this.data.data.checkinDate);
      checkin.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      this.model.bookingObject.checkinDts = checkin;

      // checkout: next day from checkin, same current time
      const checkout = new Date(checkin);
      checkout.setDate(checkout.getDate() + 1);
      this.model.bookingObject.checkoutDts = checkout;
      this.model.bookingObject.paymentType = 'cash';
      this.model.bookingObject.roomNumber = this.data.data.roomNumber;
      this.model.bookingObject.roomId = this.data.data.roomId;
      this.model.bookingObject.roomType = this.data.data.roomType;

    } else {
      // New booking: both dates already have current time from model defaults
      // Just ensure checkout is tomorrow with current time
      const checkout = new Date(now);
      checkout.setDate(checkout.getDate() + 1);
      this.model.bookingObject.checkinDts = new Date(now);
      this.model.bookingObject.checkoutDts = checkout;
    }

    this.model.bookingObject.paymentType = 'cash';
    this.fetchRoomDetails();
    this.loadRoomTypes();
    this.loadStates();
  }

  onMobileBlur() {
    const mobile = this.model.clientObject.mobileNumber;

    // Validate before API call
    if (!mobile || !/^[6-9][0-9]{9}$/.test(mobile)) {
      return;
    }

    this.repository.getClientByMobile(mobile).subscribe({
      next: (res: any) => {
        if (res) {
          // 🔥 Auto-fill form
          this.model.clientObject.firstName = res.firstName || '';
          this.model.clientObject.lastName = res.lastName || '';
          this.model.clientObject.email = res.email || '';
          this.model.clientObject.gstInNo = res.gstInNo || '';
          this.model.clientObject.idNumber = res.idNumber || '';
          this.model.clientObject.city = res.city || '';
          this.model.clientObject.state = res.state || '';
          this.model.clientObject.address1 = res.address1 || '';
          this.model.clientObject.id = res.id || '';
          
        }
      },
      error: (err) => {
        if (err.status === 404) {
          console.log('New customer. Please enter details');
        } else {
          console.log('Failed to fetch customer');
        }
      }
    });
  }

  loadStates(){
    this.repository.getStateList().subscribe({
      next: (data) => {
        this.stateLists = data;
      },
      error: () => console.error('Failed to State Lists')
    });
  }
  loadRoomTypes() {
    this.repository.getRoomTypes().subscribe({
      next: (data) => {
        this.rooms = data;

        // 🔥 Fix for edit mode
        if (this.model.bookingObject.roomType) {
          const selected = this.rooms.find(
            (r: any) => r.id === this.model.bookingObject.roomType
          );

          if (selected) {
            this.model.bookingObject.selectedRoom = selected;
          }
        }
      },
      error: () => console.error('Failed to load room types')
    });
  }

  onDropdownOpen(opened: boolean) {
    if (opened && !this.roomsLoaded) {
      this.fetchRoomDetails();
    }
  }

  fetchRoomDetails() {
    this.loading = true;
    const formatted = this.formatDateForApi(this.model.bookingObject.checkinDts);

    this.repository.getRoomDetails(formatted).subscribe({
      next: (res) => {
        this.roomDetails = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
  }

  formatDateForApi(date: any): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;   // yyyy-MM-dd
  }

  isFormValid(): boolean {
    const client = this.model.clientObject;
    const booking = this.model.bookingObject;

    const isValidMobile =
      !!client.mobileNumber &&
      /^[6-9][0-9]{9}$/.test(String(client.mobileNumber));

    return (
      !!client.firstName &&
      isValidMobile &&
      !!booking.checkinDts &&
      !!booking.checkoutDts &&
      !!booking.roomType &&
      !!booking.roomNumber
    );
  }

  onCheckinChange(checkinDate: Date) {
    if (!checkinDate) return;

    const now = new Date();

    // Apply current time to the selected checkin date
    const checkin = new Date(checkinDate);
    checkin.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    this.model.bookingObject.checkinDts = checkin;

    // Checkout = next day with same current time
    const checkout = new Date(checkin);
    checkout.setDate(checkout.getDate() + 1);
    this.model.bookingObject.checkoutDts = checkout;
  }

  onCheckOutChange(checkoutDate: Date) {
    if (!checkoutDate) return;

    const now = new Date();

    // Apply current time to the selected checkin date
    const checkin = new Date(checkoutDate);
    checkin.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    // Checkout = next day with same current time
    const checkout = new Date(checkin);
    checkout.setDate(checkout.getDate());
    this.model.bookingObject.checkoutDts = checkout;
  }

  private formatLocalDateTime(d: Date): string {
    const date = (typeof d === 'string') ? new Date(d) : d;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}`;
  }

  

  close() {
    this.dialogRef.close();
  }

  save() {

    const formData = new FormData();
    this.model.bookingObject.paymentType = this.model.bookingObject.paymentType === 'cash' ? 1 : 2;
    if (this.selectedFile) {
      formData.append('files', this.selectedFile);
    } else {
      formData.append('files', new Blob([]));
    }
    this.model.bookingObject.checkinDts = this.formatLocalDateTime(this.model.bookingObject.checkinDts);
    this.model.bookingObject.checkoutDts = this.formatLocalDateTime(this.model.bookingObject.checkoutDts);
    formData.append(
      'clientObject',
      new Blob(
        [JSON.stringify(this.model.clientObject)],
        { type: 'application/json' }
      )
    );
    this.model.bookingObject.amountRemaining = this.model.bookingObject.totalAmount - this.model.bookingObject.amountPaid;
    this.model.bookingObject.discountAmount = 0
    this.model.bookingObject.discountPercentage = 0
    this.model.bookingObject.gstEnabled = true;
    
    formData.append(
      'bookingObject',
      new Blob(
        [JSON.stringify(this.model.bookingObject)],
        { type: 'application/json' }
      )
    );

    this.repository.addBooking(formData).subscribe({
      next: (res: any) => {
        if (res?.status === '200 OK' || res.message === 'Success') {
          const message = this.isEditMode ? 'Booking updated successfully' : 'Booking added successfully';
          this.toastr.success(message, 'Success');
          this.dialogRef.close(true);
        } else {
          this.toastr.error('Booking failed', 'Error');
        }
      },
      error: (err) => {
        console.error('Booking failed', err);
        if (err.status === 400) {
          this.toastr.warning('Invalid booking data', 'Warning');
        } else if (err.status === 500) {
          this.toastr.error('Server error. Try again later', 'Error');
        } else {
          this.toastr.error('Something went wrong', 'Error');
        }
      }
    });
  }

  onRoomSelect(selectedRoomNumber: string) {
    this.model.bookingObject.roomNumber = selectedRoomNumber;
    const room = this.roomDetails.find((r: { roomNumber: string }) => r.roomNumber === selectedRoomNumber);
    if (room) {
      this.model.bookingObject.roomId = room.id;
    }
  }
  selectRoomType(event: any) {
    const item = event.value;
    if (item) {
      this.model.bookingObject.roomType = item.id;
      this.model.bookingObject.totalAmount = item.amount;
    }
  }
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  validateAndSetFile(file: File) {
    const allowedTypes = ['image/png', 'image/jpeg'];

    if (!allowedTypes.includes(file.type)) {
      alert('Only PNG and JPG files are allowed');
      return;
    }

    if (file.size > this.MAX_SIZE) {
      alert('File size must be less than 1MB');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(file);
  }

  removeFile() {
    this.selectedFile = null as any;
    this.previewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  nextTab() {
    if (this.selectedTabIndex < this.totalTabs - 1) {
      this.selectedTabIndex++;
    }
  }

  prevTab() {
    if (this.selectedTabIndex > 0) {
      this.selectedTabIndex--;
    }
  }
}
