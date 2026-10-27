const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate a professional landscape A4 internship certificate for Raventiq Technologies.
 * @param {Object} cert Certificate details
 * @param {string} verifyUrl URL for QR code verification
 * @returns {Promise<Buffer>}
 */
async function generateCertificatePdf(cert, verifyUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create landscape A4 PDF: 841.89 x 595.28 points
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
        info: {
          Title: `Certificate - ${cert.student_name} - Raventiq Technologies`,
          Author: 'Raventiq Technologies',
          Subject: `Internship Completion Certificate for ${cert.program_name}`,
          Keywords: 'Raventiq Technologies, Internship, Certificate, Verification',
          Creator: 'Raventiq Technologies Credential Engine'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const width = 841.89;
      const height = 595.28;

      // Generate QR Code Buffer
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 140,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

      // 1. Background Fill (Subtle warm off-white cream)
      doc.rect(0, 0, width, height).fill('#fafbfc');

      // 2. Elegant Double Border Frame
      // Outer border
      doc.rect(20, 20, width - 40, height - 40)
        .lineWidth(4)
        .stroke('#0f2b48'); // Rich navy

      // Inner thin gold border
      doc.rect(28, 28, width - 56, height - 56)
        .lineWidth(1.5)
        .stroke('#b45309'); // Amber gold

      // Decorative inner dotted frame
      doc.rect(34, 34, width - 68, height - 68)
        .lineWidth(0.5)
        .dash(4, { space: 3 })
        .stroke('#94a3b8');
      doc.undash();

      // Corner ornamental corner accents
      const drawCorner = (x, y, flipX = 1, flipY = 1) => {
        doc.save();
        doc.translate(x, y);
        doc.scale(flipX, flipY);
        doc.lineWidth(1.5).strokeColor('#b45309');
        doc.moveTo(0, 0).lineTo(25, 0).stroke();
        doc.moveTo(0, 0).lineTo(0, 25).stroke();
        doc.circle(8, 8, 3).fillAndStroke('#0f2b48', '#b45309');
        doc.restore();
      };
      drawCorner(38, 38, 1, 1);
      drawCorner(width - 38, 38, -1, 1);
      drawCorner(38, height - 38, 1, -1);
      drawCorner(width - 38, height - 38, -1, -1);

      // 3. Header Ribbon / Badge
      doc.circle(width / 2, 60, 20).fill('#0f2b48');
      doc.circle(width / 2, 60, 16).lineWidth(1).stroke('#d97706');
      doc.fillColor('#fbbf24').fontSize(16).text('★', width / 2 - 7, 51);

      // 4. Company Name & Subtitle
      doc.font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#0f2b48')
        .text('RAVENTIQ TECHNOLOGIES', 0, 88, { align: 'center', characterSpacing: 2 });

      doc.font('Helvetica')
        .fontSize(9.5)
        .fillColor('#64748b')
        .text('EXCELLENCE IN ENGINEERING, RESEARCH & DIGITAL INNOVATION', 0, 116, { align: 'center', characterSpacing: 1.5 });

      // Gold divider line
      doc.lineWidth(1.5)
        .strokeColor('#b45309')
        .moveTo(width / 2 - 140, 132)
        .lineTo(width / 2 + 140, 132)
        .stroke();

      // 5. Certificate Title
      doc.font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#1e3a8a')
        .text('CERTIFICATE OF INTERNSHIP COMPLETION', 0, 146, { align: 'center', characterSpacing: 1 });

      // 6. Presentation Text
      doc.font('Helvetica')
        .fontSize(11)
        .fillColor('#475569')
        .text('This is proudly presented to', 0, 178, { align: 'center' });

      // 7. Student Name
      doc.font('Helvetica-Bold')
        .fontSize(26)
        .fillColor('#0f172a')
        .text(cert.student_name.toUpperCase(), 0, 196, { align: 'center', characterSpacing: 1 });

      // Name underline
      doc.lineWidth(1)
        .strokeColor('#cbd5e1')
        .moveTo(width / 2 - 180, 228)
        .lineTo(width / 2 + 180, 228)
        .stroke();

      // 8. Body Text
      const completionDateFormatted = new Date(cert.completion_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const issueDateFormatted = new Date(cert.issue_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const bodyText = `for successfully completing the comprehensive online internship in ` +
        `"${cert.program_name}" (${cert.certificate_type}) from Raventiq Technologies on ${completionDateFormatted}. ` +
        `During the training, the candidate displayed commendable dedication, technical proficiency, and active problem-solving skills under the mentorship of executive leadership.`;

      doc.font('Helvetica')
        .fontSize(11)
        .fillColor('#334155')
        .text(bodyText, 110, 242, {
          align: 'center',
          lineGap: 4,
          width: width - 220
        });

      // 9. Certificate Credential Bar (Box in center bottom)
      const credBoxY = 328;
      doc.roundedRect(width / 2 - 200, credBoxY, 400, 26, 4)
        .fillAndStroke('#f1f5f9', '#cbd5e1');

      doc.font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#1e293b')
        .text(`Certificate No: ${cert.certificate_number}   |   Issued: ${issueDateFormatted}   |   Status: VALID`, 0, credBoxY + 8, { align: 'center' });

      // 10. Left Signature: Anu (Co-Founder & CTO)
      const sigLeftX = 110;
      const sigY = 385;

      // Signature graphic cursive representation
      doc.font('Times-Italic')
        .fontSize(22)
        .fillColor('#1e40af')
        .text('Anu', sigLeftX + 50, sigY + 5);

      // Signature line
      doc.lineWidth(1)
        .strokeColor('#0f2b48')
        .moveTo(sigLeftX, sigY + 40)
        .lineTo(sigLeftX + 180, sigY + 40)
        .stroke();

      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0f172a')
        .text('Anu', sigLeftX, sigY + 46, { width: 180, align: 'center' });

      doc.font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#b45309')
        .text('Co-Founder & Chief Technology Officer (CTO)', sigLeftX - 10, sigY + 60, { width: 200, align: 'center' });

      doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text('Raventiq Technologies', sigLeftX, sigY + 73, { width: 180, align: 'center' });

      // 11. Center QR Code & Digital Verification Stamp
      const qrSize = 75;
      const qrX = width / 2 - qrSize / 2;
      const qrY = sigY - 10;
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      doc.font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#0f2b48')
        .text('SCAN TO VERIFY', 0, qrY + qrSize + 4, { align: 'center' });

      doc.font('Helvetica')
        .fontSize(6.5)
        .fillColor('#64748b')
        .text(`Token: ${cert.verification_token.substring(0, 16)}...`, 0, qrY + qrSize + 15, { align: 'center' });

      // 12. Right Signature: Dinesh (Co-Founder & CBO)
      const sigRightX = width - 110 - 180;

      // Signature graphic cursive representation
      doc.font('Times-Italic')
        .fontSize(22)
        .fillColor('#1e40af')
        .text('Dinesh', sigRightX + 45, sigY + 5);

      // Signature line
      doc.lineWidth(1)
        .strokeColor('#0f2b48')
        .moveTo(sigRightX, sigY + 40)
        .lineTo(sigRightX + 180, sigY + 40)
        .stroke();

      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0f172a')
        .text('Dinesh', sigRightX, sigY + 46, { width: 180, align: 'center' });

      doc.font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#b45309')
        .text('Co-Founder & Chief Business Officer (CBO)', sigRightX - 10, sigY + 60, { width: 200, align: 'center' });

      doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text('Raventiq Technologies', sigRightX, sigY + 73, { width: 180, align: 'center' });

      // 13. Footer Notice
      doc.font('Helvetica')
        .fontSize(7)
        .fillColor('#94a3b8')
        .text(
          `Official Raventiq Technologies Credential • Tamper-Evident Digital Security • Authorized Signatories Anu (CTO) & Dinesh (CBO)`,
          0,
          height - 48,
          { align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePdf };
