import type { Bill, Customer, Product } from '../types/local';

export function printInvoice(bill: Bill, customer: Customer) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print invoices');
    return;
  }

  const subtotal = bill.products.reduce((sum, p) => sum + Number(p.price), 0);
  const discount = Number(bill.discount);
  const afterDiscount = subtotal - discount;
  const gstAmount = Number(bill.gstAmount);
  const total = bill.gstApplied ? afterDiscount + gstAmount : afterDiscount;
  const credit = Number(bill.creditAmount);
  const amountDue = Math.max(0, total - credit);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${customer.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-block {
          flex: 1;
        }
        .info-block h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          margin-left: auto;
          width: 300px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .totals-row.final {
          border-top: 2px solid #333;
          font-weight: bold;
          font-size: 18px;
          margin-top: 10px;
          padding-top: 10px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INVOICE</h1>
        <p>Date: ${new Date(Number(bill.timestamp)).toLocaleDateString()}</p>
        <p>Invoice #: ${bill.id.toString()}</p>
      </div>

      <div class="info-section">
        <div class="info-block">
          <h3>BILL TO:</h3>
          <p><strong>${customer.name}</strong></p>
          <p>${customer.address || ''}</p>
          <p>${customer.phoneNumber || ''}</p>
        </div>
        <div class="info-block">
          <h3>FROM:</h3>
          <p><strong>Frontline Distributors</strong></p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Price</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${bill.products.map(product => `
            <tr>
              <td>${product.name}</td>
              <td class="text-right">1</td>
              <td class="text-right">₹${Number(product.price).toLocaleString()}</td>
              <td class="text-right">₹${Number(product.price).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>₹${subtotal.toLocaleString()}</span>
        </div>
        ${discount > 0 ? `
          <div class="totals-row">
            <span>Discount:</span>
            <span>-₹${discount.toLocaleString()}</span>
          </div>
        ` : ''}
        ${bill.gstApplied ? `
          <div class="totals-row">
            <span>GST (${Number(bill.gstRate)}%):</span>
            <span>₹${gstAmount.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="totals-row final">
          <span>Total:</span>
          <span>₹${total.toLocaleString()}</span>
        </div>
        ${credit > 0 ? `
          <div class="totals-row">
            <span>Credit Applied:</span>
            <span>-₹${credit.toLocaleString()}</span>
          </div>
          <div class="totals-row final">
            <span>Amount Due:</span>
            <span>₹${amountDue.toLocaleString()}</span>
          </div>
        ` : ''}
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
