# Project Context: Serene Villa Property Management System (PMS)

## 1. Project Overview
**Serene Villa Pvt Ltd PMS** is a full-stack multi-property hospitality management and reservation tracking platform designed for boutique luxury resorts in Sri Lanka (Serene Villa - Property 1, and Serene Villa Hiriketiya - Property 2).

The application streamlines guest front-desk operations:
- QR code public self-registration and walk-in/staff reservations.
- Room inventory & status management (Available, Occupied, Maintenance).
- Booking scheduling, multi-night room pricing calculations, and reservation confirmation generation.
- Advance and final payment recording with multiple currencies (LKR, USD, EUR, GBP), dynamic exchange rates, receipt generation, and payment slip uploads.
- Shift handovers with approval workflows to accountant/admin.
- Financial reporting, room-by-room revenue analytics, daily check-in logs, and discount/deletion request authorization workflows.

---

## 2. Technology Stack

### Backend
- **Framework:** Spring Boot 3.x (Java 17/21)
- **Database:** MySQL 8.0 (InnoDB, Asia/Colombo timezone)
- **Data Access:** Spring Data JPA / Hibernate
- **Real-Time Communication:** Spring WebSocket (`RegistrationWebSocketHandler` at `/ws/registrations`)
- **Security:** Spring Security (Permit-all with custom REST authentication and BCrypt password encryption)
- **Utilities:** Lombok, Jackson JSON, Commons IO
- **Build Tool:** Maven (`mvnw`)

### Frontend (Two Deployments sharing single backend)
- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS (Custom dark/modern luxury palette with Slate, Emerald, Cyan accents)
- **Routing:** React Router v6
- **Notifications:** React Hot Toast
- **Icons:** Lucide React
- **Print Utilities:** Custom printable components with CSS `@media print`
- **Deployments:**
  1. `frontend`: Defaults to Property 1 (Main Serene Villa) on Port 80
  2. `frontend-hiriketiya`: Tailored for Property 2 (Hiriketiya branch) on Port 81

