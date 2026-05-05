import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Introduce un usuario"); return; }
    if (password.length < 4) { setError("La contraseña es demasiado corta"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Credenciales inválidas"); return; }
      localStorage.setItem("token", data.token);
      if (remember) localStorage.setItem("remember", "1");
      navigate("/");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-stage {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          overflow: hidden;
          background:
            radial-gradient(900px 600px at 85% -10%, hsl(297 90% 92% / 0.85), transparent 60%),
            radial-gradient(700px 500px at -10% 110%, hsl(260 100% 95% / 0.9), transparent 60%),
            hsl(300 20% 99%);
        }
        .login-stage::before, .login-stage::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.55;
          pointer-events: none;
        }
        .login-stage::before {
          width: 380px; height: 380px;
          top: -120px; right: -80px;
          background: hsl(297 90% 87%);
        }
        .login-stage::after {
          width: 320px; height: 320px;
          bottom: -100px; left: -60px;
          background: hsl(280 90% 90%);
        }
        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: hsl(0 0% 100%);
          border: 1px solid hsl(300 20% 90%);
          border-radius: 28px;
          padding: 40px 36px 32px;
          box-shadow:
            0 1px 2px hsl(297 50% 70% / 0.08),
            0 24px 60px -20px hsl(297 80% 70% / 0.35),
            0 8px 24px -12px hsl(280 60% 60% / 0.18);
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          height: 44px;
          background: hsl(300 20% 99%);
          border: 1px solid hsl(300 20% 90%);
          border-radius: 9999px;
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .login-input-wrap:focus-within {
          border-color: hsl(297 90% 60%);
          box-shadow: 0 0 0 3px hsl(297 90% 87% / 0.55);
          background: #fff;
        }
        .login-input-wrap input {
          flex: 1;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-family: inherit;
          font-size: 14.5px;
          color: hsl(222 47% 11%);
          padding: 0 18px;
          min-width: 0;
        }
        .login-input-wrap input::placeholder { color: hsl(215 16% 47%); }
        .login-check input[type="checkbox"] {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 1.5px solid hsl(300 20% 90%);
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          transition: background 140ms ease, border-color 140ms ease;
        }
        .login-check input[type="checkbox"]:checked {
          background: hsl(297 90% 87%);
          border-color: hsl(297 90% 87%);
        }
        .login-check input[type="checkbox"]:checked::after {
          content: "";
          width: 10px; height: 10px;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234A1457' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
          background-size: contain;
          background-repeat: no-repeat;
        }
        .login-btn {
          width: 100%;
          height: 48px;
          border: 0;
          border-radius: 9999px;
          background: hsl(297 90% 87%);
          color: hsl(270 60% 20%);
          font-family: inherit;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 160ms ease, transform 120ms ease;
          box-shadow: 0 8px 20px -10px hsl(297 90% 70% / 0.7);
          margin-top: 6px;
        }
        .login-btn:hover:not(:disabled) { background: hsl(297 90% 82%); }
        .login-btn:active:not(:disabled) { transform: translateY(1px); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid hsl(270 60% 20% / 0.25);
          border-top-color: hsl(270 60% 20%);
          border-radius: 50%;
          animation: login-spin 0.8s linear infinite;
        }
        @keyframes login-spin { to { transform: rotate(360deg); } }
        .login-alert {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid transparent;
          animation: login-pop 200ms ease;
          color: hsl(0 70% 35%);
          background: hsl(0 80% 96%);
          border-color: hsl(0 70% 88%);
        }
        @keyframes login-pop {
          from { transform: translateY(-4px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (max-width: 480px) {
          .login-card { padding: 32px 22px 26px; border-radius: 24px; }
        }
      `}</style>

      <div className="login-stage">
        <main className="login-card">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <img src="/logo.svg" alt="Camila's Organization" style={{ height: 72, width: "auto", objectFit: "contain" }} />
          </div>

          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 500, letterSpacing: "-0.01em", textAlign: "center", color: "hsl(222 47% 11%)" }}>
            Inicia Sesión
          </h1>
          <p style={{ margin: "0 0 26px", textAlign: "center", color: "hsl(215 16% 47%)", fontSize: 14, fontWeight: 400 }}>
            Gestiona tus asignaturas, tareas y exámenes.
          </p>

          {error && (
            <div className="login-alert" role="alert" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "hsl(222 47% 11%)", paddingLeft: 6 }}>Usuario</span>
              <div className="login-input-wrap">
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "hsl(222 47% 11%)", paddingLeft: 6 }}>Contraseña</span>
              <div className="login-input-wrap">
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>

            <div style={{ display: "flex", alignItems: "center", margin: "2px 4px 4px" }}>
              <label className="login-check" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "hsl(215 16% 47%)", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Recuérdame
              </label>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner" /> : "Iniciar sesión"}
            </button>
          </form>
        </main>

        <p style={{ position: "relative", zIndex: 1, textAlign: "center", marginTop: 18, color: "hsl(215 16% 47%)", fontSize: 12 }}>
          Hecho con ♥ para Camila
        </p>
      </div>
    </>
  );
}
