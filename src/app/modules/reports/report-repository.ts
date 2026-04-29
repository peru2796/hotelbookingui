import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { formatDate } from '@angular/common';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReportRepository {

    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getBillingDetails(fromDate: any, toDate: any, gstType:any): Observable<any> {
        const from = this.formatDateTime(fromDate, 0, 0, 0);
        const to = this.formatDateTime(toDate, 23, 59, 0);

        const headers = new HttpHeaders()
            .set('fromDate', from)
            .set('toDate', to)
            .set('gstType', gstType)
        return this.http.get<any[]>(`${this.baseUrl}/getGstBillingReport`, { headers });
    }

    private formatDateTime(date: Date, h: number, m: number, s: number): string {
        const d = new Date(date);
        d.setHours(h, m, s, 0);

        const pad = (n: number) => n.toString().padStart(2, '0');

        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
            `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

}
