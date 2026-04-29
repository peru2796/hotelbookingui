import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RoomsRepository {

    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getRooms(): Observable<any[]> {
        // OPTIONAL: If API needs auth token
        const token = localStorage.getItem('token');
        const headers = token
            ? new HttpHeaders({ Authorization: `Bearer ${token}` })
            : undefined;
        return this.http.get<any[]>(`${this.baseUrl}/getRoomDetails`, { headers });
    }

    addBooking(formData: FormData): Observable<any> {
        return this.http.post(`${this.baseUrl}/createClientAndBooking`, formData);
    }

    getBookingDetails(id: string): Observable<any> {
        const headers = new HttpHeaders({ id: id });
        return this.http.get(`${this.baseUrl}/getBookingDetailsById`, { headers });
    }

    getRoomDetails(date: string): Observable<any> {
        const headers = new HttpHeaders({ 'date-filter': date });
        return this.http.get(`${this.baseUrl}/getRoomDetails`, { headers });
    }

    getRoomUserDetails(date: string): Observable<any> {
        const headers = new HttpHeaders({ 'date-filter': date });
        return this.http.get(`${this.baseUrl}/getRoomUserDetails`, { headers });
    }

    updateCustomer(formData: FormData): Observable<any> {
        return this.http.post(`${this.baseUrl}/addClient`, formData);
    }
    getCheckOut(id: string, payload: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/checkout`, payload);
    }

    addPayment(id: string, payload: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/addPayment`, payload);
    }

    getBillingDetails(id: string): Observable<any> {
        const headers = new HttpHeaders({ id: id });
        return this.http.get(`${this.baseUrl}/getBillingDetailsById`, { headers });
    }

    getRoomTypes(): Observable<any> {
        return this.http.get(`${this.baseUrl}/getRoomTypeList`);
    }

    getStateList(): Observable<any> {
        return this.http.get(`${this.baseUrl}/getStateList`);
    }

    saveOrders(payload: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/addGuestOrders`, payload);
    }

    getRoomService(bookingId: string): Observable<any> {
        const headers = new HttpHeaders({ 'bookingId': bookingId });
        return this.http.get(`${this.baseUrl}/getRoomServiceOrders`, { headers });
    }

    getClientByMobile(mobile: string): Observable<any> {
        const headers = new HttpHeaders({ 'mobileNumber': mobile });
        return this.http.get(`${this.baseUrl}/getClientByMobileNumber`, { headers });
    }

}
