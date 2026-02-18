import jsPDF from 'jspdf';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from './helpers';

export const generateInvoicePDF = (invoice: Invoice): void => {
  const pdf = new jsPDF();

  // Set up colors using the new primary color #03989e
  const primaryColor: [number, number, number] = [3, 152, 158]; // #03989e
  const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const lightGray: [number, number, number] = [156, 163, 175]; // Gray-400

  // Header
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, 210, 40, 'F');

  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Agence de Voyage', 20, 25);

  // Invoice title
  pdf.setTextColor(...textColor);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', 20, 60);

  // Invoice details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 75);
  pdf.text(`Date: ${formatDate(invoice.createdAt || new Date().toISOString())}`, 20, 85);
  pdf.text(`Due Date: ${formatDate(invoice.dueDate || new Date().toISOString())}`, 20, 95);

  // Company details (right side)
  pdf.setFontSize(10);
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.text('123 Travel Street', 140, 60);
  pdf.text('New York, NY 10001', 140, 70);
  pdf.text('Phone: (555) 123-4567', 140, 80);
  pdf.text('Email: info@agencedevoyage.com', 140, 90);

  // Status badge
  const statusColors = {
    draft: [156, 163, 175],
    sent: [3, 152, 158], // Using our primary color
    paid: [34, 197, 94],
    overdue: [239, 68, 68]
  };

  pdf.setFillColor(...(statusColors[invoice.status] || statusColors.draft));
  pdf.roundedRect(140, 95, 30, 8, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoice.status.toUpperCase(), 142, 100);

  // Client information
  pdf.setTextColor(...textColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill To:', 20, 120);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoice.client?.name || 'Unknown Client', 20, 135);

  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.client?.email || '', 20, 145);
  if (invoice.client?.phone) {
    pdf.text(invoice.client.phone, 20, 155);
  }
  if (invoice.client?.address) {
    const addressLines = pdf.splitTextToSize(invoice.client.address, 80);
    pdf.text(addressLines, 20, 165);
  }

  // Agent information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Agent:', 110, 120);

  pdf.setFontSize(12);
  pdf.text(invoice.agentName, 110, 135);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Travel Agent', 110, 145);

  // Items table
  let yPosition = 190;

  // Table header
  pdf.setFillColor(249, 250, 251); // Gray-50
  pdf.rect(20, yPosition - 10, 170, 15, 'F');

  pdf.setTextColor(...textColor);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Description', 25, yPosition - 2);
  pdf.text('Qty', 120, yPosition - 2);
  pdf.text('Unit Price', 140, yPosition - 2);
  pdf.text('Total', 170, yPosition - 2);

  // Table items
  pdf.setFont('helvetica', 'normal');
  yPosition += 10;

  (invoice.items || []).forEach((item, index) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }

    // Alternate row colors
    if (index % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(20, yPosition - 8, 170, 12, 'F');
    }

    pdf.setTextColor(...textColor);

    // Description (with text wrapping)
    const descriptionLines = pdf.splitTextToSize(item.description, 90);
    pdf.text(descriptionLines, 25, yPosition);

    // Quantity
    pdf.text(item.quantity.toString(), 125, yPosition);

    // Unit Price
    pdf.text(formatCurrency(item.unitPrice || 0), 145, yPosition);

    // Total
    pdf.text(formatCurrency(item.total), 175, yPosition);

    yPosition += Math.max(12, descriptionLines.length * 5);
  });

  // Summary section
  yPosition += 20;
  if (yPosition > 230) {
    pdf.addPage();
    yPosition = 30;
  }

  const summaryX = 130;

  // Summary box
  pdf.setFillColor(249, 250, 251);
  pdf.rect(summaryX - 10, yPosition - 10, 70, 50, 'F');

  pdf.setTextColor(...textColor);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  pdf.text('Subtotal:', summaryX, yPosition);
  pdf.text(formatCurrency(invoice.subtotal || 0), summaryX + 40, yPosition);

  pdf.text('Tax:', summaryX, yPosition + 12);
  pdf.text(formatCurrency(invoice.tax || 0), summaryX + 40, yPosition + 12);

  // Total line
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('Total:', summaryX, yPosition + 28);
  pdf.setTextColor(...primaryColor);
  pdf.text(formatCurrency(invoice.total || 0), summaryX + 40, yPosition + 28);

  // Umrah Details
  // We'll place this in a dedicated box
  yPosition += 60;
  if (yPosition > 240) {
    pdf.addPage();
    yPosition = 30;
  }

  // Box background
  pdf.setFillColor(249, 250, 251);
  pdf.rect(20, yPosition - 10, 170, 45, 'F');

  pdf.setTextColor(...textColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Umrah Details', 25, yPosition);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  // Column 1
  if (invoice.passportNumber) pdf.text(`Passport: ${invoice.passportNumber}`, 25, yPosition + 10);
  if (invoice.flightNumber) pdf.text(`Flight: ${invoice.flightNumber}`, 25, yPosition + 20);
  if (invoice.departureDate) pdf.text(`Departure: ${formatDate(invoice.departureDate)}`, 25, yPosition + 30);

  // Column 2
  if (invoice.roomType) pdf.text(`Room Type: ${invoice.roomType}`, 110, yPosition + 10);
  if (invoice.visaStatus) pdf.text(`Visa Status: ${invoice.visaStatus}`, 110, yPosition + 20);
  if (invoice.gender) pdf.text(`Gender: ${invoice.gender}`, 110, yPosition + 30);

  // Use this new position for Notes
  // Use this new position for Notes
  yPosition += 45;

  if (invoice.notes) {
    if (yPosition > 240) {
      pdf.addPage();
      yPosition = 30;
    }

    pdf.setTextColor(...textColor);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes:', 20, yPosition);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const notesLines = pdf.splitTextToSize(invoice.notes, 170);
    pdf.text(notesLines, 20, yPosition + 10);
  }

  // Footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setTextColor(...lightGray);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Thank you for choosing Agence de Voyage!', 20, pageHeight - 30);
  pdf.text('For questions about this invoice, please contact us at billing@agencedevoyage.com', 20, pageHeight - 20);

  // Generate filename and download
  const clientNameSafe = invoice.client?.name || 'Client';
  const filename = `Invoice_${invoice.invoiceNumber}_${clientNameSafe.replace(/\s+/g, '_')}.pdf`;
  pdf.save(filename);
};