### Infrastructure & Deployment
- **Docker & Docker Compose:** Orchestrates MySQL (`db`), Spring Boot (`backend`), and both Vite frontend Nginx containers (`frontend` on 80, `frontend_hiriketiya` on 81).
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`).

---

## 3. Architecture & Folder Structure

```
serene-villa-pvt-ltd/
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/serenevilla/pms/
│       ├── PmsApplication.java
│       ├── config/              # SecurityConfig, WebSocketConfig, DatabaseSeeder
│       ├── controller/          # REST Controllers
│       ├── dto/                 # Data transfer objects (Analytics, Reports, DTOs)
│       ├── handler/             # WebSocket handlers for live sync
│       ├── model/               # JPA Entities (Booking, Payment, Room, etc.)
│       ├── repository/          # Spring Data JPA Repositories
│       └── service/             # Business services (Analytics, Reports, GuestReg)
├── frontend/                    # Property 1 (Main branch PMS)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx              # Routes & guards
│       ├── components/          # Reusable UI & Printable templates
│       ├── context/             # AuthContext, ModalContext
│       ├── data/                # Static lists (countries, nationalities)
│       └── pages/               # Dashboard, Bookings, Rooms, Payments, etc.
├── frontend-hiriketiya/         # Property 2 (Hiriketiya branch PMS)
│   └── src/                     # Same layout, propertyId=2 targeted defaults
└── docker-compose.yml           # Multi-container orchestration
```

---

## 4. Database Schema & Entities

| Entity / Table | Primary Key | Key Fields | Relationships & Notes |
|---|---|---|---|
| `Property` (`properties`) | `id` | `name`, `code`, `totalRooms`, `status` | Multi-tenancy root entity (e.g. ID 1: Serene Villa, ID 2: Hiriketiya). |
| `User` (`users`) | `id` | `username`, `password`, `role`, `propertyId`, `active` | Supports `ADMIN`, `ACCOUNTANT`, `FRONT_OFFICER`. |
| `Room` (`rooms`) | `id` | `roomNumber`, `roomType`, `facilities`, `images`, `status`, `propertyId` | Unique constraint on `(property_id, roomNumber)`. |
| `Booking` (`bookings`) | `id` | `bookingNumber`, `guestRegistrationId`, `roomNumber`, `roomPrices`, `checkInDate`, `checkOutDate`, `totalAmount`, `paymentStatus`, `status`, `propertyId` | Unique constraint on `(property_id, bookingNumber)`. Status: `Confirmed`, `CheckedIn`, `CheckedOut`, `Cancelled`. |
| `GuestRegistration` (`guest_registrations`) | `id` | `guestName`, `passportNumber`, `whatsappNumber`, `nationality`, `guestPhotoPath`, `passportFrontPath`, `passportBackPath`, `checkInDate`, `checkOutDate`, `numberOfNights`, `isHiddenFromFrontOffice`, `propertyId` | Guest personal dossier with photo/passport uploads in LongText/Base64. |
| `Payment` (`payments`) | `id` | `bookingId`, `guestRegistrationId`, `amountInCurrency`, `currency`, `exchangeRate`, `amountLkr`, `paymentMethod`, `paymentType`, `isAdvancePayment`, `accountantTransferStatus`, `propertyId` | Supports partial/advance payments, dynamic status calculation. |
| `Receipt` (`receipts`) | `id` | `receiptNumber`, `paymentId`, `bookingId`, `receiptType`, `propertyId` | Unique receipt tracker for advance and checkout payments. |
| `DailyHandover` (`daily_handovers`) | `id` | `date`, `submittedBy`, `status`, `totalTransactionsCount`, `totalAmountLkrEquivalent`, `transactionsListJson`, `propertyId` | End-of-shift cash/card handover tracking. |
| `DiscountRequest` (`discount_requests`) | `id` | `bookingId`, `requestedDiscount`, `discountAmount`, `status`, `requestedBy`, `approvedBy`, `propertyId` | Front office discount approval workflow. |
| `DeleteRequest` (`delete_requests`) | `id` | `registrationId`, `bookingId`, `reason`, `status`, `requestedBy`, `approvedBy`, `propertyId` | Soft protection before removing sensitive records. |
| `BankSlip` (`bank_slips`) | `id` | `bookingId`, `slipUrl`, `uploadedBy`, `propertyId` | Payment slip attachments. |
| `ExchangeRate` (`exchange_rates`) | `id` | `currency`, `rateToLkr`, `propertyId` | Daily currency conversion rate table. |

---

## 5. User Roles and Permissions

1. **`ADMIN`**
   - Full access across all properties or assigned property.
   - User account management (create staff, toggle active status).
   - Approve / Reject discount requests.
   - Approve / Reject delete requests.
   - System maintenance, report auditing, and hidden record inspections (`/hide-details`).

2. **`ACCOUNTANT`**
   - Review and accept/reject daily handovers.
   - Verify bank slips and payment reconciliations.
   - Access accountant dashboard and financial analytics.

3. **`FRONT_OFFICER`**
   - Manage room statuses, check-in, check-out.
   - Create walk-in reservations and process QR registrations.
   - Record payments (Cash, Card, Bank Transfer) and print receipts / confirmation cards.
   - Request discounts and submit shift handovers.

---

## 6. Core API Endpoints

- **Auth:** `POST /api/auth/login`, `GET /api/auth/users`, `POST /api/auth/users`, `PATCH /api/auth/users/{id}/toggle-status`
- **Rooms:** `GET /api/rooms`, `POST /api/rooms`, `PUT /api/rooms/{id}`, `DELETE /api/rooms/{id}`
- **Bookings:** `GET /api/bookings`, `POST /api/bookings`, `PUT /api/bookings/{id}`, `DELETE /api/bookings/{id}`
- **Guest Registrations:** `GET /api/guest-registrations`, `POST /api/guest-registrations`, `PUT /api/guest-registrations/{id}`
- **Payments & Receipts:** `GET /api/payments`, `POST /api/payments`, `GET /api/receipts`, `POST /api/receipts/generate`
- **Handovers:** `GET /api/handovers`, `POST /api/handovers/submit`, `PUT /api/handovers/{id}/status`
- **Discounts & Deletions:** `GET /api/discount-requests`, `POST /api/discount-requests`, `GET /api/delete-requests`, `POST /api/delete-requests`
- **Reports & Analytics:** `GET /api/reports/summary`, `GET /api/analytics/room-income`, `GET /api/analytics/financial`
- **WebSockets:** `/ws/registrations` for instant real-time synchronization of guest registrations.

---

## 7. Important Business Rules & Preserved Behaviors

1. **Multi-Tenancy Scoping:** All operations are strictly segmented by `propertyId` (1 for Serene Villa, 2 for Hiriketiya). Never mix bookings or room numbers across properties without explicitly passing `propertyId`.
2. **Number Input Handling:** In line with recent commits (`da4a8c2`, `aa9298d`), number spinners and mouse wheel increments are globally disabled on all monetary/exchange inputs to ensure accurate decimal entry.
3. **Payment Status Derivation:** Partial payments must dynamically update booking payment status to `Paid Advance` rather than `Paid`. Only when the sum of payments reaches `totalAmount` does it become `Paid`.
4. **Soft Deletion & Audit Trail:** Critical records (registrations/bookings) use delete requests (`DeleteRequest`) or visibility flags (`isHiddenFromFrontOffice`) rather than raw destructive SQL drops where possible.
5. **Print Formats:** Confirmation letters, advance receipts, and registration printouts must preserve letterhead formatting, high contrast, clean page breaks, and `@media print` CSS visibility.

---

## 8. Areas Requiring Special Care
- **Multi-Room Pricing JSON (`roomPrices`):** Stored as serialized JSON in `Booking.roomPrices`. Any modification must maintain the expected schema `[{"roomNumber":"101","roomType":"Deluxe","price":"150.00"}]`.
- **Large Base64 Payloads:** Guest photo and passport image uploads are transmitted as base64 in `LONGTEXT` columns. `max-file-size` and `max-request-size` are set to 50MB in `application.properties`.
- **Timezone:** Asia/Colombo (`+05:30`) is mandated at both container and Hibernate/Jackson configuration level. Do not switch to UTC or system local without adjusting date comparisons.

