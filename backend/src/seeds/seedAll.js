require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const SALT_ROUNDS = 12;

const departments = [
  { name: 'IT', description: 'Information Technology — systems, infrastructure, and software' },
  { name: 'HR', description: 'Human Resources — recruitment, benefits, and employee relations' },
  { name: 'Finance', description: 'Finance — accounting, budgets, and financial reporting' },
  { name: 'Operations', description: 'Operations — facilities, logistics, and daily operations' },
  { name: 'General', description: 'General — cross-department and miscellaneous requests' },
  { name: 'Marketing', description: 'Marketing — campaigns, branding, and communications' },
  { name: 'Legal', description: 'Legal — contracts, compliance, and regulatory affairs' },
  { name: 'Customer Support', description: 'Customer Support — client issues, feedback, and escalations' },
];

const categories = [
  // IT (8 categories)
  { name: 'Hardware Issue', description: 'Laptop, desktop, printer, and peripheral problems', department: 'IT' },
  { name: 'Software Issue', description: 'Application errors, crashes, and software installation', department: 'IT' },
  { name: 'Network Issue', description: 'Internet, VPN, Wi-Fi, and connectivity problems', department: 'IT' },
  { name: 'Email & Accounts', description: 'Email setup, password resets, and account access', department: 'IT' },
  { name: 'Security Incident', description: 'Suspicious activity, phishing, and data breach reports', department: 'IT' },
  { name: 'New Equipment Request', description: 'Request for new hardware, monitors, or peripherals', department: 'IT' },
  { name: 'Server & Infrastructure', description: 'Server downtime, database issues, and hosting problems', department: 'IT' },
  { name: 'Software License', description: 'License renewals, new software purchases, and upgrades', department: 'IT' },

  // HR (6 categories)
  { name: 'Payroll Inquiry', description: 'Salary, deductions, overtime, and payment questions', department: 'HR' },
  { name: 'Leave Request', description: 'Vacation, sick leave, parental leave, and time-off requests', department: 'HR' },
  { name: 'Onboarding', description: 'New hire setup, orientation, and documentation', department: 'HR' },
  { name: 'Benefits & Insurance', description: 'Health insurance, retirement plans, and benefit enrollment', department: 'HR' },
  { name: 'Training Request', description: 'Professional development, certifications, and workshops', department: 'HR' },
  { name: 'Employee Complaint', description: 'Workplace concerns, conflict resolution, and grievances', department: 'HR' },

  // Finance (5 categories)
  { name: 'Expense Report', description: 'Travel expenses, receipts, and reimbursement submissions', department: 'Finance' },
  { name: 'Budget Request', description: 'Department budget allocation and approval requests', department: 'Finance' },
  { name: 'Invoice Processing', description: 'Vendor invoices, payment processing, and purchase orders', department: 'Finance' },
  { name: 'Tax & Compliance', description: 'Tax filing questions, audits, and compliance inquiries', department: 'Finance' },
  { name: 'Financial Report', description: 'Monthly/quarterly report requests and discrepancies', department: 'Finance' },

  // Operations (5 categories)
  { name: 'Facility Maintenance', description: 'Building repairs, HVAC, plumbing, and electrical issues', department: 'Operations' },
  { name: 'Office Supplies', description: 'Stationery, furniture, and supply replenishment requests', department: 'Operations' },
  { name: 'Room Booking Issue', description: 'Meeting room conflicts, equipment setup, and AV problems', department: 'Operations' },
  { name: 'Parking & Access', description: 'Parking passes, key cards, and building access requests', department: 'Operations' },
  { name: 'Health & Safety', description: 'Safety hazards, fire drills, and compliance concerns', department: 'Operations' },

  // General (3 categories)
  { name: 'General Inquiry', description: 'General questions that do not fit other departments', department: 'General' },
  { name: 'Feedback & Suggestion', description: 'Company improvement ideas and process suggestions', department: 'General' },
  { name: 'Internal Communication', description: 'Announcements, memos, and company-wide requests', department: 'General' },

  // Marketing (4 categories)
  { name: 'Campaign Request', description: 'New marketing campaign setup and creative briefs', department: 'Marketing' },
  { name: 'Brand & Design', description: 'Logo usage, brand guidelines, and design requests', department: 'Marketing' },
  { name: 'Social Media Issue', description: 'Social account problems, post scheduling, and analytics', department: 'Marketing' },
  { name: 'Event Planning', description: 'Company events, trade shows, and sponsorship requests', department: 'Marketing' },

  // Legal (3 categories)
  { name: 'Contract Review', description: 'Vendor contracts, NDAs, and agreement reviews', department: 'Legal' },
  { name: 'Compliance Question', description: 'Regulatory compliance, GDPR, and policy inquiries', department: 'Legal' },
  { name: 'Intellectual Property', description: 'Trademark, patent, and copyright matters', department: 'Legal' },

  // Customer Support (4 categories)
  { name: 'Customer Complaint', description: 'Customer escalations and resolution tracking', department: 'Customer Support' },
  { name: 'Refund Request', description: 'Product returns, refund processing, and credits', department: 'Customer Support' },
  { name: 'Service Outage', description: 'Service disruptions affecting customers', department: 'Customer Support' },
  { name: 'Feature Request', description: 'Customer-requested features and product improvements', department: 'Customer Support' },
];

