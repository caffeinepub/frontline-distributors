import type { Bill, Customer, Product } from '../backend';

/**
 * Print utility for generating and printing bill invoices.
 * Opens a new window with formatted invoice and triggers browser print dialog.
 */

interface BillLineItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

function consolidateBillLines(products: Product[]): BillLineItem[] {
  const lineMap = new Map<string, BillLineItem>();
  
  products.forEach(product => {
    const key = product.id.toString();
    const existing = lineMap.get(key);
    
    if (existing) {
      existing.quantity += 1;
      existing.total += Number(product.price);
    } else {
      lineMap.set(key, {
        name: product.name,
        quantity: 1,
        price: Number(product.price),
        total: Number(product.price),
      });
    }
  });
  
  return Array.from(lineMap.values());
}

export function printInvoice(bill: Bill, customer: Customer): void {
  const lines = consolidateBillLines(bill.products);
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const discount = Number(bill.discount);
  const gstAmount = Number(bill.gstAmount || 0n);
  const finalTotal = subtotal - discount + gstAmount;
  const creditAmount = Number(bill.creditAmount);
  const date = new Date(Number(bill.timestamp));
  
  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${bill.id.toString()}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        
        .invoice-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .invoice-header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          color: #1a1a1a;
        }
        
        .invoice-number {
          font-size: 18px;
          color: #666;
          margin: 5px 0;
        }
        
        .invoice-date {
          font-size: 14px;
          color: #888;
        }
        
        .customer-info {
          margin: 20px 0;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 5px;
        }
        
        .customer-info h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
        }
        
        .customer-info p {
          margin: 5px 0;
          font-size: 14px;
          color: #555;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .items-table th {
          background: #333;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        
        .items-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #ddd;
        }
        
        .items-table tr:last-child td {
          border-bottom: 2px solid #333;
        }
        
        .items-table .text-right {
          text-align: right;
        }
        
        .totals {
          margin: 20px 0;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 5px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        
        .totals-row.subtotal {
          color: #555;
        }
        
        .totals-row.discount {
          color: #d32f2f;
        }
        
        .totals-row.gst {
          color: #555;
        }
        
        .totals-row.total {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid #333;
          padding-top: 12px;
          margin-top: 8px;
        }
        
        .totals-row.credit {
          color: #f57c00;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #888;
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          background: #333;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        
        .print-button:hover {
          background: #555;
        }
        
        @media print {
          .print-button { display: none; }
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">Print Invoice</button>
      
      <div class="invoice-header">
        <h1>INVOICE</h1>
        <div class="invoice-number">Bill #${bill.id.toString()}</div>
        <div class="invoice-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
      </div>
      
      <div class="customer-info">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${customer.name}</p>
        ${customer.phoneNumber ? `<p><strong>Phone:</strong> ${customer.phoneNumber}</p>` : ''}
        ${customer.address ? `<p><strong>Address:</strong> ${customer.address}</p>` : ''}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map(line => `
            <tr>
              <td>${line.name}</td>
              <td class="text-right">${line.quantity}</td>
              <td class="text-right">₹${line.price.toLocaleString()}</td>
              <td class="text-right">₹${line.total.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-row subtotal">
          <span>Subtotal:</span>
          <span>₹${subtotal.toLocaleString()}</span>
        </div>
        ${discount > 0 ? `
          <div class="totals-row discount">
            <span>Discount:</span>
            <span>-₹${discount.toLocaleString()}</span>
          </div>
        ` : ''}
        ${bill.gstApplied && gstAmount > 0 ? `
          <div class="totals-row gst">
            <span>GST (${bill.gstRate}%):</span>
            <span>₹${gstAmount.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="totals-row total">
          <span>Total Amount:</span>
          <span>₹${finalTotal.toLocaleString()}</span>
        </div>
        ${creditAmount > 0 ? `
          <div class="totals-row credit">
            <span>Credit Amount:</span>
            <span>₹${creditAmount.toLocaleString()}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Trigger print after content loads
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    alert('Please allow pop-ups to print the invoice');
  }
}
