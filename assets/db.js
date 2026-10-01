// Shared Firebase adapter (Realtime Database + Authentication) for all pages.
// Pages talk to Firebase only through this interface.

export const firebaseConfig = {
  apiKey: "AIzaSyDbpewfahkS9GVFsMgdxdNionNS1D_2Gts",
  authDomain: "stakeholders-b7fd9.firebaseapp.com",
  databaseURL: "https://stakeholders-b7fd9-default-rtdb.firebaseio.com",
  projectId: "stakeholders-b7fd9",
  storageBucket: "stakeholders-b7fd9.firebasestorage.app",
  messagingSenderId: "802533792501",
  appId: "1:802533792501:web:19a7c55a29f29a0a0b43bc",
  measurementId: "G-CTQ3PLD4M3"
};

const SDK = "https://www.gstatic.com/firebasejs/12.18.0";
let cached = null;

export async function connect() {
  if (window.__MOCK_DB__) return window.__MOCK_DB__;
  if (cached) return cached;

  const { initializeApp } = await import(`${SDK}/firebase-app.js`);
  const { getDatabase, ref, onValue, get, set, update, remove } = await import(`${SDK}/firebase-database.js`);
  const A = await import(`${SDK}/firebase-auth.js`);

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = A.getAuth(app);

  cached = {
    sub(path, cb, onError) { return onValue(ref(db, path), snap => cb(snap.val()), onError); },
    async get(path) { return (await get(ref(db, path))).val(); },
    set(path, value) { return set(ref(db, path), value); },
    update(path, obj) { return update(ref(db, path), obj); },
    remove(path) { return remove(ref(db, path)); },
    onConnection(cb) { return onValue(ref(db, ".info/connected"), snap => cb(snap.val() === true)); },
    auth: {
      onChange(cb) { return A.onAuthStateChanged(auth, u => cb(u ? { uid: u.uid, email: u.email } : null)); },
      async signIn(email, password) { await A.signInWithEmailAndPassword(auth, email, password); },
      async signUp(email, password) { await A.createUserWithEmailAndPassword(auth, email, password); },
      async reset(email) { await A.sendPasswordResetEmail(auth, email); },
      async signOut() { await A.signOut(auth); }
    }
  };
  return cached;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

export function daysBetween(fromISO, toISO) {
  const p = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(toISO) - p(fromISO)) / 86400000);
}

// Human readable Firebase error messages
export function authMessage(err) {
  const code = err?.code || "";
  const map = {
    "auth/invalid-email": "The email address is not valid.",
    "auth/missing-password": "Enter your password.",
    "auth/weak-password": "The password must contain at least 6 characters.",
    "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
    "auth/network-request-failed": "No connection to the server. Check your internet connection.",
    "auth/operation-not-allowed": "Email and password sign-in is not enabled for this site yet. Tell your teacher."
  };
  if (map[code]) return map[code];
  if (/permission[_ ]denied/i.test(String(err?.message || code))) return "Access denied.";
  return "Something went wrong. Please try again.";
}
