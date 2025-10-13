export const ORACLE_FEATURES = [
  'General Ledger (multi-entity, multi-currency, dimensions)',
  'Accounts Payable — invoices, payments, approvals',
  'Accounts Receivable — billing, collections, aging',
  'Fixed Assets — acquisition, depreciation, disposal',
  'Tax Engine (VAT, WHT) with configurable rules',
  'Period Close — checklist, locks, auto-reversals',
  'Cash & Bank Management + Auto Reconciliation',
  'Financial & Management Reporting + Designer',
  'Group Consolidation & Intercompany Eliminations',
  'Intercompany transactions + auto settlements',
  'Projects (WBS, capitalization, revenue recognition)',
  'Inventory & Costing (FIFO/AVG, 3-way match)',
  'Procurement (RFQ → PO → Receipt → Invoice)',
  'Expenses & Travel with policy rules',
  'Workflow Engine & Business Rules',
  'APIs & Webhooks for Enterprise Integration',
  'AI/ML (OCR for invoices, anomaly detection)',
  'Localization: multi-language, RTL, local calendars'
];

export const ORACLE_GOV = [
  'RBAC & Segregation of Duties',
  'Full Audit Trail (who/what/when, before→after)',
  'Period & Ledger Locks',
  'Attachments on every transaction',
  'Backups & Encryption (at rest + in transit)',
  'Monitoring & Security Alerts',
  'XBRL / Excel / PDF exports & local tax reports',
  'Data Residency options'
];

export const ORACLE_DEFAULTS = {
  title: 'Oracle-like Accounting System',
  intent: 'We want Oracle-like capabilities via original (clean-room) design — no copying code, UI, trademarks, or patents.',
  successKPIs: [
    'Monthly close ≤ 3 days',
    'Bank reconciliation automation ≥ 95%',
    'Local VAT/WHT coverage 100%',
    'Invoice approval time ↓ 60%',
    'Financial report accuracy ≥ 99.5%'
  ]
};
