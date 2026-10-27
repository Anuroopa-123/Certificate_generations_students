# Raventiq Technologies — Certificate Generation & Verification Engine

A corporate, multi-role credential generation and verification platform engineered for **Raventiq Technologies** for college student online internships (1 Week, 2 Weeks, 1 Month, and 6 Months).

---

## 👥 Executive Leadership & Signatories

| Signatory | Executive Role | System Role | Default Login Email | Default Password |
|---|---|---|---|---|
| **Anu** | **Co-Founder & Chief Technology Officer (CTO)** | `superadmin` | `anu@raventiq.com` | `Anu@CTO2026` |
| **Dinesh** | **Co-Founder & Chief Business Officer (CBO)** | `admin` | `dinesh@raventiq.com` | `Dinesh@CBO2026` |

Both signatures, titles, and company designations are automatically cryptographically rendered on every generated landscape PDF certificate along with an individual tamper-evident QR code.

---

## 🛡️ Download Limit & Security Policy (Max 2 Downloads)

1. **Student Download Limit**: Anyone can verify or download the official certificate, but **strictly only twice** (`download_count <= 2`).
2. **Download Limit Exceeded Guard**:
   Once the student has downloaded twice, subsequent download attempts are blocked with a clear warning:
   > *"Download limit reached (maximum 2 downloads allowed). Please contact Raventiq Technologies SuperAdmin (Anu - CTO) or Admin (Dinesh - CBO) to reset your download access."*
3. **Reset Request Workflow**:
   - Students can submit a download reset request directly through the public verification portal.
   - The request appears instantly inside the **Dashboard** under **"Download Reset Requests"**.
   - **Anu (CTO)** or **Dinesh (CBO)** can approve the request with 1-click, instantly resetting the student's counter to `0` and unlocking 2 new downloads.
   - Admins can also click **"Reset Downloads"** on any student row in the certificates table at any time.

---

## 🗄️ PostgreSQL Database Schema (`raventiq_certificates`)

```sql
CREATE TABLE certificates (
    id BIGSERIAL PRIMARY KEY,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    verification_token VARCHAR(128) UNIQUE NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    student_email VARCHAR(150),
    program_name VARCHAR(200) NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    completion_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'valid',
    pdf_path TEXT,
    issued_by BIGINT NOT NULL REFERENCES users(id),
    download_count INT NOT NULL DEFAULT 0,
    max_downloads INT NOT NULL DEFAULT 2,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Running the Project

### 1. Backend (`Node.js + Express + PostgreSQL`)
```bash
cd c:\certificate_generations\backend
npm install
node src/scripts/seed.js   # Seed initial database and users
node src/server.js         # Starts server on http://localhost:5000
```

### 2. Frontend (`Angular 22`)
```bash
cd c:\certificate_generations\frontend
npm install
npm start                  # Starts dev server on http://localhost:4200
```

---

## 🌐 URLs

- **Public Verification & Download Portal**: `http://localhost:4200/verify`
- **Verify Specific Certificate via QR Code**: `http://localhost:4200/verify/<verification_token>`
- **Executive Login**: `http://localhost:4200/login`
- **Admin & SuperAdmin Dashboard**: `http://localhost:4200/dashboard`
- **Backend API Health**: `http://localhost:5000/api/health`
