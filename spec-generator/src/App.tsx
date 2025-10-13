import React, { useState } from 'react';
import SpecGenerator from './components/SpecGenerator';
import { ORACLE_DEFAULTS, ORACLE_FEATURES, ORACLE_GOV } from './data/oracle';
import { CRM_DEFAULTS, CRM_SALES, CRM_SERVICE, CRM_MKT, CRM_PLATFORM, CRM_GOV } from './data/salesforce';

export default function App() {
  const [tab, setTab] = useState<'oracle' | 'crm'>('oracle');
  const [crmStages, setCrmStages] = useState<string>(CRM_DEFAULTS.defaultStages);

  const handleStagesChange = (value: string) => {
    setCrmStages(value);
    const ev = new CustomEvent('sg-set-stages', { detail: value });
    window.dispatchEvent(ev);
  };

  return (
    <>
      <header>
        <h1>🎯 Khairit Spec Builder — Oracle-like Accounting & Salesforce-like CRM</h1>
        <div className="muted">
          IP-safe specification generator for Silca Factor ecosystem. 
          Generate Markdown/JSON specs for Oracle-like accounting and Salesforce-like CRM features.
        </div>
      </header>

      <div className="container">
        <div className="tabs">
          <button className={`tab ${tab === 'oracle' ? 'active' : ''}`} onClick={() => setTab('oracle')}>
            📊 Oracle-like Accounting
          </button>
          <button className={`tab ${tab === 'crm' ? 'active' : ''}`} onClick={() => setTab('crm')}>
            🎫 Salesforce-like CRM
          </button>
        </div>

        {tab === 'oracle' ? (
          <SpecGenerator
            productTitle={ORACLE_DEFAULTS.title}
            intent={ORACLE_DEFAULTS.intent}
            successKPIs={ORACLE_DEFAULTS.successKPIs}
            featureGroups={[
              { label: 'Core Accounting Modules', items: ORACLE_FEATURES },
              { label: 'Governance & Compliance', items: ORACLE_GOV }
            ]}
            extraFields={
              <section className="card">
                <div className="title">3) Implementation Notes</div>
                <div className="muted" style={{ lineHeight: '1.6' }}>
                  <strong>Design Approach:</strong>
                  <ul style={{ marginTop: 8, marginBottom: 0 }}>
                    <li>✅ Clean-room design - original UX and data models</li>
                    <li>✅ No copying of Oracle code, UI, or trademarks</li>
                    <li>✅ Event-sourced ledger for audit trail</li>
                    <li>✅ Multi-dimensional accounting (entity, project, cost center)</li>
                    <li>✅ Configurable workflows and approval rules</li>
                    <li>✅ Arabic RTL support with localization</li>
                  </ul>
                </div>
              </section>
            }
          />
        ) : (
          <SpecGenerator
            productTitle={CRM_DEFAULTS.title}
            intent={CRM_DEFAULTS.intent}
            successKPIs={CRM_DEFAULTS.successKPIs}
            featureGroups={[
              { label: 'Sales Features', items: CRM_SALES },
              { label: 'Service / Support', items: CRM_SERVICE },
              { label: 'Marketing', items: CRM_MKT },
              { label: 'Platform & Data', items: CRM_PLATFORM },
              { label: 'Governance', items: CRM_GOV }
            ]}
            extraFields={
              <section className="card">
                <div className="title">3) Sales Pipeline Stages</div>
                <div className="muted">Comma-separated stages for your sales process</div>
                <input
                  value={crmStages}
                  onChange={(e) => handleStagesChange(e.target.value)}
                  placeholder={CRM_DEFAULTS.defaultStages}
                />
                <div className="muted" style={{ marginTop: 8 }}>
                  Example: {CRM_DEFAULTS.defaultStages}
                </div>
              </section>
            }
          />
        )}

        {/* Footer info */}
        <div className="card" style={{ background: '#0b1220' }}>
          <div className="title">💡 How to Use</div>
          <ol style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: '1.7', marginBottom: 0 }}>
            <li><strong>Fill company context</strong> - Your organization details</li>
            <li><strong>Select features</strong> - Check all capabilities you need</li>
            <li><strong>Add integrations</strong> - External systems to connect</li>
            <li><strong>Generate spec</strong> - Creates detailed requirements document</li>
            <li><strong>Download</strong> - Get Markdown or JSON for your development team</li>
          </ol>
          <div className="muted" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <strong>⚠️ Important:</strong> This tool generates IP-safe specifications. All implementations 
            must use original code and design, without copying proprietary vendor assets.
          </div>
        </div>
      </div>
    </>
  );
}
