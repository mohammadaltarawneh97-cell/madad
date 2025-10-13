import React, { useMemo, useState, useEffect } from 'react';
import { download } from '../utils/download';

type SpecGeneratorProps = {
  productTitle: string;
  intent: string;
  featureGroups: { label: string; items: string[] }[];
  extraFields?: React.ReactNode;
  successKPIs: string[];
};

type Company = {
  name: string;
  regions: string;
  entities: number;
  currencies: string;
  verticals: string;
  deployment: 'cloud' | 'onprem' | 'hybrid';
  priorities: string;
};

export default function SpecGenerator(props: SpecGeneratorProps) {
  const { productTitle, intent, featureGroups, extraFields, successKPIs } = props;
  const [company, setCompany] = useState<Company>({
    name: 'Silca Factor & Mining Company',
    regions: 'Jordan, Saudi Arabia, GCC',
    entities: 4,
    currencies: 'JOD, SAR, USD',
    verticals: 'Silica Mining, Glass Manufacturing, Smart Agriculture, Retail',
    deployment: 'cloud',
    priorities: 'Multi-entity reporting, Local tax compliance, Real-time dashboards, Faster period close'
  });
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [stages, setStages] = useState<string>('');
  const [integrations, setIntegrations] = useState({ a: 'Banking APIs, WhatsApp Business, Email (Gmail/Outlook)', b: 'ERP Integration, POS Systems, e-Invoicing, Data Warehouse' });
  const [output, setOutput] = useState<string>('');

  const allItems = useMemo(
    () => featureGroups.flatMap(g => g.items),
    [featureGroups]
  );

  const toggle = (id: string) => setChecks(s => ({ ...s, [id]: !s[id] }));
  const selected = allItems.filter(t => checks[t]);

  // Listen for stage updates from App
  useEffect(() => {
    const handler = (e: any) => setStages(e.detail ?? '');
    window.addEventListener('sg-set-stages', handler as any);
    return () => window.removeEventListener('sg-set-stages', handler as any);
  }, []);

  const json = useMemo(() => ({
    product: productTitle,
    intent,
    organization: {
      name: company.name,
      regions: company.regions.split(',').map(s => s.trim()).filter(Boolean),
      legal_entities: company.entities,
      currencies: company.currencies.split(',').map(s => s.trim()).filter(Boolean),
      verticals: company.verticals
    },
    deployment: company.deployment,
    priorities: company.priorities,
    selected_features: selected,
    stages: stages.split(',').map(s => s.trim()).filter(Boolean),
    integrations: { primary: integrations.a, secondary: integrations.b },
    success_kpis: successKPIs
  }), [productTitle, intent, company, selected, stages, integrations, successKPIs]);

  const md = useMemo(() => {
    const bullets = (arr?: string[]) =>
      arr && arr.length ? arr.map(x => `- ${x}`).join('\n') : '- (none)';
    return `# ${productTitle} — Specification (Original, IP-safe)

**Intent:** ${intent}

## 1) Company Context
- Name: ${json.organization.name || '(n/a)'}
- Regions: ${json.organization.regions.join(', ') || '(n/a)'}
- Legal Entities: ${json.organization.legal_entities}
- Currencies: ${json.organization.currencies.join(', ') || '(n/a)'}
- Verticals: ${json.organization.verticals || '(n/a)'}
- Deployment: ${json.deployment}
- Priorities: ${json.priorities || '(n/a)'}

## 2) Selected Features (${json.selected_features.length} selected)
${bullets(json.selected_features)}

## 3) Stages (if applicable)
${bullets(json.stages)}

## 4) Integrations
- Primary: ${json.integrations.primary || '(n/a)'}
- Secondary: ${json.integrations.secondary || '(n/a)'}

## 5) Success KPIs
${bullets(json.success_kpis)}

## 6) Design Principles
- **Original UX & data model** (clean-room), no copying of vendor IP
- **API-first** architecture with REST/GraphQL support
- **Event logs & audit trail** for full traceability
- **Role-based permissions** with segregation of duties
- **Multi-language support** including Arabic RTL
- **Environment hardening**: encryption, backups, DR
- **Reporting & dashboards** with drill-through capabilities
- **Mobile-first** responsive design

## 7) Implementation Approach
- Build from scratch using open-source technologies
- FastAPI/Node.js backend + React/Vue frontend
- PostgreSQL/MongoDB database
- Docker containerization
- Kubernetes-ready deployment
- Comprehensive API documentation
- Automated testing suite

---

*Generated: ${new Date().toISOString()}*
*For: ${json.organization.name}*
`;
  }, [json, productTitle, intent]);

  const generate = () => setOutput(md);

  const dlMd = () => download(`${productTitle.toLowerCase().replace(/\s+/g, '_')}_spec.md`, output || md);
  const dlJson = () => download(`${productTitle.toLowerCase().replace(/\s+/g, '_')}_spec.json`, JSON.stringify(json, null, 2));

  return (
    <>
      <section className="card">
        <div className="title">1) Company Context</div>
        <div className="row cols-2">
          <div>
            <label>Organization Name</label>
            <input value={company.name} onChange={e => setCompany(s => ({ ...s, name: e.target.value }))} placeholder="e.g., Silca Factor & Mining Company" />
          </div>
          <div>
            <label>Regions / Markets</label>
            <input value={company.regions} onChange={e => setCompany(s => ({ ...s, regions: e.target.value }))} placeholder="Jordan, KSA, GCC, EU..." />
          </div>
        </div>
        <div className="row cols-3">
          <div>
            <label>Legal Entities</label>
            <input type="number" min={1} value={company.entities} onChange={e => setCompany(s => ({ ...s, entities: Number(e.target.value) }))} />
          </div>
          <div>
            <label>Currencies</label>
            <input value={company.currencies} onChange={e => setCompany(s => ({ ...s, currencies: e.target.value }))} placeholder="JOD, SAR, USD" />
          </div>
          <div>
            <label>Deployment</label>
            <select value={company.deployment} onChange={e => setCompany(s => ({ ...s, deployment: e.target.value as any }))}>
              <option value="cloud">Cloud</option>
              <option value="onprem">On-Prem</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
        <label>Verticals</label>
        <input value={company.verticals} onChange={e => setCompany(s => ({ ...s, verticals: e.target.value }))} placeholder="Silica Mining, Glass, Smart Agriculture, Retail..." />
        <label>Top Priorities</label>
        <textarea value={company.priorities} onChange={e => setCompany(s => ({ ...s, priorities: e.target.value }))} placeholder="Local tax, multi-entity reporting, dashboards, faster close..." />
      </section>

      <section className="card">
        <div className="title">2) Feature Selection</div>
        {featureGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 12 }}>
            <div className="title" style={{ fontSize: '.98rem' }}>{group.label}</div>
            <div className="grid">
              {group.items.map(item => (
                <div className="chk" key={item}>
                  <input type="checkbox" id={item} checked={!!checks[item]} onChange={() => toggle(item)} />
                  <label htmlFor={item}>{item}</label>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="muted">✅ Select features you want. Implementation will be original (IP-safe). {selected.length} features selected.</div>
      </section>

      {extraFields}

      <section className="card">
        <div className="title">4) Integrations</div>
        <div className="row cols-2">
          <div>
            <label>Primary Integrations</label>
            <input value={integrations.a} onChange={e => setIntegrations(s => ({ ...s, a: e.target.value }))} placeholder="Banking / Payments / Email…" />
          </div>
          <div>
            <label>Secondary Integrations</label>
            <input value={integrations.b} onChange={e => setIntegrations(s => ({ ...s, b: e.target.value }))} placeholder="ERP / POS / eSign / Data warehouse…" />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex">
          <button className="btn primary" onClick={generate}>Generate Specification</button>
          <button className="btn" onClick={dlMd} disabled={!output}>Download Markdown</button>
          <button className="btn" onClick={dlJson} disabled={!output}>Download JSON</button>
        </div>
      </section>

      {output && (
        <section className="card">
          <div className="title">Generated Specification Preview</div>
          <div className="out">{output}</div>
        </section>
      )}
    </>
  );
}