export const generateRoomingListPDF = (rooms: any[], allClients: any[]): void => {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Create a temporary container for HTML rendering
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-1000vw'; // High offset instead of -9999px for better rendering
  container.style.width = '800px'; // Set a fixed pixel width for stability
  container.style.backgroundColor = 'white';
  container.dir = 'rtl';

  // Use a cleaner HTML structure with explicit fonts
  let htmlContent = `
    <div style="padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white;">
      <div style="background: #03989e; color: white; padding: 30px; border-radius: 12px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">تقرير لائحة التسكين</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 16px;">Beausejour Voyage</p>
        </div>
        <div style="text-align: left;">
          <p style="margin: 0; font-size: 14px;">التاريخ: ${new Date().toLocaleDateString('ar-MA')}</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 25px;">
  `;

  rooms.forEach((room) => {
    const roomClients = allClients.filter(c =>
      room.assignments?.some((a: any) => a.clientId === c.id)
    );

    htmlContent += `
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <div style="font-weight: bold; font-size: 18px; color: #1e293b;">
            غرفة رقم: <span style="color: #03989e;">${room.roomNumber || '---'}</span>
          </div>
          <div style="color: #64748b;">
            ${room.type === 'Double' ? 'ثنائية' : room.type === 'Triple' ? 'ثلاثية' : room.type === 'Quad' ? 'رباعية' : 'خماسية'} | ${room.hotelName || 'بدون فندق'}
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #f1f5f9;">
              <th style="text-align: right; padding: 12px 20px; color: #475569; font-size: 13px;">الاسم الكامل</th>
              <th style="text-align: right; padding: 12px 20px; color: #475569; font-size: 13px;">رقم الجواز</th>
              <th style="text-align: right; padding: 12px 20px; color: #475569; font-size: 13px;">الجنس</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (roomClients.length === 0) {
      htmlContent += `
            <tr>
              <td colspan="3" style="padding: 30px; text-align: center; color: #94a3b8; font-style: italic;">لا يوجد معتمرين مسكنين</td>
            </tr>
      `;
    } else {
      roomClients.forEach((client) => {
        htmlContent += `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 20px; font-weight: 600; color: #0f172a;">${client.name}</td>
              <td style="padding: 12px 20px; color: #334155;">${client.passportNumber || '---'}</td>
              <td style="padding: 12px 20px; color: #334155;">${client.gender === 'Male' ? 'ذكر' : client.gender === 'Female' ? 'أنثى' : '---'}</td>
            </tr>
        `;
      });
    }

    htmlContent += `
          </tbody>
        </table>
      </div>
    `;
  });

  htmlContent += `
      </div>
      <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #94a3b8; font-size: 12px;">
        جميع الحقوق محفوظة © ${new Date().getFullYear()} Beausejour Voyage
      </div>
    </div>
  `;

  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // Use the callback-based html() which is more reliable for simple usage
  pdf.html(container, {
    callback: function (doc) {
      doc.save(`Rooming_List_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.removeChild(container);
    },
    x: 0,
    y: 0,
    width: 210, // Fit to A4
    windowWidth: 800, // Important for scaling pixels to mm
  });
};