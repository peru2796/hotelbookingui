import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ReportRepository } from '../report-repository';

@Component({
  selector: 'app-gst-report',
  templateUrl: './gst-report.component.html',
  styleUrls: ['./gst-report.component.scss']
})
export class GstReportComponent {

  reportType: 'monthly' | 'quarterly' | 'yearly' | null = null;
  gstType: '3' | '2' | '1' | null = '1';
  fromDate!: Date | null;
  toDate!: Date | null;
  grandTotals = {
    basePrice: 0,
    gst: 0,
    sgst: 0,
    total: 0
  };
  reportData: any;
  constructor(private datePipe: DatePipe, private titleCasePipe: TitleCasePipe, private repo: ReportRepository) { }
  loadReport() {
    this.repo.getBillingDetails(this.fromDate, this.toDate, this.gstType).subscribe((data: any) => {
      this.reportData = data;
    });
  }

  resetFilters() {
    this.reportType = null;
    this.fromDate = null;
    this.toDate = null;
    this.gstType = null;
    this.reportData = [];
  }

  get isGenerateDisabled(): boolean {
    return !this.reportType;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // yyyy-mm-dd
  }
  /* printReport() {
    const printContent = document.getElementById('print-section')!.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
    <html>
      <head>
        <title>GST Report</title>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `;

    window.print();
    document.body.innerHTML = originalContent;
    location.reload(); // restore Angular view
  } */

  printReport() {
    const printContent = document.getElementById('print-section')!.innerHTML;

    // Open new blank window
    const printWindow = window.open('', '_blank', 'width=900,height=600');
    if (!printWindow) return; // popup blocked

    printWindow.document.write(`
    <html>

    <head>
        <title>GST Report</title>
        <style>
            .no-print {
                display: none !important;
            }

            .print {
                display: block !important;
            }

            body {
                margin: 0;
            }

            table {
                width: 100%;
                font-size: 12px;
            }

            /* remove scroll */
            .table-wrapper {
                max-height: none !important;
                overflow: visible !important;
            }

            /* safety: no sticky during print */
            thead th,
            tfoot td {
                position: static !important;
            }

            /* optional: page break handling */
            table {
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }

            .gst-table thead th {
                color: #000 !important;
            }

            .gst-table tfoot td {
                position: static !important;
                /* disable sticky */
                background: #cbcbcb !important;
            }

            /* show footer only once at the end */
            .gst-table tfoot {
                display: table-row-group;
            }

            .hotel-name {
                text-align: center;
                font-size: 24px;
                color: #000;
                margin: 0;
            }

            .hotel-address {
                text-align: center;
            }

            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
            }

            th,
            td {
                border: 1px solid #ccc;
                padding: 8px;
                text-align: left;
            }

            thead {
                background: #f2f2f2;
            }

            tfoot {
                background: #cbcbcb;
                font-weight: bold;
            }
        </style>
    </head>

    <body>
        ${printContent}
    </body>

    </html>
    `);

    printWindow.document.close(); // finish writing
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  get reportTitle(): string {
    if (this.reportType) {
      return `GST Report : ${this.titleCasePipe.transform(this.reportType)}`;
    }

    const from = this.fromDate
      ? this.datePipe.transform(this.fromDate, 'dd-MM-yyyy')
      : null;
    const to = this.toDate
      ? this.datePipe.transform(this.toDate, 'dd-MM-yyyy')
      : null;

    if (from && to) return `GST Report`;
    if (from) return `GST Report`;
    if (to) return `GST Report`;

    return 'GST Report';
  }

  onDateChange() {
    this.reportType = null
  }
  onReportTypeChange() {
    const today = new Date();

    // Last month end date
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    if (this.reportType === 'monthly') {

      // Last month start date
      this.fromDate = new Date(
        lastMonthEnd.getFullYear(),
        lastMonthEnd.getMonth(),
        1
      );

      this.toDate = lastMonthEnd;

    } else if (this.reportType === 'quarterly') {

      // Start date = 3 months ago (1st day)
      this.fromDate = new Date(
        lastMonthEnd.getFullYear(),
        lastMonthEnd.getMonth() - 2,
        1
      );

      this.toDate = lastMonthEnd;

    } else if (this.reportType === 'yearly') {

      // ✅ Last 1 year (12 months)
      this.fromDate = new Date(
        lastMonthEnd.getFullYear(),
        lastMonthEnd.getMonth() - 11,
        1
      );

      this.toDate = lastMonthEnd;
    }
  }

}