const users = [
  // Admin (no department)
  { email: 'admin@ticketsys.com', password: 'Admin123!', firstName: 'System', lastName: 'Admin', role: 'admin', department: null },

  // IT Department
  { email: 'it.manager@ticketsys.com', password: 'Manager123!', firstName: 'Ahmet', lastName: 'Yilmaz', role: 'manager', department: 'IT' },
  { email: 'it.worker1@ticketsys.com', password: 'Worker123!', firstName: 'Mehmet', lastName: 'Kaya', role: 'worker', department: 'IT' },
  { email: 'it.worker2@ticketsys.com', password: 'Worker123!', firstName: 'Elif', lastName: 'Demir', role: 'worker', department: 'IT' },

  // HR Department
  { email: 'hr.manager@ticketsys.com', password: 'Manager123!', firstName: 'Ayse', lastName: 'Celik', role: 'manager', department: 'HR' },
  { email: 'hr.worker1@ticketsys.com', password: 'Worker123!', firstName: 'Fatma', lastName: 'Sahin', role: 'worker', department: 'HR' },

  // Finance Department
  { email: 'fin.manager@ticketsys.com', password: 'Manager123!', firstName: 'Ali', lastName: 'Ozturk', role: 'manager', department: 'Finance' },
  { email: 'fin.worker1@ticketsys.com', password: 'Worker123!', firstName: 'Zeynep', lastName: 'Arslan', role: 'worker', department: 'Finance' },

  // Operations Department
  { email: 'ops.manager@ticketsys.com', password: 'Manager123!', firstName: 'Mustafa', lastName: 'Yildiz', role: 'manager', department: 'Operations' },
  { email: 'ops.worker1@ticketsys.com', password: 'Worker123!', firstName: 'Hasan', lastName: 'Acar', role: 'worker', department: 'Operations' },

  // Marketing Department
  { email: 'mkt.manager@ticketsys.com', password: 'Manager123!', firstName: 'Selin', lastName: 'Tas', role: 'manager', department: 'Marketing' },
  { email: 'mkt.worker1@ticketsys.com', password: 'Worker123!', firstName: 'Burak', lastName: 'Koc', role: 'worker', department: 'Marketing' },

  // Customer Support Department
  { email: 'cs.manager@ticketsys.com', password: 'Manager123!', firstName: 'Deniz', lastName: 'Polat', role: 'manager', department: 'Customer Support' },
  { email: 'cs.worker1@ticketsys.com', password: 'Worker123!', firstName: 'Cem', lastName: 'Erdem', role: 'worker', department: 'Customer Support' },

  // Keep legacy test accounts for backward compatibility
  { email: 'manager@ticketsys.com', password: 'Manager123!', firstName: 'IT', lastName: 'Manager', role: 'manager', department: 'IT' },
  { email: 'worker@ticketsys.com', password: 'Worker123!', firstName: 'IT', lastName: 'Worker', role: 'worker', department: 'IT' },
];

