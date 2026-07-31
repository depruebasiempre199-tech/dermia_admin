import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, UserPlus, DollarSign, AlertTriangle, Activity, Search, Bell,
  Server, Clock, ShieldCheck, Droplet, Star, Gauge, ThumbsDown,
  Lock, Mail, LogOut, Loader2, Eye, EyeOff,
} from "lucide-react";
import { api } from "./firebase-api";

// ---------- palette ----------
const C = {
  canvas: "#F7F5F1",
  card: "#FFFFFF",
  ink: "#1E2422",
  inkSoft: "#5C6663",
  inkFaint: "#9AA29E",
  primary: "#3D6B63",
  primaryLight: "#E7EFEC",
  sand: "#D4A574",
  sandLight: "#F5EAD9",
  clay: "#B84C3E",
  clayLight: "#F6E3E0",
  moss: "#6B8F71",
  mossLight: "#E8F0E6",
  border: "#E4E0D9",
  monitorBg: "#20302B",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

// ---------- constantes ----------
const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

const alertStyle = {
  critical: { bg: C.clayLight, fg: C.clay, dot: C.clay },
  warning: { bg: C.sandLight, fg: "#8A5A22", dot: C.sand },
  info: { bg: C.mossLight, fg: C.moss, dot: C.moss },
};

// ---------- shared UI ----------
function AuthShell({ children }) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ background: C.canvas, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
            style={{ background: C.primary, color: "#fff" }}
          >
            <Droplet size={20} />
          </span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.15rem", color: C.ink }}>
            Dermia
          </span>
          <span className="text-xs mt-1" style={{ color: C.inkSoft }}>
            Panel de administración
          </span>
        </div>
        <div className="rounded-2xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {children}
        </div>
        <p className="text-center text-xs mt-5 flex items-center justify-center gap-1.5" style={{ color: C.inkFaint }}>
          <ShieldCheck size={13} /> Acceso restringido a administradores autorizados
        </p>
      </div>
    </div>
  );
}

function FieldInput({ icon: Icon, type = "text", placeholder, value, onChange, rightAction }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
      style={{ background: C.canvas, border: `1px solid ${C.border}` }}
    >
      <Icon size={16} style={{ color: C.inkFaint }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: C.ink }}
      />
      {rightAction}
    </div>
  );
}

// ---------- login screen ----------
function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.login(email, password);
      onSuccess({ email: result.email, role: result.role });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: C.ink, fontSize: "1.05rem" }} className="mb-5">
        Iniciar sesión
      </h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <FieldInput icon={Mail} type="email" placeholder="correo@dermia.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FieldInput
          icon={Lock}
          type={showPw ? "text" : "password"}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightAction={
            <button type="button" onClick={() => setShowPw((s) => !s)} style={{ color: C.inkFaint }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        {error && (
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: C.clayLight, color: C.clay }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          style={{ background: C.primary, color: "#fff" }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          {loading ? "Verificando…" : "Iniciar sesión"}
        </button>
      </form>
    </AuthShell>
  );
}

// ---------- dashboard building blocks ----------
function KPICard({ icon: Icon, label, value, delta, positive, accent }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accent + "20", color: accent }}>
          <Icon size={18} strokeWidth={2} />
        </span>
        <span
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{ color: positive ? C.moss : C.clay, background: positive ? C.mossLight : C.clayLight }}
        >
          {positive ? "+" : ""}
          {delta}
        </span>
      </div>
      <div>
        <div className="text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", color: C.ink, letterSpacing: "-0.02em" }}>
          {value}
        </div>
        <div className="text-sm mt-1" style={{ color: C.inkSoft }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ eyebrow, title }) {
  return (
    <div className="mb-4">
      <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.sand, fontFamily: "'JetBrains Mono', monospace" }}>
        {eyebrow}
      </div>
      <h2 className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.ink, fontWeight: 600 }}>
        {title}
      </h2>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: C.canvas }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={22} className="animate-spin" style={{ color: C.primary }} />
        <span className="text-sm" style={{ color: C.inkSoft, fontFamily: "'Inter', sans-serif" }}>
          Cargando datos del panel…
        </span>
      </div>
    </div>
  );
}

