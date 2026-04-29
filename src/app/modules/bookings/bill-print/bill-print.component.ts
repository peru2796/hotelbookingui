import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomsRepository } from '../../rooms/rooms-repository';

@Component({
    selector: 'app-bill-print',
    templateUrl: './bill-print.component.html',
    styleUrls: ['./bill-print.component.scss']
})
export class BillPrintComponent implements OnInit {
    @ViewChild('billTemplate') billTemplate!: any;
    today = new Date();
    billData: any;
    numberOfDayes: any;
    constructor(
        private route: ActivatedRoute,
        private repo: RoomsRepository
    ) { }
    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;

    }

    printBill(id: any) {
        this.repo.getBillingDetails(id).subscribe(data => {
            this.billData = data;
            this.numberOfDayes = this.getNumberOfDays();
            setTimeout(() => {
                this.getPrintPage();
            })
        });
    }

    getNumberOfDays(): number {
        if (!this.billData?.checkinDts || !this.billData?.checkoutDts) {
            return 0;
        }

        const checkin = new Date(this.billData.checkinDts);
        const checkout = new Date(this.billData.checkoutDts);

        // 🔑 remove time part
        checkin.setHours(0, 0, 0, 0);
        checkout.setHours(0, 0, 0, 0);

        const diffTime = checkout.getTime() - checkin.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        return Math.max(diffDays, 0) == 0 ? 1 : Math.max(diffDays, 0);
    }


    getPrintPage() {

        const printContent = this.billTemplate.nativeElement.innerHTML;
        const popup = window.open('', '_blank', 'width=900,height=650');

        popup!.document.open();
        popup!.document.write(`
    <html>
        <head>
        
            <style>
             @page {
            margin: 0;   /* ← This removes about:blank and timestamp */
            size: A4;
          }
                .bill-container {
                    font-family: Arial;
                    width: 200mm;
                    /* A4 width */
                margin: 0;
            }

            .bill-header {
                display: flex;
                justify-content: space-between;

                p {
                    font-size: 12px;
                    margin: 0;
                }
            }

            .right {
                text-align: end;
            }

            .cash-bill {
                margin: 0;
             
                color: #000;
                padding: 5px 5px;
                display: inline-block;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 700;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .title {
                text-align: center;

                h2 {
                    color: #000;
                    font-size: 24px;
                    font-weight: 500;
                    margin: 0;
                }

                h3 {
                    font-size: 19px;
                    font-weight: 500;
                    color: #000;
                    margin: 0;
                }

                p {
                    font-size: 12px;
                    margin: 0;
                    color: #000;
                }
            }
            .header-para p{
                margin: 5px;
            }

            .bill-info-rows {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                p {
                    margin: 0;
                    font-size: 13px;
                }
            }

            .info-row .left {
                flex: 1 1 auto;
            }

            .info-row .right {
                // width: 150px;
                text-align: left;
                // flex: 0 0 150px;
            }

            .bill-info-1 {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                p {
                    margin: 0;
                    font-size: 13px;
                }
            }

            .bill-table {
                width: 100%;
                border-collapse: collapse;
            }

            .bill-table th,
            .bill-table td {
                padding: 6px 4px;
            }
            .totals-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }

            .totals-table td {
                border: 1px solid #000;
                padding: 8px;
            }
            .totals-columns{
                display: flex;
                justify-content: space-between;
                span{
                    font-weight: bold;
                }
            }
            .words {
                border: 1px solid #000;
                padding: 5px;
                margin-top: 10px;
            }

            .footer {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }

            .sign {
                text-align: right;
                margin-top: 40px;
                font-weight: bold;
            }

            @media print {
                #bill-print {
                    display: block !important;
                }
            }

            .bill-table th,
            .bill-table td {
                border: 0.5px solid #000;
                padding: 5px;
                text-align: left;
            }

            .bill-table th {
                background-color: #f2f2f2;
            }
            .bill-table td {
                font-size: 13px;
            }

            .bill-table .right-align {
                text-align : right;
            }

            .bill-table th {
                background-color: #f2f2f2;
            }
        </style>

      </head>

      <body>${printContent}</body>

    </html>
  `);

        popup!.document.close();
        popup!.print();
    }

}