const tickets = [
  // IT tickets
  {
    title: 'Laptop screen flickering after update',
    description: 'After the latest Windows update, my laptop screen flickers intermittently every 30 seconds. Dell Latitude 5520, docking station connected. Restarting does not help.',
    category: 'Hardware Issue',
    priority: 'high',
    creatorEmail: 'hr.worker1@ticketsys.com',
    assigneeEmail: 'it.worker1@ticketsys.com',
    status: 'in_progress',
  },
  {
    title: 'Cannot connect to VPN from home',
    description: 'GlobalProtect VPN shows "Gateway not responding" since this morning. Tried reinstalling the client and restarting the router. Other colleagues on the same network have no issues.',
    category: 'Network Issue',
    priority: 'high',
    creatorEmail: 'fin.worker1@ticketsys.com',
    assigneeEmail: 'it.worker2@ticketsys.com',
    status: 'in_progress',
  },
  {
    title: 'Request new monitor for workstation',
    description: 'I need a second 27-inch monitor for my dual-screen setup. Current single monitor is insufficient for financial reporting work. Budget approved by department manager.',
    category: 'New Equipment Request',
    priority: 'low',
    creatorEmail: 'fin.worker1@ticketsys.com',
    assigneeEmail: null,
    status: 'open',
  },
  {
    title: 'Outlook keeps crashing on startup',
    description: 'Microsoft Outlook crashes immediately after launch with error "MAPI was unable to load the information service." Happens since the Office 365 update last Friday. Running on Windows 11.',
    category: 'Software Issue',
    priority: 'medium',
    creatorEmail: 'mkt.worker1@ticketsys.com',
    assigneeEmail: 'it.worker1@ticketsys.com',
    status: 'open',
  },
  {
    title: 'Suspicious phishing email received',
    description: 'Received an email from "support@m1crosoft.com" asking me to verify my credentials. Did not click any links. Forwarded to IT security for analysis. Multiple colleagues received similar messages.',
    category: 'Security Incident',
    priority: 'critical',
    creatorEmail: 'ops.worker1@ticketsys.com',
    assigneeEmail: 'it.worker1@ticketsys.com',
    status: 'in_progress',
  },
  {
    title: 'Adobe Creative Suite license expired',
    description: 'My Adobe CC license expired yesterday. I need Photoshop and Illustrator for the Q2 campaign materials. Renewal was supposed to be automatic.',
    category: 'Software License',
    priority: 'high',
    creatorEmail: 'mkt.worker1@ticketsys.com',
    assigneeEmail: 'it.worker2@ticketsys.com',
    status: 'on_hold',
  },

  // HR tickets
  {
    title: 'Annual leave balance discrepancy',
    description: 'My leave balance shows 5 days but I should have 12 remaining. I only took 3 days in January and started the year with 15 days. Please verify and correct.',
    category: 'Leave Request',
    priority: 'medium',
    creatorEmail: 'it.worker1@ticketsys.com',
    assigneeEmail: 'hr.worker1@ticketsys.com',
    status: 'in_progress',
  },
  {
    title: 'New hire onboarding — Seda Korkmaz',
    description: 'Seda Korkmaz starts in Marketing on March 15. Need: laptop, email, badge, parking, desk assignment, orientation schedule. Manager: Selin Tas.',
    category: 'Onboarding',
    priority: 'medium',
    creatorEmail: 'mkt.manager@ticketsys.com',
    assigneeEmail: 'hr.worker1@ticketsys.com',
    status: 'open',
  },
  {
    title: 'Health insurance card not received',
    description: 'Applied for the supplemental health insurance 3 weeks ago but still have not received my card. The policy should be active since February 1.',
    category: 'Benefits & Insurance',
    priority: 'medium',
    creatorEmail: 'cs.worker1@ticketsys.com',
    assigneeEmail: null,
    status: 'open',
  },

  // Finance tickets
  {
    title: 'March expense report — Istanbul conference',
    description: 'Submitting expense report for Istanbul Tech Conference (Feb 25-27). Total: 4,850 TL including flights, hotel, meals, and taxi. Receipts attached.',
    category: 'Expense Report',
    priority: 'medium',
    creatorEmail: 'it.manager@ticketsys.com',
    assigneeEmail: 'fin.worker1@ticketsys.com',
    status: 'in_progress',
  },
  {
    title: 'Q2 IT department budget increase request',
    description: 'Requesting 15% budget increase for Q2 to cover: 10 new laptops for expansion, server migration costs, and cybersecurity tool subscriptions. Detailed breakdown in the attached spreadsheet.',
    category: 'Budget Request',
    priority: 'high',
    creatorEmail: 'it.manager@ticketsys.com',
    assigneeEmail: null,
    status: 'open',
  },

  // Operations tickets
  {
    title: 'Air conditioning broken on 3rd floor',
    description: 'The AC unit on the 3rd floor east wing has been blowing warm air since Monday. Temperature measured at 28°C. Affecting approximately 40 employees.',
    category: 'Facility Maintenance',
    priority: 'high',
    creatorEmail: 'it.worker2@ticketsys.com',
    assigneeEmail: 'ops.worker1@ticketsys.com',
    status: 'in_progress',
  },
  {
    title: 'Meeting room B projector not working',
    description: 'The projector in Meeting Room B shows "No Signal" regardless of which cable or laptop is used. Important client presentation scheduled for Wednesday.',
    category: 'Room Booking Issue',
    priority: 'high',
    creatorEmail: 'mkt.manager@ticketsys.com',
    assigneeEmail: 'ops.worker1@ticketsys.com',
    status: 'open',
  },
  {
    title: 'Parking pass for new employee',
    description: 'Need a parking pass for Seda Korkmaz starting March 15 in Marketing. Preferred spot: underground lot B.',
    category: 'Parking & Access',
    priority: 'low',
    creatorEmail: 'mkt.manager@ticketsys.com',
    assigneeEmail: null,
    status: 'open',
  },

  // Marketing tickets
  {
    title: 'Spring campaign landing page review',
    description: 'The spring promotion landing page draft is ready for internal review. Need feedback from the team before going live on March 10. URL shared in Slack.',
    category: 'Campaign Request',
    priority: 'medium',
    creatorEmail: 'mkt.worker1@ticketsys.com',
    assigneeEmail: null,
    status: 'open',
  },

  // Customer Support tickets
  {
    title: 'Customer escalation — order #4521 delayed',
    description: 'Premium customer (ABC Corp) reports order #4521 is 5 days overdue. Customer is threatening to cancel their annual contract worth 150,000 TL. Needs immediate resolution.',
    category: 'Customer Complaint',
    priority: 'critical',
    creatorEmail: 'cs.worker1@ticketsys.com',
    assigneeEmail: 'cs.worker1@ticketsys.com',
    status: 'in_progress',
  },
  {
    title: 'Refund request — duplicate charge on invoice #8832',
    description: 'Customer Bright Solutions was charged twice for the same service on invoice #8832. Amount: 2,400 TL. Customer provided bank statement as proof.',
    category: 'Refund Request',
    priority: 'high',
    creatorEmail: 'cs.worker1@ticketsys.com',
    assigneeEmail: null,
    status: 'open',
  },

  // Closed tickets (for history demonstration)
  {
    title: 'Install antivirus on new laptops',
    description: 'Batch install of Crowdstrike Falcon on 15 new Dell laptops for the Q1 hiring wave. All laptops in IT storage room.',
    category: 'Software Issue',
    priority: 'medium',
    creatorEmail: 'it.manager@ticketsys.com',
    assigneeEmail: 'it.worker2@ticketsys.com',
    status: 'closed',
  },
  {
    title: 'February payroll correction for overtime',
    description: 'Overtime hours for 3 Operations team members were not included in February payroll. Affected: Hasan Acar (12h), plus two others. Corrected in supplemental run.',
    category: 'Payroll Inquiry',
    priority: 'high',
    creatorEmail: 'ops.manager@ticketsys.com',
    assigneeEmail: 'hr.worker1@ticketsys.com',
    status: 'closed',
  },
];