// ---------- dashboard ----------
function Dashboard({ session, onLogout }) {
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.getUsuarios(range),
      api.getNegocio(range),
      api.getSistema(),
      api.getRendimiento(range),
      api.getProducto(),
      api.getResenas(),
      api.getAlertas(),
    ]).then(([usuarios, negocio, sistema, rendimiento, producto, resenas, alertas]) => {
      if (cancelled) return;
      setData({ usuarios, negocio, sistema, rendimiento, producto, resenas, alertas });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const nav = [
    { label: "Resumen", icon: Activity, active: true },
    { label: "Usuarios", icon: Users },
    { label: "Negocio", icon: DollarSign },
    { label: "Sistema", icon: Server },
    { label: "Alertas", icon: Bell },
  ];

  if (loading || !data) return <LoadingPanel />;

  return (
    <div className="min-h-screen w-full flex" style={{ background: C.canvas, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      <aside className="hidden md:flex flex-col w-56 shrink-0 p-5" style={{ borderRight: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-10 px-1">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primary, color: "#fff" }}>
            <Droplet size={16} />
          </span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.ink }}>Dermia</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: C.sandLight, color: "#8A5A22", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {session.role === "super_admin" ? "SUPER" : "ADMIN"}
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
              style={{
                background: item.active ? C.primaryLight : "transparent",
                color: item.active ? C.primary : C.inkSoft,
                fontWeight: item.active ? 600 : 500,
              }}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 px-1">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
              style={{ background: C.primaryLight, color: C.primary }}
            >
              {(session.email || "A")[0].toUpperCase()}
            </span>
            <span className="text-xs truncate" style={{ color: C.inkSoft }}>
              {session.email || "admin@dermia.com"}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ color: C.inkSoft, border: `1px solid ${C.border}` }}
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "1.4rem", color: C.ink }}>
              Panel de monitoreo
            </h1>
            <p className="text-sm mt-0.5" style={{ color: C.inkSoft }}>
              Estado general de la plataforma en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.inkSoft }}>
              <Search size={15} />
              <span>Buscar usuario, ticket…</span>
            </div>
            <div className="flex items-center rounded-xl p-1" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              {Object.keys(RANGE_DAYS).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: range === r ? C.primary : "transparent", color: range === r ? "#fff" : C.inkSoft }}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.inkSoft }}>
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: C.clay, border: "2px solid " + C.canvas }} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <KPICard icon={Users} label="Usuarios activos" value={data.usuarios.activos.toLocaleString()} delta="4.2%" positive accent={C.primary} />
          <KPICard icon={UserPlus} label="Nuevos hoy" value={data.usuarios.nuevosHoy} delta="1.8%" positive accent={C.moss} />
          <KPICard icon={DollarSign} label="MRR" value={`$${data.negocio.mrr.toLocaleString()}`} delta="6.1%" positive accent={C.sand} />
          <KPICard icon={Gauge} label="Tiempo de respuesta (cliente)" value={`${data.rendimiento.actual}s`} delta={`${data.rendimiento.delta}s`} positive accent={C.primary} />
          <KPICard icon={AlertTriangle} label="Tasa de error 24h" value={`${data.sistema.errorRate}%`} delta="0.03%" positive={false} accent={C.clay} />
          <KPICard icon={Server} label="Uptime 30 días" value={`${data.sistema.uptime}%`} delta="0.01%" positive accent={C.primary} />
        </div>

        <div className="rounded-2xl p-5 mb-8" style={{ background: C.monitorBg }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} style={{ color: "#9FE8B8" }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: "#9FE8B8", fontFamily: "'JetBrains Mono', monospace" }}>
                Vitales de la app · en vivo
              </span>
            </div>
            <div className="flex items-center gap-5 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#B8C4BF" }}>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> latencia p95: 218ms
              </span>
              <span className="flex items-center gap-1.5">
                <Server size={13} /> {data.sistema.nodos} nodos activos
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={data.sistema.vitals}>
              <Line type="monotone" dataKey="latency" stroke="#9FE8B8" strokeWidth={1.75} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SectionLabel eyebrow="Usuarios" title="Crecimiento de usuarios registrados" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.usuarios.crecimiento}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.primary} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.inkFaint }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.inkFaint }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke={C.primary} strokeWidth={2} fill="url(#growthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SectionLabel eyebrow="Negocio" title="Distribución de planes" />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.negocio.planes} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {data.negocio.planes.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-2">
              {data.negocio.planes.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2" style={{ color: C.inkSoft }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.name}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.ink }}>{p.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SectionLabel eyebrow="Experiencia" title="Tiempo de respuesta de la página (cliente)" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.rendimiento.serie}>
                <CartesianGrid stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.inkFaint }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.inkFaint }} axisLine={false} tickLine={false} width={40} unit="ms" />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke={C.primary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs mt-2" style={{ color: C.inkFaint }}>
              Tiempo medido desde el dispositivo del cliente hasta contenido interactivo (ms).
            </p>
          </div>

          <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SectionLabel eyebrow="Reseñas" title="Satisfacción del cliente" />
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl" style={{ fontFamily: "'JetBrains Mono', monospace", color: C.ink }}>
                {data.resenas.promedio}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} size={13} fill={C.sand} color={C.sand} />
                  ))}
                  <Star size={13} color={C.sand} />
                </div>
                <div className="text-xs mt-0.5" style={{ color: C.inkFaint }}>{data.resenas.total.toLocaleString()} reseñas</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={data.resenas.sentimiento} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55} paddingAngle={3}>
                  {data.resenas.sentimiento.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-1">
              {data.resenas.sentimiento.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2" style={{ color: C.inkSoft }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.ink }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 mb-8" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel eyebrow="Reseñas" title="Quejas recientes" />
            <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: C.clayLight, color: C.clay }}>
              <ThumbsDown size={12} /> {data.resenas.quejas.length} sin resolver
            </span>
          </div>
          <div className="flex flex-col gap-2 -mt-2">
            {data.resenas.quejas.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl" style={{ background: i % 2 === 0 ? C.canvas : "transparent" }}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium" style={{ background: C.primaryLight, color: C.primary }}>
                  {r.user.split(" ").map((n) => n[0]).join("")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={{ color: C.ink }}>{r.user}</span>
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={11} fill={s < r.rating ? C.clay : "none"} color={s < r.rating ? C.clay : C.border} />
                      ))}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: C.inkSoft }}>{r.comment}</p>
                </div>
                <span className="text-xs shrink-0" style={{ color: C.inkFaint }}>{r.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SectionLabel eyebrow="Producto" title="Análisis de piel más solicitados" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.producto.conceptos} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.inkFaint }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.inkSoft }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Bar dataKey="value" fill={C.sand} radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel eyebrow="Actividad" title="Alertas recientes" />
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: C.clayLight, color: C.clay }}>
                {data.alertas.filter((a) => a.level === "critical").length} críticas
              </span>
            </div>
            <div className="flex flex-col gap-2 -mt-2">
              {data.alertas.map((a, i) => {
                const s = alertStyle[a.level];
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: i % 2 === 0 ? C.canvas : "transparent" }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
                    <span className="flex-1 text-sm" style={{ color: C.ink }}>{a.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.fg, fontFamily: "'JetBrains Mono', monospace" }}>
                      {a.tag}
                    </span>
                    <span className="text-xs shrink-0 w-16 text-right" style={{ color: C.inkFaint }}>{a.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- root: login -> dashboard ----------
export default function DermiaAdminPanel() {
  const [session, setSession] = useState(null); // null | { email, role }

  if (!session) {
    return <LoginScreen onSuccess={(s) => setSession(s)} />;
  }

  return (
    <Dashboard
      session={session}
      onLogout={async () => {
        await api.logout();
        setSession(null);
      }}
    />
  );
}
