/**
 * Capa de datos real para el panel admin de Dermia — SDK de cliente de
 * Firebase (Auth + Firestore), sin Cloud Functions.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABcFYNtQnjF9pZlxDNVRBZFzxATlN74-g",
  authDomain: "derma-prod.firebaseapp.com",
  projectId: "derma-prod",
  storageBucket: "derma-prod.firebasestorage.app",
  messagingSenderId: "513346176461",
  appId: "1:513346176461:web:c6a9dbc28475734ea3b084",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = "dermia";
const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

function daysAgoTimestamp(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

function bucketByDay(docsData, dateField, valueField, days) {
  const buckets = {};
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { label: i === 0 ? "Hoy" : `-${i}d`, sum: 0, count: 0 };
  }
  docsData.forEach((doc) => {
    const ts = doc[dateField]?.toDate?.();
    if (!ts) return;
    const key = ts.toISOString().slice(0, 10);
    if (buckets[key]) {
      buckets[key].sum += doc[valueField] ?? 0;
      buckets[key].count += 1;
    }
  });
  return Object.values(buckets).map((b) => ({
    label: b.label,
    value: b.count ? Math.round(b.sum / b.count) : b.sum,
  }));
}

export const api = {
  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const adminSnap = await getDoc(doc(db, "admins", cred.user.uid));
    if (!adminSnap.exists() || adminSnap.data().activo !== true) {
      await signOut(auth);
      throw new Error("Esta cuenta no tiene acceso al panel de administración.");
    }
    return { ok: true, role: adminSnap.data().role, email: cred.user.email };
  },

  async logout() {
    await signOut(auth);
  },

  onSession(callback) {
    return onAuthStateChanged(auth, callback);
  },

  async getUsuarios(range) {
    const usersRef = collection(db, "users");
    const activosSnap = await getCountFromServer(
      query(usersRef, where("appId", "==", APP_ID), where("activo", "==", true))
    );
    const hoy = daysAgoTimestamp(0);
    const nuevosSnap = await getCountFromServer(
      query(usersRef, where("appId", "==", APP_ID), where("creadoEn", ">=", hoy))
    );

    const days = RANGE_DAYS[range];
    const desde = daysAgoTimestamp(days);
    const historicoSnap = await getDocs(
      query(usersRef, where("appId", "==", APP_ID), where("creadoEn", ">=", desde), orderBy("creadoEn"))
    );
    const registros = historicoSnap.docs.map((d) => d.data());
    const crecimiento = bucketByDay(
      registros.map((r) => ({ creadoEn: r.creadoEn, uno: 1 })),
      "creadoEn",
      "uno",
      days
    );

    return { activos: activosSnap.data().count, nuevosHoy: nuevosSnap.data().count, crecimiento };
  },

  async getNegocio(range) {
    const subsRef = collection(db, "subscriptions");
    const activasSnap = await getDocs(
      query(subsRef, where("appId", "==", APP_ID), where("estado", "==", "activa"))
    );

    const conteoPorPlan = {};
    let mrr = 0;
    activasSnap.docs.forEach((d) => {
      const s = d.data();
      conteoPorPlan[s.plan] = (conteoPorPlan[s.plan] || 0) + 1;
      mrr += s.monto || 0;
    });

    const planColors = { gratuito: "#9AA29E", glow: "#D4A574", glow_pro: "#3D6B63" };
    const planes = Object.entries(conteoPorPlan).map(([name, value]) => ({
      name,
      value,
      color: planColors[name] || "#9AA29E",
    }));

    const days = RANGE_DAYS[range];
    const revenue = Array.from({ length: days + 1 }, (_, i) => ({
      label: i === days ? "Hoy" : `-${days - i}d`,
      value: mrr,
    }));

    return { mrr, planes, revenue };
  },

  async getSistema() {
    const snap = await getDocs(
      query(collection(db, "system_metrics"), where("appId", "==", APP_ID), orderBy("timestamp", "desc"), limit(1))
    );
    if (snap.empty) {
      return { uptime: null, errorRate: null, vitals: [], nodos: "—" };
    }
    const latest = snap.docs[0].data();

    const vitalsSnap = await getDocs(
      query(collection(db, "system_metrics"), where("appId", "==", APP_ID), orderBy("timestamp", "desc"), limit(40))
    );
    const vitals = vitalsSnap.docs
      .map((d) => ({ latency: d.data().latenciaP95 }))
      .reverse();

    return { uptime: latest.uptime, errorRate: latest.errorRate, vitals, nodos: latest.nodosActivos };
  },

  async getRendimiento(range) {
    const days = RANGE_DAYS[range];
    const desde = daysAgoTimestamp(days);
    const snap = await getDocs(
      query(
        collection(db, "performance_logs"),
        where("appId", "==", APP_ID),
        where("timestamp", ">=", desde),
        orderBy("timestamp")
      )
    );
    const registros = snap.docs.map((d) => d.data());
    const serie = bucketByDay(registros, "timestamp", "tiempoCargaMs", days);
    const actual = serie.length ? serie[serie.length - 1].value / 1000 : null;

    return { actual, delta: null, serie };
  },

  async getProducto() {
    return {
      conceptos: [
        { name: "Acné", value: 0 },
        { name: "Hidratación", value: 0 },
        { name: "Manchas", value: 0 },
        { name: "Arrugas", value: 0 },
        { name: "Poros", value: 0 },
      ],
    };
  },

  async getResenas() {
    const reviewsRef = collection(db, "reviews");
    const allSnap = await getDocs(query(reviewsRef, where("appId", "==", APP_ID)));
    const all = allSnap.docs.map((d) => d.data());

    const total = all.length;
    const promedio = total ? (all.reduce((a, r) => a + r.rating, 0) / total).toFixed(1) : 0;
    const conteo = { positiva: 0, neutra: 0, negativa: 0 };
    all.forEach((r) => (conteo[r.sentimiento] = (conteo[r.sentimiento] || 0) + 1));

    const sentimiento = [
      { name: "Positivas", value: total ? Math.round((conteo.positiva / total) * 100) : 0, color: "#6B8F71" },
      { name: "Neutras", value: total ? Math.round((conteo.neutra / total) * 100) : 0, color: "#D4A574" },
      { name: "Negativas", value: total ? Math.round((conteo.negativa / total) * 100) : 0, color: "#B84C3E" },
    ];

    const quejasSnap = await getDocs(
      query(
        reviewsRef,
        where("appId", "==", APP_ID),
        where("sentimiento", "==", "negativa"),
        orderBy("timestamp", "desc"),
        limit(10)
      )
    );
    const quejas = quejasSnap.docs.map((d) => {
      const r = d.data();
      return { user: r.userId, rating: r.rating, comment: r.comentario, time: r.timestamp?.toDate?.().toLocaleString() };
    });

    return { promedio: Number(promedio), total, sentimiento, quejas };
  },

  async getAlertas() {
    const snap = await getDocs(
      query(collection(db, "alerts"), where("appId", "==", APP_ID), orderBy("timestamp", "desc"), limit(10))
    );
    return snap.docs.map((d) => {
      const a = d.data();
      return { level: a.nivel, title: a.titulo, tag: a.categoria, time: a.timestamp?.toDate?.().toLocaleString() };
    });
  },
};
