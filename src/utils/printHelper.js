export const printThermalReceipt = ({
  studentName,
  registrationNumber,
  pin,
  type = 'NEW', // 'NEW', 'RESET', 'HANDOVER'
  items = [], // For HANDOVER
  liabilityTitle = '', // For HANDOVER
  storeSettings = {}
}) => {
  const printWindow = window.open('', '', 'width=400,height=600');

  let title = 'REGISTRASI BARU';
  if (type === 'RESET') title = 'RESET PIN AKSES';
  if (type === 'HANDOVER') title = 'BUKTI SERAH TERIMA';
  const date = new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const {
    storeName = 'Koperasi SenyumMu',
    storeAddress = 'Jl. Pemandian No. 88 Patemon',
    storeWebsite = ''
  } = storeSettings;

  printWindow.document.write(`
    <html>
      <head>
        <title>Struk Santri - ${registrationNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
          
          body {
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            width: 58mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
            color: #000;
            background: #fff;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          
          .brand {
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          
          .address {
            font-size: 9px;
            color: #333;
          }
          
          .title-box {
            text-align: center;
            margin: 15px 0;
            font-weight: 700;
            font-size: 14px;
            border: 1px solid #000;
            padding: 4px;
            border-radius: 4px;
          }
          
          .content {
            margin: 15px 0;
          }
          
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
          }
          
          .label {
            font-weight: 400;
            color: #444;
          }
          
          .value {
            font-weight: 700;
            text-align: right;
            max-width: 60%;
          }
          
          .credentials-box {
            margin-top: 15px;
            border: 2px solid #000;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
          }
          
          .pin-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          
          .pin-value {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 3px;
          }
          
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #555;
            border-top: 1px dashed #aaa;
            padding-top: 10px;
          }
          
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">${storeName}</div>
          <div class="address">${storeAddress}</div>
        </div>

        <div class="title-box">
          ${title}
        </div>

        <div class="content">
          <div class="row">
            <span class="label">Tanggal</span>
            <span class="value">${date}</span>
          </div>
          <div class="row">
            <span class="label">Nama</span>
            <span class="value">${studentName}</span>
          </div>
          <div class="row">
            <span class="label">No. Reg</span>
            <span class="value">${registrationNumber}</span>
          </div>
        </div>

        ${type === 'HANDOVER' ? `
          <div class="row">
            <span class="label">Tagihan</span>
            <span class="value">${liabilityTitle}</span>
          </div>
          <div style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">
            <div style="font-weight: bold; margin-bottom: 5px;">Barang Diterima:</div>
            ${items.map(item => `
              <div class="row">
                <span class="label">- ${item.name}</span>
                <span class="value">OK</span>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 20px; display: flex; justify-content: space-between; text-align: center;">
             <div>
                <br><br><br>
                (Penerima)
             </div>
             <div>
                <br><br><br>
                (Petugas)
             </div>
          </div>
        ` : `
        <div class="credentials-box">
          <div class="pin-label">PIN AKSES</div>
          <div class="pin-value">${pin}</div>
        </div>
        `}

        <div class="footer">
          <p>HARAP DISIMPAN DENGAN BAIK</p>
          ${storeWebsite ? `<p style="margin-top: 5px;">Gunakan PIN untuk cek tagihan dan pembayaran melalui website : ${storeWebsite}</p>` : ''}
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
