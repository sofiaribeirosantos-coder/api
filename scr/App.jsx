import { useEffect, useMemo, useState } from "react";
import {
  bootstrapMockData,
  login,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getWebhooks,
  createWebhook,
  getUsage,
  getSessionUser
} from "./mockApi";

export default function App() {
  const [logged, setLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("ana@flowpay.com");
  const [password, setPassword] = useState("123456");
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [usage, setUsage] = useState(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookEvent, setNewWebhookEvent] = useState("payment.completed");
  const [newWebhookUrl, setNewWebhookUrl] = useState("https://app.exemplo.com/webhooks");
  const [error, setError] = useState("");

  useEffect(() => {
    bootstrapMockData();
    const sessionUser = getSessionUser();
    if (sessionUser && sessionUser.email) {
      setUser(sessionUser);
      setLogged(true);
    }
  }, []);

  useEffect(() => {
    if (!logged) return;

    const load = async () => {
      const keys = await getApiKeys();
      const hooks = await getWebhooks();
      const usageData = await getUsage();
      setApiKeys(keys);
      setWebhooks(hooks);
      setUsage(usageData);
    };

    load();
  }, [logged]);

  const handleLogin = async () => {
    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setUser(result.user);
    setLogged(true);
    setError("");
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    const next = await createApiKey(newKeyName.trim());
    setApiKeys(next);
    setNewKeyName("");
  };

  const handleRevokeKey = async (id) => {
    const next = await revokeApiKey(id);
    setApiKeys(next);
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    const next = await createWebhook(newWebhookEvent, newWebhookUrl.trim());
    setWebhooks(next);
    setNewWebhookUrl("https://app.exemplo.com/webhooks");
  };

  const usagePercent = useMemo(() => {
    if (!usage) return 0;
    return (usage.requests / usage.limit) * 100;
  }, [usage]);

  if (!logged) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand">
            <span className="logo">F</span>
            <span>FlowPay</span>
          </div>

          <h2>Entrar na conta</h2>

          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label>
            Senha
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          {error && <p className="error">{error}</p>}

          <button onClick={handleLogin}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">F</span>
          <span>FlowPay</span>
        </div>

        <nav>
          <a href="#">Visão geral</a>
          <a href="#">API Keys</a>
          <a href="#">Webhooks</a>
          <a href="#">Uso</a>
          <a href="#">Configurações</a>
        </nav>

        <div className="user-box">
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <h1>Dashboard da API</h1>
          <button className="logout-btn" onClick={() => setLogged(false)}>Sair</button>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Requisições</span>
            <strong>{usage?.requests.toLocaleString() ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Limite</span>
            <strong>{usage?.limit.toLocaleString() ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>API Keys ativas</span>
            <strong>{apiKeys.filter((k) => k.status === "active").length}</strong>
          </div>
          <div className="stat-card">
            <span>Webhooks</span>
            <strong>{webhooks.length}</strong>
          </div>
        </section>

        <section className="usage-section">
          <div className="panel">
            <h3>Uso da API</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${usagePercent}%` }} />
            </div>
            <p>{usagePercent.toFixed(1)}% do limite consumido</p>
          </div>

          <div className="panel">
            <h3>Últimos 7 dias</h3>
            <div className="chart">
              {usage?.last7Days.map((item) => (
                <div key={item.day} className="bar-wrap">
                  <span className="bar" style={{ height: `${(item.value / 30000) * 100}%` }} />
                  <small>{item.day}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="two-columns">
          <div className="panel">
            <h3>API Keys</h3>

            <div className="inline-form">
              <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Nome da chave" />
              <button onClick={handleCreateKey}>Criar</button>
            </div>

            <div className="list">
              {apiKeys.map((key) => (
                <div key={key.id} className="list-item">
                  <div>
                    <strong>{key.name}</strong>
                    <span>{key.status === "active" ? "Ativa" : "Revogada"}</span>
                    <small>{key.token}</small>
                  </div>
                  <button onClick={() => handleRevokeKey(key.id)} className="danger">
                    {key.status === "active" ? "Revogar" : "Revogada"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Webhooks</h3>

            <div className="mini-form">
              <input value={newWebhookEvent} onChange={(e) => setNewWebhookEvent(e.target.value)} placeholder="payment.completed" />
              <input value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} placeholder="https://..." />
              <button onClick={handleCreateWebhook}>Salvar</button>
            </div>

            <div className="list">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="list-item">
                  <div>
                    <strong>{webhook.event}</strong>
                    <small>{webhook.url}</small>
                  </div>
                  <span className="tag">{webhook.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