async function seedAll() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Disable FK checks for clean reset
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE ticket_history');
    await connection.execute('TRUNCATE TABLE tickets');
    await connection.execute('TRUNCATE TABLE categories');
    await connection.execute('TRUNCATE TABLE users');
    await connection.execute('TRUNCATE TABLE departments');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Cleared existing data\n');

    // --- Departments ---
    const deptMap = {};
    for (const dept of departments) {
      const [result] = await connection.execute(
        'INSERT INTO departments (name, description) VALUES (?, ?)',
        [dept.name, dept.description]
      );
      deptMap[dept.name] = result.insertId;
    }
    console.log(`Seeded ${departments.length} departments`);

    // --- Categories ---
    const catMap = {};
    for (const cat of categories) {
      const deptId = deptMap[cat.department];
      const [result] = await connection.execute(
        'INSERT INTO categories (name, description, department_id) VALUES (?, ?, ?)',
        [cat.name, cat.description, deptId]
      );
      catMap[cat.name] = result.insertId;
    }
    console.log(`Seeded ${categories.length} categories`);

    // --- Users ---
    const userMap = {};
    for (const u of users) {
      const [roles] = await connection.execute('SELECT id FROM roles WHERE name = ?', [u.role]);
      const deptId = u.department ? deptMap[u.department] : null;
      const hash = await bcrypt.hash(u.password, SALT_ROUNDS);

      const [result] = await connection.execute(
        `INSERT INTO users (email, password_hash, first_name, last_name, role_id, department_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [u.email, hash, u.firstName, u.lastName, roles[0].id, deptId]
      );
      userMap[u.email] = result.insertId;
    }
    console.log(`Seeded ${users.length} users`);

    // --- Tickets & History ---
    const statusPath = {
      open: [],
      in_progress: ['in_progress'],
      on_hold: ['in_progress', 'on_hold'],
      closed: ['in_progress', 'closed'],
    };

    let ticketCount = 0;
    let historyCount = 0;

    for (const t of tickets) {
      const catId = catMap[t.category];
      const creatorId = userMap[t.creatorEmail];
      const assigneeId = t.assigneeEmail ? userMap[t.assigneeEmail] : null;

      // Find department from category
      const [catRows] = await connection.execute('SELECT department_id FROM categories WHERE id = ?', [catId]);
      const deptId = catRows[0].department_id;

      // Insert ticket at final state
      const [result] = await connection.execute(
        `INSERT INTO tickets (title, description, category_id, priority, status, created_by, assigned_to, department_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.title, t.description, catId, t.priority, t.status, creatorId, assigneeId, deptId]
      );
      const ticketId = result.insertId;
      ticketCount++;

      // Generate history for status transitions
      const transitions = statusPath[t.status] || [];
      let prevStatus = 'open';
      const changerEmail = t.assigneeEmail || t.creatorEmail;
      const changerId = userMap[changerEmail];

      for (const nextStatus of transitions) {
        await connection.execute(
          `INSERT INTO ticket_history (ticket_id, changed_by, field_changed, old_value, new_value)
           VALUES (?, ?, 'status', ?, ?)`,
          [ticketId, changerId, prevStatus, nextStatus]
        );
        prevStatus = nextStatus;
        historyCount++;
      }

      // Generate history for assignment if assigned
      if (assigneeId) {
        const managerEmail = Object.keys(userMap).find((email) => {
          const u = users.find((usr) => usr.email === email);
          return u && u.role === 'manager' && u.department === t.category && false;
        });
        // Use the IT manager or admin as assigner for simplicity
        const assignerId = userMap['admin@ticketsys.com'];
        await connection.execute(
          `INSERT INTO ticket_history (ticket_id, changed_by, field_changed, old_value, new_value)
           VALUES (?, ?, 'assigned_to', NULL, ?)`,
          [ticketId, assignerId, String(assigneeId)]
        );
        historyCount++;
      }
    }
    console.log(`Seeded ${ticketCount} tickets with ${historyCount} history entries`);

    // --- Summary ---
    console.log('\n========================================');
    console.log('  Seed completed successfully!');
    console.log('========================================\n');
    console.log('Test Credentials:');
    console.log('──────────────────────────────────────────────────────────');
    console.log('Admin:           admin@ticketsys.com        / Admin123!');
    console.log('IT Manager:      it.manager@ticketsys.com   / Manager123!');
    console.log('IT Worker 1:     it.worker1@ticketsys.com   / Worker123!');
    console.log('IT Worker 2:     it.worker2@ticketsys.com   / Worker123!');
    console.log('HR Manager:      hr.manager@ticketsys.com   / Manager123!');
    console.log('HR Worker:       hr.worker1@ticketsys.com   / Worker123!');
    console.log('Finance Manager: fin.manager@ticketsys.com  / Manager123!');
    console.log('Finance Worker:  fin.worker1@ticketsys.com  / Worker123!');
    console.log('Ops Manager:     ops.manager@ticketsys.com  / Manager123!');
    console.log('Ops Worker:      ops.worker1@ticketsys.com  / Worker123!');
    console.log('Mkt Manager:     mkt.manager@ticketsys.com  / Manager123!');
    console.log('Mkt Worker:      mkt.worker1@ticketsys.com  / Worker123!');
    console.log('CS Manager:      cs.manager@ticketsys.com   / Manager123!');
    console.log('CS Worker:       cs.worker1@ticketsys.com   / Worker123!');
    console.log('──────────────────────────────────────────────────────────');
    console.log('Legacy aliases: manager@ticketsys.com, worker@ticketsys.com');
    console.log('──────────────────────────────────────────────────────────');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedAll();
