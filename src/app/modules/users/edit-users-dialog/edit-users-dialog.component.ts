import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RoomsRepository } from '../../rooms/rooms-repository';

@Component({
  selector: 'app-edit-users-dialog',
  templateUrl: './edit-users-dialog.component.html',
  styleUrls: ['./edit-users-dialog.component.scss']
})
export class EditUsersDialogComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  isDragging = false;
  selectedFile!: File;
  previewUrl: string | ArrayBuffer | null = null;
  MAX_SIZE = 1 * 1024 * 1024; // 1MB
  room = this.data;
  today = new Date();
  model: any = {
    clientObject: {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      idNumber: '',
      city: '',
      state: '',
      status: '',
      clientId: '',
      address1: ''
    },
    files: ''
  };

  rooms = [
    { id: 1, name: 'AC' },
    { id: 2, name: 'Non AC' },
  ];
  isLoading: boolean = false;
  isEditMode: boolean = false;
  isNewBooking: boolean = false;
  roomDetails: any;
  stateLists:any;
  constructor(
    private dialogRef: MatDialogRef<EditUsersDialogComponent>, private repository: RoomsRepository,
    @Inject(MAT_DIALOG_DATA) public data: any, private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    if (this.data?.mode === 'edit') {
      this.isEditMode = true;
      this.model = {
        clientObject: {
          id: this.data.data.id,
          firstName: this.data.data.firstName,
          lastName: this.data.data.lastName,
          email: this.data.data.email,
          mobileNumber: this.data.data.mobileNumber,
          idNumber: this.data.data.idNumber,
          city: this.data.data.city,
          state: this.data.data.state,
          address1: this.data.data.address1,
          clientId: this.data.data.clientId,
          gstInNo: this.data.data.gstInNo
        }
      }
    }
    this.loadStates()
  }

  loadStates(){
    this.repository.getStateList().subscribe({
      next: (data) => {
        this.stateLists = data;
      },
      error: () => console.error('Failed to State Lists')
    });
  }

  get statusClass() {
    return this.room?.status?.toLowerCase();   // e.g. available / occupied / reserved
  }

  isFormValid() {
    const client = this.model.clientObject;

    return (
      client.firstName &&
      // client.lastName &&
      client.mobileNumber
    );
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    this.isLoading = false;
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('files', this.selectedFile);
    } else {
      formData.append('files', new Blob([]));
    }

    formData.append(
      'clientObject',
      new Blob(
        [JSON.stringify(this.model.clientObject)],
        { type: 'application/json' }
      )
    );
    this.repository.updateCustomer(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === '200 OK' || res.message === 'Success') {
          this.toastr.success('Customer updated successfully', 'Success');
          this.dialogRef.close(true);
        } else {
          this.toastr.error('Booking failed', 'Error');
        }
      },
      error: (err) => {
        this.isLoading = false;
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
    const room = this.roomDetails.find((r: { roomNumber: string; }) => r.roomNumber === selectedRoomNumber);
    if (room) {
      this.model.bookingObject.roomId = room.id;
    }
  }
  selectRoomType(item: any) {
    this.model.bookingObject.roomType = item;
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

    // Preview
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(file);
  }

  removeFile() {
    this.selectedFile = null as any;
    this.previewUrl = null;

    // Clear input value (IMPORTANT)
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }


}
