export const CRM_SALES = [
  'Leads (capture, scoring, assignment rules, dedupe)',
  'Accounts & Contacts (hierarchies, roles, 360° view)',
  'Opportunities (stages, products, quotes, forecasting)',
  'Activities (tasks, calls, meetings, follow-ups)',
  'Quoting / Light CPQ (price books, discounts, approvals)',
  'Territories & Routing (round-robin, rules)',
  'Files & Notes (attachments, versions)',
  'Dashboards & Reports (pipeline, conversion, win-rate)',
  'Geo / Maps (accounts on map, route planning)',
  'Mobile-first UI (offline cache for reps)'
];

export const CRM_SERVICE = [
  'Cases / Tickets (email-to-case, web-to-case)',
  'SLAs & Entitlements (priority, timers, escalations)',
  'Knowledge Base (articles, versioning, search)',
  'Customer Portal (case status, KB, community)',
  'Field Service (work orders, schedules, parts)'
];

export const CRM_MKT = [
  'Journeys / Campaigns (multi-step, triggers)',
  'Segmentation (lists, filters, dynamic cohorts)',
  'Email/SMS Studio (templates, A/B, send windows)',
  'MQL/SQL Models (lead grading & handoff)',
  'Attribution (UTM, multi-touch, ROI)'
];

export const CRM_PLATFORM = [
  'Custom Objects & Fields (point-and-click schema)',
  'Automation Builder (workflows, approvals, triggers)',
  'APIs & Webhooks (REST, events)',
  'Import/Export & Data Loader (CSV, SFTP)',
  'AI Assist (forecasting, next-best-action, summaries)'
];

export const CRM_GOV = [
  'RBAC & Profiles (least privilege, impersonation)',
  'Segregation of Duties (reviewable matrices)',
  'Audit Trail (who/what/when, before→after)',
  'Privacy (consents, DSRs, retention, masking)',
  'Backups, DR, Encryption (at rest + in transit)'
];

export const CRM_DEFAULTS = {
  title: 'Salesforce-like CRM',
  intent: 'Build a Salesforce-like CRM via original design (clean-room). No copying code, UI, trademarks, or patents.',
  successKPIs: [
    'Lead→SQL conversion rate ↑',
    'Opportunity win-rate ↑',
    'Average sales cycle ↓',
    'First-response time (cases) ↓',
    'Forecast accuracy ↑',
    'User adoption (weekly active reps) ↑'
  ],
  defaultStages:
    'Lead, Qualified, Discovery, Proposal, Negotiation, Closed Won, Closed Lost'
};
