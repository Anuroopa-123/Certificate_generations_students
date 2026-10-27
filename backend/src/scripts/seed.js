const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');

async function seedDatabase() {
  console.log('--- Seeding Raventiq Technologies Database ---');
  try {
    // 1. Seed Users
    const anuPassword = await bcrypt.hash('Anu@CTO2026', 10);
    const dineshPassword = await bcrypt.hash('Dinesh@CBO2026', 10);

    const userCheck = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      const anuRes = await db.query(
        `INSERT INTO users (name, email, password_hash, role, designation, phone, signature_title)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          'Anu',
          'anu@raventiq.com',
          anuPassword,
          'superadmin',
          'Co-Founder & Chief Technology Officer (CTO)',
          '+91 98765 43210',
          'Co-Founder & CTO'
        ]
      );

      const dineshRes = await db.query(
        `INSERT INTO users (name, email, password_hash, role, designation, phone, signature_title)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          'Dinesh',
          'dinesh@raventiq.com',
          dineshPassword,
          'admin',
          'Co-Founder & Chief Business Officer (CBO)',
          '+91 98765 43211',
          'Co-Founder & CBO'
        ]
      );

      console.log('Created Users: Anu (SuperAdmin/CTO) and Dinesh (Admin/CBO)');
      const anuId = anuRes.rows[0].id;
      const dineshId = dineshRes.rows[0].id;

      // 2. Seed Initial Sample Certificates for testing
      const sampleCertificates = [
        {
          student_name: 'Priya Sharma',
          student_email: 'priya.sharma@example.com',
          program_name: 'Full Stack Web Development & Cloud Architecture',
          certificate_type: '1 Month Internship',
          issue_date: '2026-03-15',
          completion_date: '2026-04-15',
          issued_by: anuId,
          download_count: 0
        },
        {
          student_name: 'Rahul Verma',
          student_email: 'rahul.verma@example.com',
          program_name: 'Artificial Intelligence & Deep Learning Systems',
          certificate_type: '6 Months Internship',
          issue_date: '2025-10-01',
          completion_date: '2026-04-01',
          issued_by: dineshId,
          download_count: 1
        },
        {
          student_name: 'Aishwarya Rajesh',
          student_email: 'aishwarya.r@example.com',
          program_name: 'Data Science & Machine Learning Bootcamp',
          certificate_type: '2 Weeks Internship',
          issue_date: '2026-04-01',
          completion_date: '2026-04-14',
          issued_by: anuId,
          download_count: 2 // Reached limit! Demonstrates the warning & reset request
        },
        {
          student_name: 'Karthik Raja',
          student_email: 'karthik.raja@example.com',
          program_name: 'Modern Angular & Responsive Web Interfaces',
          certificate_type: '1 Week Internship',
          issue_date: '2026-04-10',
          completion_date: '2026-04-17',
          issued_by: dineshId,
          download_count: 0
        }
      ];

      for (let i = 0; i < sampleCertificates.length; i++) {
        const item = sampleCertificates[i];
        const certNumber = `RT-INT-2026-${String(i + 1).padStart(4, '0')}`;
        const token = crypto.randomBytes(32).toString('hex'); // 64 chars

        const certRes = await db.query(
          `INSERT INTO certificates 
           (certificate_number, verification_token, student_name, student_email, program_name, 
            certificate_type, issue_date, completion_date, status, issued_by, download_count, max_downloads)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'valid', $9, $10, 2) RETURNING id`,
          [
            certNumber,
            token,
            item.student_name,
            item.student_email,
            item.program_name,
            item.certificate_type,
            item.issue_date,
            item.completion_date,
            item.issued_by,
            item.download_count
          ]
        );

        // If download_count == 2, create a sample reset request to demonstrate approval workflow
        if (item.download_count === 2) {
          await db.query(
            `INSERT INTO download_reset_requests 
             (certificate_id, student_name, student_email, certificate_number, reason, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [
              certRes.rows[0].id,
              item.student_name,
              item.student_email,
              certNumber,
              'I accidentally lost my downloaded file due to laptop formatting. Kindly reset my download limit so I can attach it to my job application.'
            ]
          );
        }
      }

      console.log('Sample certificates and reset requests seeded successfully.');
    } else {
      console.log('Users already exist in database, skipping seed.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();
