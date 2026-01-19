/**
 * Generate professional PIN letters for students
 * Bank-style sealed envelope format
 */

export const printPinLetters = (students, schoolName = 'Koperasi Senyum', websiteUrl = null) => {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Pop-up terblokir! Mohon izinkan pop-up untuk print.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PIN Letter - ${schoolName}</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .pin-letter { page-break-after: always; page-break-inside: avoid; }
          .pin-letter:last-child { page-break-after: auto; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          background: #f5f7fa;
          padding: 20px;
        }
        
        .pin-letter {
          width: 100%;
          max-width: 600px;
          margin: 0 auto 30px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 40px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .header p {
          font-size: 13px;
          opacity: 0.9;
        }
        
        .content {
          padding: 35px 40px;
        }
        
        .greeting {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 12px;
          margin: 25px 0;
          padding: 20px;
          background: #f7fafc;
          border-radius: 6px;
          border-left: 3px solid #667eea;
        }
        
        .info-label {
          font-size: 13px;
          font-weight: 600;
          color: #718096;
        }
        
        .info-value {
          font-size: 13px;
          color: #2d3748;
          font-weight: 500;
        }
        
        .pin-box {
          background: #fff5e6;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 25px 0;
        }
        
        .pin-box h3 {
          color: #92400e;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          font-weight: 700;
        }
        
        .pin-code {
          background: white;
          border: 2px dashed #f59e0b;
          border-radius: 6px;
          padding: 15px;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 6px;
          color: #1f2937;
          font-family: 'Courier New', monospace;
        }
        
        .instructions {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          padding: 18px 20px;
          border-radius: 6px;
          margin-top: 20px;
        }
        
        .instructions h4 {
          color: #1e40af;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .instructions ol {
          margin-left: 18px;
          color: #1e3a8a;
        }
        
        .instructions li {
          font-size: 12px;
          line-height: 1.8;
          margin-bottom: 4px;
        }
        
        .footer {
          background: #f9fafb;
          padding: 20px 40px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
          color: #6b7280;
          line-height: 1.6;
        }
        
        @media print {
          body { background: white; padding: 0; }
          .pin-letter { max-width: none; margin: 0; box-shadow: none; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      ${students.map(student => `
        <div class="pin-letter">
          <div class="header">
            <h1>${schoolName}</h1>
            <p>Informasi Akses Koperasi Sekolah</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <strong>Kepada Yth. ${student.guardianName || 'Wali Santri'}</strong><br>
              Berikut informasi akses sistem koperasi untuk:
            </div>
            
            <div class="info-grid">
              <div class="info-label">Nama Lengkap</div>
              <div class="info-value">${student.fullName}</div>
              
              <div class="info-label">No. Registrasi</div>
              <div class="info-value">${student.registrationNumber}</div>
              
              <div class="info-label">Kelas</div>
              <div class="info-value">${student.className || '-'}</div>
              
              <div class="info-label">Program</div>
              <div class="info-value">${student.program || '-'}</div>
            </div>
            
            <div class="pin-box">
              <h3>⚠️ PIN Rahasia</h3>
              <div class="pin-code">${student.plainPin || 'XXXXXX'}</div>
            </div>
            
            <div class="instructions">
            <h4>📱 Cara Menggunakan:</h4>
              <ol>
                <li>Buka <strong>${websiteUrl || window.location.origin}</strong> dan klik "Cek Tagihan"</li>
                <li>Masukkan <strong>No. Registrasi</strong> dan <strong>PIN</strong> di atas</li>
                <li>Lihat detail tagihan dan riwayat pembayaran santri</li>
                <li>Simpan PIN ini dengan aman, jangan bagikan ke siapapun</li>
              </ol>
            </div>
          </div>
          
          <div class="footer">
            Dicetak pada ${new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}<br>
            Untuk bantuan, hubungi admin koperasi sekolah
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

/**
 * Print single PIN letter (for individual student after creation/reset)
 */
export const printSinglePinLetter = (student, schoolName = 'Koperasi Senyum', websiteUrl = null) => {
  printPinLetters([student], schoolName, websiteUrl);
};
