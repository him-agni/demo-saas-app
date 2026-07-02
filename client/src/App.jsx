import React, { useEffect, useMemo, useState } from 'react';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Flame,
  Rocket,
  Sparkles,
  UserPlus,
  Zap
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [status, setStatus] = useState('Ready for demo telemetry');
  const [loadingAction, setLoadingAction] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const cards = useMemo(() => {
    const data = metrics || {};
    return [
      { label: 'Accounts', value: data.accounts ?? 0, delta: '+12%', icon: UserPlus },
      { label: 'MRR', value: formatCurrency(data.mrr ?? 0), delta: '+8%', icon: BarChart3 },
      { label: 'Feature Events', value: data.featureEvents ?? 0, delta: '+19%', icon: Zap },
      { label: 'Conversion', value: `${data.conversionRate ?? 0}%`, delta: '+3%', icon: CheckCircle2 }
    ];
  }, [metrics]);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const result = await apiRequest('/api/metrics');
      setMetrics(result.metrics);
      setActivity(result.activity);
    } catch (error) {
      setStatus('Backend is not responding yet');
      Sentry.captureException(error);
    }
  }

  async function runAction(actionName, path, eventName, label) {
    setLoadingAction(actionName);
    setStatus(`Sending ${label}...`);

    try {
      const result = await apiRequest(path, { method: 'POST' });
      setMetrics(result.metrics);
      setActivity(result.activity);
      setStatus(result.message);
      posthog.capture(eventName, {
        source: 'demo_button',
        action: actionName,
        app: 'acmeops'
      });
    } catch (error) {
      setStatus(error.message);
      Sentry.captureException(error);
    } finally {
      setLoadingAction('');
    }
  }

  function triggerFrontendError() {
    const error = new Error('Intentional AcmeOps frontend demo error');
    Sentry.captureException(error, {
      tags: { demo_signal: 'frontend_error' },
      extra: { triggeredFrom: 'dashboard_button' }
    });
    posthog.capture('demo_frontend_error', { source: 'demo_button' });
    setStatus('Frontend error captured for Sentry');
    setActivity((current) => [
      { label: 'Frontend error captured', detail: 'Sent intentional Sentry event', severity: 'error' },
      ...current
    ].slice(0, 6));
  }

  function navigateToSection(sectionId) {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Rocket size={22} /></div>
          <div>
            <strong>AcmeOps</strong>
            <span>Production Console</span>
          </div>
        </div>
        <nav className="nav-list">
          <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => navigateToSection('overview')} type="button"><Activity size={18} /> Overview</button>
          <button className={activeSection === 'signals' ? 'active' : ''} onClick={() => navigateToSection('signals')} type="button"><Sparkles size={18} /> Signals</button>
          <button className={activeSection === 'incidents' ? 'active' : ''} onClick={() => navigateToSection('incidents')} type="button"><AlertTriangle size={18} /> Incidents</button>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Release monitored workspace</p>
            <h1>Operations Overview</h1>
          </div>
          <div className="status-pill">
            <span className="pulse" />
            {status}
          </div>
        </header>

        <section id="overview" className="metric-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="metric-card" key={card.label}>
                <div className="metric-icon"><Icon size={20} /></div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.delta} this release</small>
              </article>
            );
          })}
        </section>

        <section id="signals" className="content-grid">
          <div className="panel actions-panel">
            <div className="panel-heading">
              <h2>Demo Telemetry</h2>
              <p>Use these controls during a release demo to create visible signals.</p>
            </div>
            <div className="action-grid">
              <TelemetryButton icon={UserPlus} loading={loadingAction === 'signup'} onClick={() => runAction('signup', '/api/signup', 'demo_signup', 'signup')}>Track signup</TelemetryButton>
              <TelemetryButton icon={CreditCard} loading={loadingAction === 'checkout'} onClick={() => runAction('checkout', '/api/checkout', 'demo_checkout', 'checkout')}>Track checkout</TelemetryButton>
              <TelemetryButton icon={Zap} loading={loadingAction === 'feature'} onClick={() => runAction('feature', '/api/feature-used', 'demo_feature_used', 'feature usage')}>Track feature used</TelemetryButton>
              <TelemetryButton icon={AlertTriangle} loading={loadingAction === 'warning'} onClick={() => runAction('warning', '/api/warning', 'demo_backend_warning', 'warning')}>Trigger warning</TelemetryButton>
              <TelemetryButton icon={Flame} danger onClick={triggerFrontendError}>Trigger frontend error</TelemetryButton>
              <TelemetryButton icon={Flame} danger loading={loadingAction === 'backend-error'} onClick={() => runAction('backend-error', '/api/error', 'demo_backend_error', 'backend error')}>Trigger backend error</TelemetryButton>
            </div>
          </div>

          <div id="incidents" className="panel activity-panel">
            <div className="panel-heading">
              <h2>Live Activity</h2>
              <p>Recent demo events from this app session.</p>
            </div>
            <div className="activity-list">
              {(activity || []).map((item, index) => (
                <div className={`activity-item ${item.severity || 'info'}`} key={`${item.label}-${index}`}>
                  <span />
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function TelemetryButton({ children, danger = false, icon: Icon, loading = false, onClick }) {
  return (
    <button className={danger ? 'action-button danger' : 'action-button'} disabled={loading} onClick={onClick} type="button">
      <Icon size={18} />
      <span>{loading ? 'Sending...' : children}</span>
    </button>
  );
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || 'Request failed');
  }

  return body;
}
