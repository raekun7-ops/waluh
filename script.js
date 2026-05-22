const LOAN_OPTIONS = ["KUR", "CASHCOL", "KPP", "KUPEDES", "KUPERA", "BRIGUNA", "UMI"];

// ── Nomor PN (Personal Number) per mantri ──
const MANTRI_PN = {
  // Margasari
  "WAHYU":                "00249457",
  "ARUL":                 "00132854",
  "RAJAB":                "00285597",
  // Pulau Pinang
  "MUHAMMADAN":           "00088992",
  "RUDDY KURNIAWAN":      "00223278",
  "HADRIYANI":            "00168549",
  "AL HASANI":            "00398271",
  // Rantau Barat
  "M HENDRA WAHYUDI":     "00282615",
  "NURUL AULIA":          "00296609",
  "NETTY SETIAWATI":      "00324770",
  "M FIRMAN MAULANI":     "00350384",
  // Binuang
  "AKMAL FIRDAUS":        "00305893",
  "ARIF RAHMAN":          "00139338",
  "M SYAMSU RIZAL":       "00363597",
  "RUDI HARTONO":         "00282614",
  "ACHMAD RIZKYANNOOR":   "00189669",
  // Rantau Timur
  "HENDRA WAHYUDI":       "00297286",
  "SHALEH ANSHARI":       "00232664",
  "IWAN SETIAWAN":        "00121578",
  "MUHAMMAD REZA AZHARI": "00378280",
  "RIKA WIDIANINGSIH":    "00373749",
  //tambarangan
  "FAISAL RAHMAN" : "00088945",
"DEDE ARIANDANA" : "00249474",
"HELENA SAPITRI" : "00223274",
"AHMAD" : "00345045",
"RIMA MAULIDA" : "00399285",
};

function getMantriPN(name) {
  if (!name) return "";
  return MANTRI_PN[name.trim().toUpperCase()] || "";
}

const UNITS = {
  margasari: {
    storageKey: "margasari-report-v2",
    oldStorageKey: "margasari-report-v1",
    starterData: {
      title: "MARGASARI",
      loans: ["KUR"],
      mantri: [
        { name: "Wahyu", customers: [] },
        { name: "Arul", customers: [] },
        { name: "Rajab", customers: [] },
      ],
    },
  },
  tambarangan: {
    storageKey: "tambarangan-report-v2",
    oldStorageKey: null,
    starterData: {
      title: "TAMBARANGAN",
      loans: ["KUR"],
      mantri: [
        { name: "FAISAL RAHMAN", customers: [] },
        { name: "AHMAD", customers: [] },
        { name: "HELENA SAPITRI", customers: [] },
        { name: "DEDE ARIANDANA", customers: [] },
        { name: "RIMA MAULIDA", customers: [] },
      ],
    },
  },
  pulau_pinang: {
    storageKey: "pulau-pinang-report-v2",
    oldStorageKey: null,
    starterData: {
      title: "PULAU PINANG",
      loans: ["KUR"],
      mantri: [
        { name: "HADRIYANI", customers: [] },
        { name: "MUHAMMADAN", customers: [] },
        { name: "AL HASANI", customers: [] },
        { name: "RUDDY KURNIAWAN", customers: [] },
      ],
    },
  },
  binuang: {
    storageKey: "binuang-report-v2",
    oldStorageKey: null,
    starterData: {
      title: "BINUANG",
      loans: ["KUR"],
      mantri: [
        { name: "AKMAL FIRDAUS", customers: [] },
        { name: "ARIF RAHMAN", customers: [] },
        { name: "M SYAMSU RIZAL", customers: [] },
        { name: "RUDI HARTONO", customers: [] },
        { name: "ACHMAD RIZKYANNOOR", customers: [] },
      ],
    },
  },
  ranbar: {
    storageKey: "ranbar-report-v2",
    oldStorageKey: null,
    starterData: {
      title: "RANTAU BARAT",
      loans: ["KUR"],
      mantri: [
        { name: "M HENDRA WAHYUDI", customers: [] },
        { name: "NURUL AULIA", customers: [] },
        { name: "NETTY SETIAWATI", customers: [] },
        { name: "M FIRMAN MAULANI", customers: [] },
      ],
    },
  },
  rantim: {
    storageKey: "rantim-report-v2",
    oldStorageKey: null,
    starterData: {
      title: "RANTAU TIMUR",
      loans: ["KUR"],
      mantri: [
        { name: "HENDRA WAHYUDI", customers: [] },
        { name: "SHALEH ANSHARI", customers: [] },
        { name: "IWAN SETIAWAN", customers: [] },
        { name: "MUHAMMAD REZA AZHARI", customers: [] },
        { name: "RIKA WIDIANINGSIH", customers: [] },
      ],
    },
  },
};

// --- Unit picker overlay ---
let currentUnit = null;

const ADMIN_PASSWORD = "WALUH";
const UNIT_PASSWORDS_KEY = "unit-passwords-v1";

function getUnitPasswords() {
  try {
    const saved = localStorage.getItem(UNIT_PASSWORDS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveUnitPasswords(passwords) {
  localStorage.setItem(UNIT_PASSWORDS_KEY, JSON.stringify(passwords));
  // Simpan juga ke cloud agar berlaku di semua perangkat
  cloudSavePasswords(passwords);
}

// ╔══════════════════════════════════════════════════════════════╗
// ║              CLOUD SYNC — Firebase Realtime DB              ║
// ║  Data tersimpan di internet, sama di semua perangkat        ║
// ╚══════════════════════════════════════════════════════════════╝

// ── KONFIGURASI ──
// Ganti DB_URL dengan URL Firebase Realtime Database Anda.
// Cara mendapatkan:
//   1. Buka https://console.firebase.google.com
//   2. Buat project baru (gratis)
//   3. Build → Realtime Database → Create database → Start in test mode
//   4. Salin URL yang muncul (format: https://xxx-default-rtdb.firebaseio.com)
const DB_URL = "https://laporan-margasari-default-rtdb.asia-southeast1.firebasedatabase.app";

let _syncTimer = null;
let _syncStatusEl = null;

function getSyncEl() {
  if (!_syncStatusEl) _syncStatusEl = document.getElementById("syncStatus");
  return _syncStatusEl;
}

function setSyncStatus(msg, color) {
  const el = getSyncEl();
  if (!el) return;
  el.textContent = msg;
  el.style.color = color || "#5570b8";
}

// ── Simpan data laporan ke cloud (debounce 900ms) ──
function cloudSave(data) {
  if (!DB_URL || !currentUnit) return;
  clearTimeout(_syncTimer);
  setSyncStatus("⟳ Menyimpan...", "#f7b731");
  _syncTimer = setTimeout(async () => {
    try {
      const r = await fetch(`${DB_URL}/units/${currentUnit}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      setSyncStatus("✓ Tersimpan (" + new Date().toLocaleTimeString("id-ID", {hour:"2-digit",minute:"2-digit"}) + ")", "#16a34a");
      setTimeout(() => setSyncStatus("", ""), 3000);
    } catch(e) {
      setSyncStatus("✗ Gagal sync — cek internet", "#c72f54");
    }
  }, 900);
}

// ── Muat data laporan dari cloud ──
async function cloudLoad(starterData) {
  if (!DB_URL || !currentUnit) return null;
  setSyncStatus("⟳ Memuat data cloud...", "#f7b731");
  try {
    const r = await fetch(`${DB_URL}/units/${currentUnit}.json`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if (data && typeof data === "object" && data.mantri) {
      setSyncStatus("✓ Data dimuat dari cloud", "#16a34a");
      setTimeout(() => setSyncStatus("", ""), 2500);
      return normalizeState(data, starterData);
    }
    setSyncStatus("", "");
    return null;
  } catch(e) {
    setSyncStatus("⚠ Offline — memakai data lokal", "#c72f54");
    setTimeout(() => setSyncStatus("", ""), 3500);
    return null;
  }
}

// ── Simpan password ke cloud ──
async function cloudSavePasswords(passwords) {
  if (!DB_URL) return;
  try {
    await fetch(`${DB_URL}/passwords.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords)
    });
  } catch(e) { /* silent */ }
}

// ── Muat password dari cloud ──
async function cloudLoadPasswords() {
  if (!DB_URL) return null;
  try {
    const r = await fetch(`${DB_URL}/passwords.json`);
    if (!r.ok) return null;
    const data = await r.json();
    return (data && typeof data === "object") ? data : null;
  } catch(e) { return null; }
}

function showUnitPicker() {
  const overlay = document.createElement("div");
  overlay.id = "unitPickerOverlay";
  // Pakai overflow-y:auto + min-height pada inner div agar selalu tengah di mobile
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:flex-start;justify-content:center;
    background:linear-gradient(180deg,#ffffff 0%,#f5f8ff 58%,#edf3ff 100%);
    overflow-y:auto;
    -webkit-overflow-scrolling:touch;
  `;

  const unitList = [
    { key: "margasari", label: "MARGASARI" },
    { key: "tambarangan", label: "TAMBARANGAN" },
    { key: "pulau_pinang", label: "PULAU PINANG" },
    { key: "binuang", label: "BINUANG" },
    { key: "ranbar", label: "RANBAR" },
    { key: "rantim", label: "RANTIM" },
  ];

  const btnStyle = `
    width:100%;min-height:80px;padding:0 24px;
    border:0;border-radius:14px;cursor:pointer;
    color:white;background:linear-gradient(180deg,#052699,#001976);
    font-family:inherit;font-size:clamp(1.5rem,5vw,2rem);font-weight:950;text-transform:uppercase;
    box-shadow:0 10px 30px rgba(0,25,118,0.22);
    transition:transform 0.16s,box-shadow 0.16s;
    letter-spacing:0.03em;
    -webkit-tap-highlight-color:transparent;
  `;

  overlay.innerHTML = `
    <div style="
      text-align:center;
      padding:clamp(32px,8vh,60px) clamp(16px,5vw,32px) clamp(32px,8vh,60px);
      max-width:520px;
      width:100%;
      min-height:100vh;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      box-sizing:border-box;
    ">
      <div style="
        background:linear-gradient(180deg,#052699,#001976);
        width:clamp(56px,14vw,80px);height:clamp(56px,14vw,80px);
        border-radius:20px;
        display:flex;align-items:center;justify-content:center;
        margin:0 auto 20px;
        box-shadow:0 12px 32px rgba(0,25,118,0.28);
      ">
        <span style="font-size:clamp(2rem,6vw,2.8rem);">🏦</span>
      </div>
      <p style="margin:0 0 6px;color:#5570b8;font-size:clamp(0.75rem,2.5vw,0.85rem);font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">Pilih Unit</p>
      <h1 style="margin:0 0 clamp(24px,5vh,40px);color:#001976;font-size:clamp(2rem,7vw,4.5rem);font-weight:950;line-height:0.95;text-transform:uppercase;">Laporan Harian</h1>
      <div style="display:flex;flex-direction:column;gap:clamp(10px,2vh,16px);width:100%;">
        ${unitList.map(u => `<button data-unit="${u.key}" style="${btnStyle}">${u.label}</button>`).join("")}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Admin button (bottom right)
  const adminBtn = document.createElement("button");
  adminBtn.id = "adminFloatBtn";
  adminBtn.textContent = "⚙ Admin";
  adminBtn.style.cssText = `
    position:fixed;bottom:18px;right:18px;z-index:10001;
    padding:7px 16px;border:0;border-radius:8px;cursor:pointer;
    background:rgba(0,25,118,0.13);color:#001976;
    font-family:inherit;font-size:0.78rem;font-weight:800;
    letter-spacing:0.06em;text-transform:uppercase;
    box-shadow:0 2px 10px rgba(0,25,118,0.12);
    transition:background 0.15s;
  `;
  adminBtn.addEventListener("mouseenter", () => adminBtn.style.background = "rgba(0,25,118,0.22)");
  adminBtn.addEventListener("mouseleave", () => adminBtn.style.background = "rgba(0,25,118,0.13)");
  adminBtn.addEventListener("click", () => showAdminPanel(unitList));
  document.body.appendChild(adminBtn);

  async function pick(unitKey) {
    // Coba ambil password terbaru dari cloud dulu
    const cloudPw = await cloudLoadPasswords();
    if (cloudPw) {
      // Sinkronkan ke localStorage agar konsisten
      localStorage.setItem(UNIT_PASSWORDS_KEY, JSON.stringify(cloudPw));
    }
    const passwords = cloudPw || getUnitPasswords();
    const pw = passwords[unitKey];
    if (pw && pw.trim() !== "") {
      showPasswordPrompt(unitKey, pw, unitList.find(u => u.key === unitKey)?.label || unitKey, () => {
        overlay.remove();
        adminBtn.remove();
        currentUnit = unitKey;
        sessionStorage.setItem("activeUnit", unitKey);
        initApp();
        autoScrollToCenter();
      });
    } else {
      overlay.remove();
      adminBtn.remove();
      currentUnit = unitKey;
      sessionStorage.setItem("activeUnit", unitKey);
      initApp();
      autoScrollToCenter();
    }
  }

  overlay.querySelectorAll("[data-unit]").forEach(btn => {
    btn.addEventListener("click", () => pick(btn.dataset.unit));
    btn.addEventListener("mouseenter", () => { btn.style.transform="translateY(-2px)"; btn.style.boxShadow="0 14px 32px rgba(0,25,118,0.3)"; });
    btn.addEventListener("mouseleave", () => { btn.style.transform=""; btn.style.boxShadow="0 10px 30px rgba(0,25,118,0.22)"; });
  });
}

function showPasswordPrompt(unitKey, correctPw, unitLabel, onSuccess) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position:fixed;inset:0;z-index:10002;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,25,118,0.35);backdrop-filter:blur(4px);
  `;
  modal.innerHTML = `
    <div style="background:white;border-radius:18px;padding:40px 32px;max-width:360px;width:90%;
      box-shadow:0 24px 60px rgba(0,25,118,0.22);text-align:center;">
      <div style="font-size:2.4rem;margin-bottom:12px;">🔒</div>
      <h2 style="margin:0 0 6px;color:#001976;font-size:1.4rem;font-weight:950;text-transform:uppercase;">${unitLabel}</h2>
      <p style="margin:0 0 24px;color:#5570b8;font-size:0.85rem;font-weight:700;">Masukkan password untuk membuka unit ini</p>
      <input id="pwInput" type="password" placeholder="Password..." style="
        width:100%;box-sizing:border-box;padding:12px 16px;
        border:2px solid #c5d3f0;border-radius:10px;
        font-family:inherit;font-size:1.1rem;font-weight:800;
        text-align:center;letter-spacing:0.12em;outline:none;
        color:#001976;transition:border 0.15s;
      "/>
      <p id="pwError" style="margin:8px 0 0;color:#c72f54;font-size:0.82rem;font-weight:800;min-height:18px;"></p>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button id="pwCancel" style="
          flex:1;padding:12px;border:2px solid #c5d3f0;border-radius:10px;
          background:white;color:#5570b8;font-family:inherit;font-size:0.95rem;
          font-weight:800;cursor:pointer;">Batal</button>
        <button id="pwSubmit" style="
          flex:1;padding:12px;border:0;border-radius:10px;
          background:linear-gradient(180deg,#052699,#001976);color:white;
          font-family:inherit;font-size:0.95rem;font-weight:950;cursor:pointer;">Masuk</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const input = modal.querySelector("#pwInput");
  const errEl = modal.querySelector("#pwError");
  input.focus();

  function attempt() {
    if (input.value.toUpperCase() === correctPw.toUpperCase()) {
      modal.remove();
      onSuccess();
    } else {
      errEl.textContent = "Password salah. Coba lagi.";
      input.value = "";
      input.style.borderColor = "#c72f54";
      input.focus();
      setTimeout(() => { input.style.borderColor = "#c5d3f0"; errEl.textContent = ""; }, 2000);
    }
  }

  modal.querySelector("#pwSubmit").addEventListener("click", attempt);
  input.addEventListener("keydown", e => { if (e.key === "Enter") attempt(); });
  modal.querySelector("#pwCancel").addEventListener("click", () => modal.remove());
}

function showAdminPanel(unitList) {
  // First ask for admin password
  const modal = document.createElement("div");
  modal.style.cssText = `
    position:fixed;inset:0;z-index:10003;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,25,118,0.45);backdrop-filter:blur(4px);
  `;
  modal.innerHTML = `
    <div style="background:white;border-radius:18px;padding:40px 32px;max-width:360px;width:90%;
      box-shadow:0 24px 60px rgba(0,25,118,0.26);text-align:center;">
      <div style="font-size:2.4rem;margin-bottom:12px;">🛡️</div>
      <h2 style="margin:0 0 6px;color:#001976;font-size:1.4rem;font-weight:950;text-transform:uppercase;">Panel Admin</h2>
      <p style="margin:0 0 24px;color:#5570b8;font-size:0.85rem;font-weight:700;">Masukkan password admin</p>
      <input id="adminPwInput" type="password" placeholder="Password admin..." style="
        width:100%;box-sizing:border-box;padding:12px 16px;
        border:2px solid #c5d3f0;border-radius:10px;
        font-family:inherit;font-size:1.1rem;font-weight:800;
        text-align:center;letter-spacing:0.12em;outline:none;
        color:#001976;transition:border 0.15s;
      "/>
      <p id="adminPwError" style="margin:8px 0 0;color:#c72f54;font-size:0.82rem;font-weight:800;min-height:18px;"></p>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button id="adminPwCancel" style="
          flex:1;padding:12px;border:2px solid #c5d3f0;border-radius:10px;
          background:white;color:#5570b8;font-family:inherit;font-size:0.95rem;
          font-weight:800;cursor:pointer;">Batal</button>
        <button id="adminPwSubmit" style="
          flex:1;padding:12px;border:0;border-radius:10px;
          background:linear-gradient(180deg,#052699,#001976);color:white;
          font-family:inherit;font-size:0.95rem;font-weight:950;cursor:pointer;">Masuk</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const input = modal.querySelector("#adminPwInput");
  const errEl = modal.querySelector("#adminPwError");
  input.focus();

  function attempt() {
    if (input.value.toUpperCase() === ADMIN_PASSWORD.toUpperCase()) {
      modal.remove();
      showAdminPasswordEditor(unitList);
    } else {
      errEl.textContent = "Password admin salah.";
      input.value = "";
      input.style.borderColor = "#c72f54";
      input.focus();
      setTimeout(() => { input.style.borderColor = "#c5d3f0"; errEl.textContent = ""; }, 2000);
    }
  }

  modal.querySelector("#adminPwSubmit").addEventListener("click", attempt);
  input.addEventListener("keydown", e => { if (e.key === "Enter") attempt(); });
  modal.querySelector("#adminPwCancel").addEventListener("click", () => modal.remove());
}

async function showAdminPasswordEditor(unitList) {
  // Selalu ambil password terbaru dari cloud dulu agar semua perangkat sinkron
  const modal = document.createElement("div");
  modal.style.cssText = `
    position:fixed;inset:0;z-index:10003;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,25,118,0.45);backdrop-filter:blur(4px);
    overflow-y:auto;padding:24px;box-sizing:border-box;
  `;

  // Tampilkan loading dulu
  modal.innerHTML = `
    <div style="background:white;border-radius:18px;padding:48px 32px;max-width:500px;width:100%;
      box-shadow:0 24px 60px rgba(0,25,118,0.26);text-align:center;">
      <div style="font-size:2rem;margin-bottom:16px;">⚙️</div>
      <p style="color:#5570b8;font-weight:800;font-size:0.95rem;">Memuat password dari cloud...</p>
    </div>
  `;
  document.body.appendChild(modal);

  // Load dari cloud, fallback ke localStorage
  const cloudPw = await cloudLoadPasswords();
  const passwords = cloudPw || getUnitPasswords();
  // Sinkronkan ke localStorage
  if (cloudPw) localStorage.setItem(UNIT_PASSWORDS_KEY, JSON.stringify(cloudPw));

  const rows = unitList.map(u => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #eef4ff;">
      <span style="flex:0 0 160px;font-weight:950;font-size:0.9rem;color:#001976;text-transform:uppercase;">${u.label}</span>
      <input data-unit-pw="${u.key}" type="text" placeholder="Kosongkan = tanpa password"
        value="${passwords[u.key] || ""}"
        style="flex:1;padding:9px 12px;border:2px solid #c5d3f0;border-radius:8px;
          font-family:inherit;font-size:0.9rem;font-weight:700;color:#001976;outline:none;
          text-transform:uppercase;letter-spacing:0.06em;"/>
    </div>
  `).join("");

  modal.innerHTML = `
    <div style="background:white;border-radius:18px;padding:40px 32px;max-width:500px;width:100%;
      box-shadow:0 24px 60px rgba(0,25,118,0.26);">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:2rem;margin-bottom:8px;">⚙️</div>
        <h2 style="margin:0 0 4px;color:#001976;font-size:1.35rem;font-weight:950;text-transform:uppercase;">Atur Password Unit</h2>
        <p style="margin:0;color:#5570b8;font-size:0.82rem;font-weight:700;">Kosongkan jika unit tidak perlu password</p>
      </div>
      <div>${rows}</div>
      <div id="adminSaveMsg" style="text-align:center;font-weight:800;font-size:0.88rem;min-height:20px;margin-top:12px;"></div>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button id="adminClose" style="
          flex:1;padding:12px;border:2px solid #c5d3f0;border-radius:10px;
          background:white;color:#5570b8;font-family:inherit;font-size:0.95rem;
          font-weight:800;cursor:pointer;">Tutup</button>
        <button id="adminSave" style="
          flex:1;padding:12px;border:0;border-radius:10px;
          background:linear-gradient(180deg,#052699,#001976);color:white;
          font-family:inherit;font-size:0.95rem;font-weight:950;cursor:pointer;">Simpan</button>
      </div>
    </div>
  `;

  // Uppercase transform on input
  modal.querySelectorAll("[data-unit-pw]").forEach(inp => {
    inp.addEventListener("input", () => { inp.value = inp.value.toUpperCase(); });
  });

  modal.querySelector("#adminSave").addEventListener("click", async () => {
    const newPasswords = {};
    modal.querySelectorAll("[data-unit-pw]").forEach(inp => {
      newPasswords[inp.dataset.unitPw] = inp.value.trim().toUpperCase();
    });
    const msg = modal.querySelector("#adminSaveMsg");
    const saveBtn = modal.querySelector("#adminSave");
    saveBtn.disabled = true;
    saveBtn.textContent = "Menyimpan...";
    msg.style.color = "#f7b731";
    msg.textContent = "⟳ Menyimpan ke cloud...";

    // Simpan ke localStorage dulu
    localStorage.setItem(UNIT_PASSWORDS_KEY, JSON.stringify(newPasswords));
    // Lalu simpan ke cloud dan tunggu hasilnya
    try {
      const r = await fetch(`${DB_URL}/passwords.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPasswords)
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      msg.style.color = "#16a34a";
      msg.textContent = "✓ Password tersimpan di cloud — berlaku di semua perangkat!";
    } catch(e) {
      msg.style.color = "#c72f54";
      msg.textContent = "✗ Gagal simpan ke cloud. Cek koneksi internet.";
    }
    saveBtn.disabled = false;
    saveBtn.textContent = "Simpan";
    setTimeout(() => { msg.textContent = ""; }, 3500);
  });

  modal.querySelector("#adminClose").addEventListener("click", () => modal.remove());
}

// ╔══════════════════════════════════════════════════════════════╗
// ║         SETTINGS AMKKM / BRINS — per unit, cloud sync       ║
// ╚══════════════════════════════════════════════════════════════╝

const UNIT_SETTINGS_KEY = "unit-amkkm-brins-settings-v1";

// Default: 0 = belum diatur (akan tampil 0 dan bisa diset)
const DEFAULT_UNIT_SETTINGS = { amkkm: 0, brins: 0 };

let unitSettings = null; // cache untuk unit aktif

function getUnitSettingsStorageKey() {
  return `${UNIT_SETTINGS_KEY}-${currentUnit}`;
}

async function cloudLoadUnitSettings() {
  if (!DB_URL || !currentUnit) return null;
  try {
    const r = await fetch(`${DB_URL}/settings/${currentUnit}.json`);
    if (!r.ok) return null;
    const data = await r.json();
    return (data && typeof data === "object") ? data : null;
  } catch(e) { return null; }
}

async function cloudSaveUnitSettings(settings) {
  if (!DB_URL || !currentUnit) return;
  try {
    await fetch(`${DB_URL}/settings/${currentUnit}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
  } catch(e) { /* silent */ }
}

async function loadUnitSettings() {
  // Coba cloud dulu
  const cloud = await cloudLoadUnitSettings();
  if (cloud) {
    unitSettings = { ...DEFAULT_UNIT_SETTINGS, ...cloud };
    localStorage.setItem(getUnitSettingsStorageKey(), JSON.stringify(unitSettings));
    return unitSettings;
  }
  // Fallback localStorage
  try {
    const local = localStorage.getItem(getUnitSettingsStorageKey());
    if (local) {
      unitSettings = { ...DEFAULT_UNIT_SETTINGS, ...JSON.parse(local) };
      return unitSettings;
    }
  } catch(e) {}
  unitSettings = { ...DEFAULT_UNIT_SETTINGS };
  return unitSettings;
}

function getAmkkmRate() {
  return (unitSettings && unitSettings.amkkm) ? Number(unitSettings.amkkm) : 0;
}

function getBrinsRate() {
  return (unitSettings && unitSettings.brins) ? Number(unitSettings.brins) : 0;
}

// ── Modal setting nominal AMKKM / BRINS ──
function showAmkkmBrinsSettings() {
  const currentAmkkm = getAmkkmRate();
  const currentBrins = getBrinsRate();
  const unitLabel = (UNITS[currentUnit]?.starterData?.title || currentUnit).toUpperCase();

  const modal = document.createElement("div");
  modal.id = "amkkmBrinsSettingsModal";
  modal.style.cssText = `
    position:fixed;inset:0;z-index:10005;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,25,118,0.38);backdrop-filter:blur(5px);
    padding:24px;box-sizing:border-box;
  `;
  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:40px 32px;max-width:420px;width:100%;
      box-shadow:0 28px 70px rgba(0,25,118,0.26);">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:2.2rem;margin-bottom:10px;">💰</div>
        <h2 style="margin:0 0 4px;color:#001976;font-size:1.35rem;font-weight:950;text-transform:uppercase;">
          Setting AMKKM &amp; BRINS
        </h2>
        <p style="margin:0;color:#5570b8;font-size:0.83rem;font-weight:700;">
          Unit: ${unitLabel} — nominal per 1 debitur (DEB)
        </p>
        <p style="margin:6px 0 0;color:#16a34a;font-size:0.78rem;font-weight:700;background:#f0faf4;padding:6px 12px;border-radius:8px;">
          ✓ Setting ini tersimpan di cloud &amp; tidak terpengaruh Reset
        </p>
      </div>

      <div style="display:flex;flex-direction:column;gap:18px;">
        <div>
          <label style="display:block;font-weight:950;color:#001976;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:7px;">
            🛡️ AMKKM — nominal per DEB (Rp)
          </label>
          <input id="settingAmkkm" type="text" inputmode="numeric"
            placeholder="Contoh: 150000"
            value="${currentAmkkm ? formatRupiah(currentAmkkm) : ""}"
            style="width:100%;box-sizing:border-box;padding:13px 16px;border:2px solid #c5d3f0;border-radius:10px;
              font-family:inherit;font-size:1.15rem;font-weight:950;color:#001976;outline:none;
              text-align:center;letter-spacing:0.04em;transition:border 0.15s;"
          />
          <div id="amkkmPreview" style="text-align:center;font-size:0.8rem;font-weight:700;color:#5570b8;margin-top:5px;"></div>
        </div>

        <div>
          <label style="display:block;font-weight:950;color:#001976;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:7px;">
            🛡️ BRINS — nominal per DEB (Rp)
          </label>
          <input id="settingBrins" type="text" inputmode="numeric"
            placeholder="Contoh: 180000"
            value="${currentBrins ? formatRupiah(currentBrins) : ""}"
            style="width:100%;box-sizing:border-box;padding:13px 16px;border:2px solid #c5d3f0;border-radius:10px;
              font-family:inherit;font-size:1.15rem;font-weight:950;color:#001976;outline:none;
              text-align:center;letter-spacing:0.04em;transition:border 0.15s;"
          />
          <div id="brinsPreview" style="text-align:center;font-size:0.8rem;font-weight:700;color:#5570b8;margin-top:5px;"></div>
        </div>
      </div>

      <div style="background:#f4f8ff;border-radius:10px;padding:12px 16px;margin-top:18px;font-size:0.82rem;color:#5570b8;font-weight:700;line-height:1.5;">
        <strong style="color:#001976;">Cara kerja:</strong><br>
        Nilai AMKKM &amp; BRINS = Total DEB mantri × nominal di atas.<br>
        Kolom masih bisa diubah manual per mantri.
      </div>

      <div id="settingsSaveMsg" style="text-align:center;font-weight:800;font-size:0.88rem;min-height:20px;margin-top:12px;"></div>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button id="settingsClose" style="
          flex:1;padding:13px;border:2px solid #c5d3f0;border-radius:10px;
          background:white;color:#5570b8;font-family:inherit;font-size:0.95rem;
          font-weight:800;cursor:pointer;">Batal</button>
        <button id="settingsSave" style="
          flex:1;padding:13px;border:0;border-radius:10px;
          background:linear-gradient(180deg,#052699,#001976);color:white;
          font-family:inherit;font-size:0.95rem;font-weight:950;cursor:pointer;">
          Simpan &amp; Terapkan
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const amkkmInput = modal.querySelector("#settingAmkkm");
  const brinsInput = modal.querySelector("#settingBrins");
  const amkkmPreview = modal.querySelector("#amkkmPreview");
  const brinsPreview = modal.querySelector("#brinsPreview");
  const msg = modal.querySelector("#settingsSaveMsg");

  // Hitung total DEB semua mantri untuk preview
  const totalDeb = state ? state.mantri.reduce((s, m) => s + getMantriDeb(m), 0) : 0;

  function updatePreview(input, previewEl) {
    const raw = parseNumber(input.value);
    if (raw && totalDeb) {
      previewEl.textContent = `→ ${totalDeb} DEB × ${formatRupiah(raw)} = ${formatRupiah(raw * totalDeb)}`;
    } else if (raw) {
      previewEl.textContent = `Rp ${formatRupiah(raw)} per DEB`;
    } else {
      previewEl.textContent = "";
    }
  }

  function formatOnBlur(input, previewEl) {
    const raw = parseNumber(input.value);
    input.value = raw ? formatRupiah(raw) : "";
    updatePreview(input, previewEl);
  }

  amkkmInput.addEventListener("focus", () => { const n = parseNumber(amkkmInput.value); amkkmInput.value = n ? String(n) : ""; });
  brinsInput.addEventListener("focus", () => { const n = parseNumber(brinsInput.value); brinsInput.value = n ? String(n) : ""; });
  amkkmInput.addEventListener("input", () => updatePreview(amkkmInput, amkkmPreview));
  brinsInput.addEventListener("input", () => updatePreview(brinsInput, brinsPreview));
  amkkmInput.addEventListener("blur", () => formatOnBlur(amkkmInput, amkkmPreview));
  brinsInput.addEventListener("blur", () => formatOnBlur(brinsInput, brinsPreview));

  // Init preview
  updatePreview(amkkmInput, amkkmPreview);
  updatePreview(brinsInput, brinsPreview);

  modal.querySelector("#settingsSave").addEventListener("click", async () => {
    const newAmkkm = parseNumber(amkkmInput.value);
    const newBrins = parseNumber(brinsInput.value);
    const saveBtn = modal.querySelector("#settingsSave");
    saveBtn.disabled = true;
    saveBtn.textContent = "Menyimpan...";
    msg.style.color = "#f7b731";
    msg.textContent = "⟳ Menyimpan ke cloud...";

    unitSettings = { amkkm: newAmkkm, brins: newBrins };
    localStorage.setItem(getUnitSettingsStorageKey(), JSON.stringify(unitSettings));

    try {
      await cloudSaveUnitSettings(unitSettings);
      msg.style.color = "#16a34a";
      msg.textContent = "✓ Tersimpan di cloud — berlaku di semua perangkat!";
    } catch(e) {
      msg.style.color = "#c72f54";
      msg.textContent = "⚠ Gagal simpan ke cloud, tersimpan lokal saja.";
    }

    saveBtn.disabled = false;
    saveBtn.textContent = "Simpan & Terapkan";

    // Reset semua amkkmOverride & brinsOverride agar auto-kalkulasi ulang
    if (state) {
      state.mantri.forEach(m => {
        delete m.amkkmOverride;
        delete m.brinsOverride;
      });
      render();
    }

    setTimeout(() => { msg.textContent = ""; }, 3000);
  });

  modal.querySelector("#settingsClose").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}

function getUnitConfig() {
  return UNITS[currentUnit];
}

let state = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const { storageKey, oldStorageKey, starterData } = getUnitConfig();
  const saved = localStorage.getItem(storageKey);
  const oldSaved = oldStorageKey ? localStorage.getItem(oldStorageKey) : null;
  try {
    if (saved) return normalizeState(JSON.parse(saved), starterData);
    if (oldSaved) return normalizeState(JSON.parse(oldSaved), starterData);
  } catch {
    return clone(starterData);
  }
  return clone(starterData);
}

function normalizeState(raw, starterData) {
  const fallback = starterData || getUnitConfig().starterData;
  const next = clone(raw || fallback);
  next.title = next.title || fallback.title;
  next.loans = Array.isArray(next.loans) && next.loans.length ? next.loans : ["KUR"];
  next.mantri = Array.isArray(next.mantri) ? next.mantri : [];
  next.mantri.forEach((mantri) => {
    mantri.customers = Array.isArray(mantri.customers) ? mantri.customers : [];
    mantri.customers.forEach((customer) => {
      customer.loans = customer.loans || {};
      if (customer.kur && !customer.loans.KUR) customer.loans.KUR = Number(customer.kur || 0);
      next.loans.forEach((loan) => {
        customer.loans[loan] = Number(customer.loans[loan] || 0);
      });
      delete customer.kur;
    });
  });
  // Normalisasi kolom DH
  if (!Array.isArray(next.dhColumns)) next.dhColumns = [];
  next.mantri.forEach((mantri) => {
    if (!Array.isArray(mantri.dhValues)) mantri.dhValues = [];
    // Pastikan panjang dhValues sesuai jumlah dhColumns
    while (mantri.dhValues.length < next.dhColumns.length) mantri.dhValues.push("");
    mantri.dhValues.length = next.dhColumns.length;
  });
  return next;
}

function saveState() {
  localStorage.setItem(getUnitConfig().storageKey, JSON.stringify(state));
  cloudSave(state);
}

function formatRupiah(value) {
  if (!value) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
}

function parseNumber(value) {
  const number = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function getCustomerLoanValue(customer, loan) {
  return Number(customer.loans?.[loan] || 0);
}

function getLoanTotal(mantri, loan) {
  return mantri.customers.reduce((sum, customer) => sum + getCustomerLoanValue(customer, loan), 0);
}

function getLoanDeb(mantri, loan) {
  return mantri.customers.filter((customer) => customer.name.trim() && getCustomerLoanValue(customer, loan) > 0).length;
}

function getMantriTotal(mantri) {
  return state.loans.reduce((sum, loan) => sum + getLoanTotal(mantri, loan), 0);
}

function getMantriDeb(mantri) {
  return state.loans.reduce((sum, loan) => sum + getLoanDeb(mantri, loan), 0);
}

function render() {
  state = normalizeState(state);
  unitTitle.textContent = state.title || getUnitConfig().starterData.title;
  renderHeader();
  renderBody();
  renderFooter();
  updateLoanSelect();
  saveState();
  requestAnimationFrame(resizeAllTextareas);
}

// ── Tombol sync manual + indikator status ──
function initSyncUI() {
  const syncBtn = document.getElementById("syncNowBtn");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      setSyncStatus("⟳ Menyinkronkan...", "#f7b731");
      cloudSave(state);
    });
  }
}

function renderHeader() {
  const staticRowspan = 2;
  const mainRow = document.createElement("tr");
  mainRow.innerHTML = `
    <th class="col-no" rowspan="${staticRowspan}"><span class="head-label">No</span></th>
    <th class="col-mantri" rowspan="${staticRowspan}">
      <span class="head-stack"><span class="head-icon person-icon" aria-hidden="true"></span><span class="head-label">Mantri</span></span>
    </th>
    <th class="col-nasabah" rowspan="${staticRowspan}">
      <span class="head-stack"><span class="head-icon group-icon" aria-hidden="true"></span><span class="head-label">Nama Nasabah</span></span>
    </th>
    ${state.loans.map((loan) => `
      <th class="loan-head" colspan="2">
        <span class="loan-title">${loan}</span>
        <button class="remove-loan" type="button" data-loan="${loan}" title="Hapus pinjaman ${loan}" aria-label="Hapus pinjaman ${loan}">x</button>
      </th>`).join("")}
    <th class="col-total" rowspan="${staticRowspan}"><span class="head-label">Total OS</span></th>
    <th class="col-total-deb" rowspan="${staticRowspan}"><span class="head-label">Total DEB</span></th>
    <th class="col-amkkm" rowspan="${staticRowspan}">
      <span class="head-stack"><span class="head-icon shield-icon" aria-hidden="true"></span><span class="head-label">AMKKM <small>(Asuransi)</small></span></span>
    </th>
    <th class="col-brins" rowspan="${staticRowspan}">
      <span class="head-stack"><span class="head-icon shield-icon" aria-hidden="true"></span><span class="head-label">BRINS <small>(Asuransi)</small></span></span>
    </th>
    ${(state.dhColumns || []).map((dhName, dhIdx) => `
      <th class="col-dh" rowspan="${staticRowspan}" style="min-width:160px;position:relative;">
        <span class="head-label">${dhName}</span>
        <button class="remove-dh" type="button" data-dh-index="${dhIdx}" title="Hapus kolom ${dhName}" aria-label="Hapus kolom ${dhName}" style="position:absolute;top:8px;right:8px;width:26px;height:26px;border:0;border-radius:5px;color:white;background:var(--danger);cursor:pointer;font-weight:950;font-size:0.85rem;">x</button>
      </th>`).join("")}`;

  const subRow = document.createElement("tr");
  subRow.innerHTML = state.loans.map(() => `
    <th class="loan-subhead">DEB</th>
    <th class="loan-subhead">OS</th>`).join("");

  head.replaceChildren(mainRow, subRow);
  head.querySelectorAll(".remove-loan").forEach((button) => {
    button.addEventListener("click", () => {
      const loan = button.dataset.loan;
      if (state.loans.length === 1) return;
      state.loans = state.loans.filter((item) => item !== loan);
      state.mantri.forEach((mantri) => mantri.customers.forEach((customer) => delete customer.loans[loan]));
      render();
    });
  });
  head.querySelectorAll(".remove-dh").forEach((button) => {
    button.addEventListener("click", () => {
      const dhIdx = parseInt(button.dataset.dhIndex, 10);
      state.dhColumns.splice(dhIdx, 1);
      state.mantri.forEach((mantri) => {
        if (Array.isArray(mantri.dhValues)) mantri.dhValues.splice(dhIdx, 1);
      });
      render();
    });
  });
}

function renderBody() {
  body.innerHTML = "";

  state.mantri.forEach((mantri, mantriIndex) => {
    const customers = mantri.customers.length ? mantri.customers : [{ name: "", loans: {}, empty: true }];
    const rowSpan = customers.length;
    const mantriTotal = getMantriTotal(mantri);
    const mantriDeb = getMantriDeb(mantri);
    const amkkmAuto = mantriDeb * getAmkkmRate();
    const brinsAuto = mantriDeb * getBrinsRate();

    customers.forEach((customer, customerIndex) => {
      const row = document.createElement("tr");
      row.className = "customer-row";

      if (customerIndex === 0) {
        row.appendChild(createNoCell(mantriIndex + 1, rowSpan));
        row.appendChild(createMantriCell(mantri, mantriIndex, rowSpan));
      }

      row.appendChild(createCustomerCell(customer, mantriIndex, customerIndex, Boolean(customer.empty)));
      state.loans.forEach((loan) => {
        if (customerIndex === 0) row.appendChild(createCalculatedCell(mantriIndex, `${loan}-deb`, rowSpan, String(getLoanDeb(mantri, loan)), "deb-cell"));
        row.appendChild(createLoanOsCell(customer, mantriIndex, customerIndex, loan, Boolean(customer.empty)));
      });

      if (customerIndex === 0) {
        row.appendChild(createCalculatedCell(mantriIndex, "total", rowSpan, formatRupiah(mantriTotal), "total-cell"));
        row.appendChild(createCalculatedCell(mantriIndex, "total-deb", rowSpan, String(mantriDeb), "total-deb-cell"));
        row.appendChild(createEditableInsuranceCell(mantri, mantriIndex, "amkkm", rowSpan, amkkmAuto));
        row.appendChild(createEditableInsuranceCell(mantri, mantriIndex, "brins", rowSpan, brinsAuto));
        (state.dhColumns || []).forEach((dhName, dhIdx) => {
          row.appendChild(createDhCell(mantri, mantriIndex, dhIdx, rowSpan));
        });
      }

      body.appendChild(row);
    });
  });
}

function renderFooter() {
  const colSpan = 3 + state.loans.length * 2;
  const grand = state.mantri.reduce((sum, mantri) => sum + getMantriTotal(mantri), 0);
  const grandDeb = state.mantri.reduce((sum, mantri) => sum + getMantriDeb(mantri), 0);
  const dhCount = (state.dhColumns || []).length;

  // Hitung total per kolom DH
  const dhTotals = (state.dhColumns || []).map((_, dhIdx) =>
    state.mantri.reduce((sum, mantri) => {
      const raw = Array.isArray(mantri.dhValues) ? mantri.dhValues[dhIdx] : "";
      return sum + (raw !== undefined && raw !== "" ? parseNumber(String(raw)) : 0);
    }, 0)
  );

  const dhTotalCells = dhTotals.map((total, dhIdx) => `
    <td class="grand-dh-total" data-dh-total="${dhIdx}" style="
      height:88px;text-align:center;vertical-align:middle;
      background:var(--theme-foot-bg);
      border-left:1px solid var(--theme-line);
      color:var(--theme-primary);font-weight:950;
      white-space:nowrap;padding:0 12px;min-width:200px;
    ">
      <div style="font-size:0.78rem;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:var(--theme-muted);margin-bottom:4px;">TOTAL DH</div>
      <div style="font-size:1.55rem;font-weight:950;">${total ? formatRupiah(total) : "—"}</div>
    </td>
  `).join("");

  foot.innerHTML = `
    <tr>
      <td colspan="${colSpan}" class="grand-label">
        <span class="chart-badge" aria-hidden="true">&#10003;</span>
        Total Realisasi
        <strong id="grandTotal">${formatRupiah(grand)}</strong>
      </td>
      <td class="grand-fill"></td>
      <td class="grand-deb" id="grandDeb">
        <span class="grand-deb-icon group-icon" aria-hidden="true"></span>
        <span>TOTAL DEB</span>
        <strong>${grandDeb}</strong>
      </td>
      <td colspan="2" class="grand-fill"></td>
      ${dhTotalCells}
    </tr>`;
}

function createNoCell(number, rowSpan) {
  const cell = document.createElement("td");
  cell.rowSpan = rowSpan;
  cell.innerHTML = `<span class="no-badge">${number}</span>`;
  return cell;
}

function createMantriCell(mantri, mantriIndex, rowSpan) {
  const cell = document.createElement("td");
  cell.rowSpan = rowSpan;
  cell.className = "mantri-cell";

  const input = document.createElement("textarea");
  input.className = "mantri-name";
  input.value = mantri.name;
  input.rows = 1;
  input.setAttribute("aria-label", "Nama mantri");

  // PN badge — ditampilkan di bawah nama mantri
  const pnBadge = document.createElement("div");
  pnBadge.className = "mantri-pn";
  function updatePnBadge(name) {
    const pn = getMantriPN(name);
    pnBadge.textContent = pn ? "PN " + pn : "";
    pnBadge.style.display = pn ? "" : "none";
  }
  updatePnBadge(mantri.name);

  input.addEventListener("input", () => {
    state.mantri[mantriIndex].name = input.value;
    updatePnBadge(input.value);
    saveState();
    autoResize(input);
  });

  const tools = document.createElement("div");
  tools.className = "mantri-tools";
  tools.innerHTML = `
    <button class="add-customer" type="button" title="Tambah nasabah" aria-label="Tambah nasabah">+</button>
    <button class="row-action delete-mantri" type="button" title="Hapus mantri" aria-label="Hapus mantri">x</button>`;

  tools.querySelector(".add-customer").addEventListener("click", () => {
    const loans = {};
    state.loans.forEach((loan) => loans[loan] = 0);
    state.mantri[mantriIndex].customers.push({ name: "", loans });
    render();
  });

  tools.querySelector(".delete-mantri").addEventListener("click", () => {
    if (state.mantri.length === 1) return;
    state.mantri.splice(mantriIndex, 1);
    render();
  });

  cell.append(input, pnBadge, tools);
  return cell;
}

function createCustomerCell(customer, mantriIndex, customerIndex, isEmpty) {
  const cell = document.createElement("td");
  cell.className = "nasabah-cell";

  if (isEmpty) {
    cell.className = "nasabah-cell empty-cell";
    cell.textContent = "-";
    return cell;
  }

  const wrap = document.createElement("div");
  wrap.className = "customer-controls";
  const input = document.createElement("textarea");
  input.className = "name-input";
  input.value = customer.name;
  input.rows = 1;
  input.dataset.mantriIndex = String(mantriIndex);
  input.dataset.customerIndex = String(customerIndex);
  input.dataset.field = "name";
  input.setAttribute("aria-label", "Nama nasabah");
  input.addEventListener("input", () => {
    state.mantri[mantriIndex].customers[customerIndex].name = input.value;
    saveState();
    updateTotalsOnly();
    autoResize(input);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-customer";
  deleteBtn.type = "button";
  deleteBtn.title = "Hapus nasabah";
  deleteBtn.setAttribute("aria-label", "Hapus nasabah");
  deleteBtn.textContent = "x";
  deleteBtn.addEventListener("click", () => {
    state.mantri[mantriIndex].customers.splice(customerIndex, 1);
    render();
  });

  wrap.append(input, deleteBtn);
  cell.appendChild(wrap);
  return cell;
}

function createLoanOsCell(customer, mantriIndex, customerIndex, loan, isEmpty) {
  const cell = document.createElement("td");
  cell.className = "os-cell";
  cell.dataset.loan = loan;

  if (isEmpty) {
    cell.className = "os-cell empty-cell";
    cell.textContent = "-";
    return cell;
  }

  const input = document.createElement("input");
  input.className = "os-input";
  input.value = getCustomerLoanValue(customer, loan) ? formatRupiah(getCustomerLoanValue(customer, loan)) : "";
  input.dataset.mantriIndex = String(mantriIndex);
  input.dataset.customerIndex = String(customerIndex);
  input.dataset.loan = loan;
  input.setAttribute("aria-label", `OS ${loan}`);
  input.inputMode = "numeric";

  // Check if another loan already has a value for this customer — if so, disable this input
  function getActiveOsLoan(cust) {
    return state.loans.find(l => l !== loan && getCustomerLoanValue(cust, l) > 0) || null;
  }

  function refreshDisabledState() {
    const cust = state.mantri[mantriIndex]?.customers[customerIndex];
    if (!cust) return;
    const otherFilledLoan = state.loans.find(l => l !== loan && getCustomerLoanValue(cust, l) > 0);
    input.disabled = Boolean(otherFilledLoan);
    input.title = otherFilledLoan ? `OS sudah diisi di kolom ${otherFilledLoan}` : "";
    input.style.opacity = input.disabled ? "0.35" : "";
    input.style.cursor = input.disabled ? "not-allowed" : "";
    input.style.background = input.disabled ? "#f0f0f0" : "";
  }

  refreshDisabledState();

  input.addEventListener("focus", () => {
    input.value = getCustomerLoanValue(customer, loan) || "";
  });
  input.addEventListener("input", () => {
    state.mantri[mantriIndex].customers[customerIndex].loans[loan] = parseNumber(input.value);
    saveState();
    updateTotalsOnly();
    // Refresh all OS inputs for this customer row to enforce exclusivity
    refreshAllOsForCustomer(mantriIndex, customerIndex);
  });
  input.addEventListener("blur", render);

  cell.appendChild(input);
  return cell;
}

function refreshAllOsForCustomer(mantriIndex, customerIndex) {
  const cust = state.mantri[mantriIndex]?.customers[customerIndex];
  if (!cust) return;
  state.loans.forEach(loan => {
    const input = document.querySelector(
      `input[data-mantri-index="${mantriIndex}"][data-customer-index="${customerIndex}"][data-loan="${loan}"]`
    );
    if (!input) return;
    const otherFilledLoan = state.loans.find(l => l !== loan && getCustomerLoanValue(cust, l) > 0);
    input.disabled = Boolean(otherFilledLoan);
    input.title = otherFilledLoan ? `OS sudah diisi di kolom ${otherFilledLoan}` : "";
    input.style.opacity = input.disabled ? "0.35" : "";
    input.style.cursor = input.disabled ? "not-allowed" : "";
    input.style.background = input.disabled ? "#f0f0f0" : "";
  });
}

function createCalculatedCell(mantriIndex, type, rowSpan, label, className) {
  const cell = document.createElement("td");
  cell.rowSpan = rowSpan;
  cell.className = `calculated ${className || ""}`.trim();
  cell.dataset.mantriIndex = String(mantriIndex);
  cell.dataset.type = type;
  cell.textContent = label;
  return cell;
}

// AMKKM / BRINS: otomatis tapi bisa diubah manual
function createEditableInsuranceCell(mantri, mantriIndex, type, rowSpan, autoValue) {
  const cell = document.createElement("td");
  cell.rowSpan = rowSpan;
  cell.className = "calculated insurance-cell";
  cell.dataset.mantriIndex = String(mantriIndex);
  cell.dataset.type = type;

  const storedKey = `${type}Override`;
  const currentVal = mantri[storedKey] !== undefined ? mantri[storedKey] : "";

  const input = document.createElement("input");
  input.className = "os-input";
  input.type = "text";
  input.inputMode = "numeric";
  const displayVal = currentVal !== "" ? currentVal : (autoValue || 0);
  input.value = displayVal ? formatRupiah(displayVal) : "0";
  input.dataset.mantriIndex = String(mantriIndex);
  input.dataset.type = type;
  input.setAttribute("aria-label", type.toUpperCase());
  input.style.cssText = "width:100%;text-align:center;font-size:1.38rem;font-weight:950;background:transparent;border:1px solid transparent;border-radius:6px;min-height:44px;padding:4px 6px;color:var(--theme-primary);";

  // Tandai apakah nilai sudah pernah diubah manual
  let isManual = mantri[storedKey] !== undefined;

  input.addEventListener("focus", () => {
    input.style.background = "#fffdf4";
    input.style.borderColor = "var(--gold)";
    input.style.boxShadow = "0 0 0 3px rgba(247,183,49,0.18)";
    // Saat fokus tampilkan angka bersih
    const focusVal = isManual ? (state.mantri[mantriIndex][storedKey] || 0) : (autoValue || 0);
    input.value = focusVal ? String(focusVal) : "";
  });
  input.addEventListener("blur", () => {
    const n = parseNumber(input.value);
    input.value = n ? formatRupiah(n) : "0";
    input.style.background = "transparent";
    input.style.borderColor = "transparent";
    input.style.boxShadow = "none";
  });
  input.addEventListener("input", () => {
    const raw = parseNumber(input.value);
    state.mantri[mantriIndex][storedKey] = raw;
    isManual = true;
    saveState();
  });

  cell.appendChild(input);
  return cell;
}

// Kolom DH: input nominal format rupiah per mantri
function createDhCell(mantri, mantriIndex, dhIdx, rowSpan) {
  const cell = document.createElement("td");
  cell.rowSpan = rowSpan;
  cell.className = "calculated dh-cell";
  cell.dataset.mantriIndex = String(mantriIndex);
  cell.dataset.type = `dh-${dhIdx}`;
  cell.style.minWidth = "200px";

  if (!Array.isArray(mantri.dhValues)) mantri.dhValues = [];
  const raw = mantri.dhValues[dhIdx];
  const numVal = (raw !== undefined && raw !== "") ? parseNumber(String(raw)) : 0;

  const input = document.createElement("input");
  input.className = "os-input";
  input.type = "text";
  input.inputMode = "numeric";
  input.dataset.mantriIndex = String(mantriIndex);
  input.dataset.dhIdx = String(dhIdx);
  // Tampilkan format rupiah jika ada nilai, kosong jika nol
  input.value = numVal ? formatRupiah(numVal) : "";
  input.placeholder = "";
  input.setAttribute("aria-label", state.dhColumns[dhIdx] || "DH");
  input.style.cssText = "width:100%;text-align:center;font-size:1.38rem;font-weight:950;background:transparent;border:1px solid transparent;border-radius:6px;min-height:44px;padding:4px 6px;color:var(--theme-primary);";

  input.addEventListener("focus", () => {
    const n = parseNumber(input.value);
    input.value = n ? String(n) : "";
    input.style.background = "#fffdf4";
    input.style.borderColor = "var(--gold)";
    input.style.boxShadow = "0 0 0 3px rgba(247,183,49,0.18)";
  });
  input.addEventListener("input", () => {
    if (!Array.isArray(state.mantri[mantriIndex].dhValues)) state.mantri[mantriIndex].dhValues = [];
    state.mantri[mantriIndex].dhValues[dhIdx] = input.value;
    saveState();
    updateDhTotals();
  });
  input.addEventListener("blur", () => {
    const n = parseNumber(input.value);
    input.value = n ? formatRupiah(n) : "";
    if (!Array.isArray(state.mantri[mantriIndex].dhValues)) state.mantri[mantriIndex].dhValues = [];
    state.mantri[mantriIndex].dhValues[dhIdx] = n ? String(n) : "";
    saveState();
    updateDhTotals();
    input.style.background = "transparent";
    input.style.borderColor = "transparent";
    input.style.boxShadow = "none";
  });

  cell.appendChild(input);
  return cell;
}

function updateTotalsOnly() {
  state.mantri.forEach((mantri, mantriIndex) => {
    const mantriDeb = getMantriDeb(mantri);
    state.loans.forEach((loan) => {
      const debCell = document.querySelector(`[data-mantri-index="${mantriIndex}"][data-type="${loan}-deb"]`);
      if (debCell) debCell.textContent = String(getLoanDeb(mantri, loan));
    });
    const totalCell = document.querySelector(`[data-mantri-index="${mantriIndex}"][data-type="total"]`);
    const totalDebCell = document.querySelector(`[data-mantri-index="${mantriIndex}"][data-type="total-deb"]`);
    if (totalCell) totalCell.textContent = formatRupiah(getMantriTotal(mantri));
    if (totalDebCell) totalDebCell.textContent = String(mantriDeb);
    // AMKKM / BRINS: hanya update jika belum diubah manual
    ["amkkm", "brins"].forEach((type) => {
      const cell = document.querySelector(`[data-mantri-index="${mantriIndex}"][data-type="${type}"]`);
      if (!cell) return;
      const inp = cell.querySelector("input");
      if (!inp) return;
      const storedKey = `${type}Override`;
      if (mantri[storedKey] === undefined) {
        // belum diubah manual, update otomatis
        const rate = type === "amkkm" ? getAmkkmRate() : getBrinsRate();
        const autoVal = mantriDeb * rate;
        inp.value = autoVal ? formatRupiah(autoVal) : "0";
      }
    });
  });
  renderFooter();
}

// Update total kolom DH di footer tanpa full render
function updateDhTotals() {
  (state.dhColumns || []).forEach((_, dhIdx) => {
    const total = state.mantri.reduce((sum, mantri) => {
      const raw = Array.isArray(mantri.dhValues) ? mantri.dhValues[dhIdx] : "";
      return sum + (raw !== undefined && raw !== "" ? parseNumber(String(raw)) : 0);
    }, 0);
    const cell = document.querySelector(`[data-dh-total="${dhIdx}"]`);
    if (!cell) return;
    const valDiv = cell.querySelector("div:last-child");
    if (valDiv) valDiv.textContent = total ? formatRupiah(total) : "—";
  });
}
function updateLoanSelect() {
  const used = new Set(state.loans);
  [...loanTypeSelect.options].forEach((option) => option.disabled = used.has(option.value));
  const next = [...loanTypeSelect.options].find((option) => !option.disabled);
  if (next) loanTypeSelect.value = next.value;
  addLoanBtn.disabled = !next;
}

function autoResize(element) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function resizeAllTextareas() {
  document.querySelectorAll("textarea").forEach(autoResize);
}

function initApp() {
  head = document.querySelector("#reportHead");
  body = document.querySelector("#reportBody");
  foot = document.querySelector("#reportFoot");
  unitTitle = document.querySelector("#unitTitle");
  addMantriBtn = document.querySelector("#addMantriBtn");
  addLoanBtn = document.querySelector("#addLoanBtn");
  loanTypeSelect = document.querySelector("#loanTypeSelect");
  resetBtn = document.querySelector("#resetBtn");
  printBtn = document.querySelector("#printBtn");

  // Load lokal dulu (tampil cepat)
  state = loadState();
  unitTitle.textContent = state.title || getUnitConfig().starterData.title;

  // Load setting AMKKM/BRINS (lokal dulu, lalu cloud)
  loadUnitSettings().then(() => {
    render();
    // Lalu load dari cloud (replace jika ada)
    const { starterData } = getUnitConfig();
    cloudLoad(starterData).then(cloudState => {
      if (cloudState) {
        state = cloudState;
        localStorage.setItem(getUnitConfig().storageKey, JSON.stringify(state));
        render();
      }
    });
  });

  // Auto-refresh dari cloud setiap 30 detik (agar selalu sinkron)
  setInterval(() => {
    // Reload settings juga (kasus diubah dari perangkat lain)
    cloudLoadUnitSettings().then(cs => {
      if (cs) {
        unitSettings = { amkkm: 0, brins: 0, ...cs };
        localStorage.setItem(getUnitSettingsStorageKey(), JSON.stringify(unitSettings));
      }
    });
    cloudLoad(getUnitConfig().starterData).then(cloudState => {
      if (cloudState) {
        state = cloudState;
        localStorage.setItem(getUnitConfig().storageKey, JSON.stringify(state));
        render();
      }
    });
  }, 30000);

  // Hapus placeholder unitTitle — akan diset ulang oleh render() di bawah
  unitTitle.textContent = state.title || getUnitConfig().starterData.title;

  // ── TEMA SISTEM ──
  const THEMES = [
    { key: "biru",   label: "Biru",   color: "#001976" },
    { key: "hitam",  label: "Hitam",  color: "#1a1a2e" },
    { key: "pink",   label: "Pink",   color: "#7b2d5c" },
    { key: "merah",  label: "Merah",  color: "#7a1c2e" },
    { key: "kuning", label: "Kuning", color: "#7a5500" },
    { key: "hijau",  label: "Hijau",  color: "#1a5c3a" },
  ];

  const themeStorageKey = `theme-${currentUnit}`;
  let activeTheme = localStorage.getItem(themeStorageKey) || "biru";

  const reportCard = document.querySelector(".report-card");
  const themeBtnDot = document.querySelector("#themeBtnDot");

  function applyTheme(key) {
    THEMES.forEach(t => reportCard.classList.remove(`theme-${t.key}`));
    reportCard.classList.add(`theme-${key}`);
    const t = THEMES.find(t => t.key === key);
    if (themeBtnDot) themeBtnDot.style.background = t ? t.color : "";
  }

  applyTheme(activeTheme);

  const themeBtn = document.querySelector("#themeBtn");
  const themeWrap = themeBtn.closest(".toolbar-theme-wrap");
  let pickerOpen = false;
  let pickerEl = null;

  function closePicker() {
    if (pickerEl) { pickerEl.remove(); pickerEl = null; }
    pickerOpen = false;
  }

  function openPicker() {
    pickerEl = document.createElement("div");
    pickerEl.className = "theme-picker";
    pickerEl.innerHTML = `
      <div class="theme-picker-title">Pilih Tema</div>
      ${THEMES.map(t => `
        <div class="theme-swatch-row${activeTheme === t.key ? " active" : ""}" data-theme="${t.key}">
          <span class="theme-swatch" style="background:${t.color}"></span>
          <span class="theme-swatch-label">${t.label}</span>
        </div>
      `).join("")}
    `;
    themeWrap.appendChild(pickerEl);
    pickerEl.querySelectorAll("[data-theme]").forEach(row => {
      row.addEventListener("click", () => {
        activeTheme = row.dataset.theme;
        localStorage.setItem(themeStorageKey, activeTheme);
        applyTheme(activeTheme);
        closePicker();
        pickerOpen = false;
      });
    });
  }

  themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (pickerOpen) { closePicker(); pickerOpen = false; }
    else { openPicker(); pickerOpen = true; }
  });

  document.addEventListener("click", (e) => {
    if (pickerOpen && pickerEl && !pickerEl.contains(e.target) && e.target !== themeBtn) {
      closePicker(); pickerOpen = false;
    }
  });

  // Tombol tambah kolom DH
  const addDhBtn = document.createElement("button");
  addDhBtn.id = "addDhBtn";
  addDhBtn.className = "tool-btn";
  addDhBtn.type = "button";
  addDhBtn.title = "Tambah kolom DH";
  addDhBtn.innerHTML = `<span aria-hidden="true">+</span> DH`;
  addDhBtn.addEventListener("click", () => {
    if (!Array.isArray(state.dhColumns)) state.dhColumns = [];
    const newName = "DH";
    state.dhColumns.push(newName);
    state.mantri.forEach((mantri) => {
      if (!Array.isArray(mantri.dhValues)) mantri.dhValues = [];
      mantri.dhValues.push("");
    });
    render();
  });
  // Sisipkan setelah printBtn (sebelum resetBtn)
  printBtn.after(addDhBtn);

  // Tombol Setting AMKKM / BRINS
  const amkkmSettingBtn = document.createElement("button");
  amkkmSettingBtn.id = "amkkmSettingBtn";
  amkkmSettingBtn.className = "tool-btn";
  amkkmSettingBtn.type = "button";
  amkkmSettingBtn.title = "Atur nominal AMKKM & BRINS per DEB";
  amkkmSettingBtn.innerHTML = `<span aria-hidden="true">⚙</span> AMKKM/BRINS`;
  amkkmSettingBtn.addEventListener("click", () => showAmkkmBrinsSettings());
  addDhBtn.after(amkkmSettingBtn);

  addMantriBtn.addEventListener("click", () => {
    const loans = {};
    state.loans.forEach((loan) => loans[loan] = 0);
    state.mantri.push({ name: "Mantri Baru", customers: [{ name: "", loans }] });
    render();
  });

  addLoanBtn.addEventListener("click", () => {
    const loan = loanTypeSelect.value;
    if (!loan || state.loans.includes(loan)) return;
    state.loans.push(loan);
    state.mantri.forEach((mantri) => mantri.customers.forEach((customer) => customer.loans[loan] = 0));
    render();
  });

  resetBtn.addEventListener("click", async () => {
    if (!confirm("Reset data unit ini? Data cloud juga akan dihapus.")) return;
    const { storageKey, starterData } = getUnitConfig();
    state = clone(starterData);
    localStorage.removeItem(storageKey);
    // Hapus juga dari cloud
    if (DB_URL && currentUnit) {
      try {
        await fetch(`${DB_URL}/units/${currentUnit}.json`, { method: "DELETE" });
      } catch(e) {}
    }
    render();
  });

  printBtn.addEventListener("click", exportReportImage);

  initSyncUI();
  initDateToggle();
}

// ── Tanggal real-time Indonesia dengan checkbox ──
function getIndonesianDate() {
  const now = new Date();
  return now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar"
  });
}

function initDateToggle() {
  const dateToggle = document.getElementById("dateToggle");
  const dateLiveDisplay = document.getElementById("dateLiveDisplay");
  if (!dateToggle || !dateLiveDisplay) return;

  // Muat preferensi dari localStorage
  const storageKey = `date-toggle-${currentUnit}`;
  const saved = localStorage.getItem(storageKey);
  if (saved !== null) dateToggle.checked = saved === "1";

  function updateDisplay() {
    dateLiveDisplay.textContent = getIndonesianDate();
    localStorage.setItem(storageKey, dateToggle.checked ? "1" : "0");
  }

  updateDisplay();
  // Update setiap menit
  setInterval(updateDisplay, 60000);
  dateToggle.addEventListener("change", updateDisplay);
}

function updateStateFromFields() {
  document.querySelectorAll(".mantri-name").forEach((field, index) => {
    if (state.mantri[index]) state.mantri[index].name = field.value;
  });

  state.mantri.forEach((mantri, mantriIndex) => {
    mantri.customers.forEach((customer, customerIndex) => {
      const rowKey = `[data-mantri-index="${mantriIndex}"][data-customer-index="${customerIndex}"]`;
      const nameField = document.querySelector(`${rowKey}[data-field="name"]`);
      if (nameField) customer.name = nameField.value;
      state.loans.forEach((loan) => {
        const osField = document.querySelector(`${rowKey}[data-loan="${loan}"]`);
        if (osField) customer.loans[loan] = parseNumber(osField.value);
      });
    });
  });
  saveState();
}

// Baca warna tema aktif dari CSS variables di DOM
function getThemeColors() {
  const el = document.querySelector(".report-card") || document.documentElement;
  const cs = getComputedStyle(el);
  const get = (v) => cs.getPropertyValue(v).trim();

  function resolveColor(raw) {
    if (!raw) return "#001976";
    if (raw.startsWith("#") || raw.startsWith("rgb")) return raw;
    const m = raw.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/g);
    return m ? m[0] : "#001976";
  }

  const primary  = resolveColor(get("--theme-primary"));
  const primary2 = resolveColor(get("--theme-primary-2"));
  const line     = resolveColor(get("--theme-line"));
  const soft     = resolveColor(get("--theme-soft"));

  const headBgRaw = get("--theme-head-bg");
  const footBgRaw = get("--theme-foot-bg");
  const headColors = (headBgRaw.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/g) || [primary2, primary]);
  const footColors = (footBgRaw.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/g) || [soft, soft]);

  return {
    primary,
    primary2,
    line,
    soft,
    headTop: headColors[0] || primary2,
    headBot: headColors[1] || primary,
    footTop: footColors[0] || soft,
    footBot: footColors[1] || soft,
  };
}

function makeHeaderGradient(ctx, x, y, width, height, colorTop, colorBot) {
  const g = ctx.createLinearGradient(x, y, x, y + height);
  g.addColorStop(0, colorTop);
  g.addColorStop(1, colorBot);
  return g;
}

async function exportReportImage() {
  updateStateFromFields();
  const plans = buildExportPlans();
  const columns = getExportColumns(plans);
  const tc = getThemeColors();
  const tableWidth = columns.reduce((sum, width) => sum + width, 0);
  const width = Math.max(1600, tableWidth + 96);
  const tableHeight = 144 + plans.reduce((sum, plan) => sum + plan.groupHeight, 0) + 88;
  const height = tableHeight + 184;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const accentH = 10;
  ctx.fillStyle = makeHeaderGradient(ctx, 0, 0, width, accentH, tc.headTop, tc.headBot);
  ctx.fillRect(0, 0, width, accentH);

  ctx.fillStyle = tc.primary;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 100px Arial";
  ctx.fillText((state.title || "MARGASARI").toUpperCase(), width / 2, accentH + 76);

  // ── Tanggal di kanan atas (jika checkbox dicentang) ──
  const dateToggle = document.getElementById("dateToggle");
  if (dateToggle && dateToggle.checked) {
    const dateStr = getIndonesianDate();
    ctx.font = "700 36px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = tc.primary;
    ctx.globalAlpha = 0.72;
    ctx.fillText(dateStr, width - 48, accentH + 50);
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
  }

  drawExportTable(ctx, Math.round((width - tableWidth) / 2), accentH + 136, columns, plans, tc);

  const link = document.createElement("a");
  link.download = `laporan-${(state.title || "margasari").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function getExportColumns(plans) {
  const measure = document.createElement("canvas").getContext("2d");
  const textWidth = (text, font = "900 28px Arial") => {
    measure.font = font;
    return Math.ceil(measure.measureText(String(text || "")).width);
  };
  const domWidths = [
    ".col-no",
    ".col-mantri",
    ".col-nasabah",
    ...state.loans.flatMap(() => [".loan-subhead", ".loan-subhead"]),
    ".col-total",
    ".col-total-deb",
    ".col-amkkm",
    ".col-brins",
    ...((state.dhColumns || []).map(() => ".col-dh")),
  ];
  const subheads = [...document.querySelectorAll(".loan-subhead")];
  const dhHeads = [...document.querySelectorAll(".col-dh")];
  let subheadIndex = 0;
  let dhHeadIndex = 0;
  const columns = domWidths.map((selector) => {
    if (selector === ".loan-subhead") {
      const width = subheads[subheadIndex]?.getBoundingClientRect().width || 0;
      subheadIndex += 1;
      return Math.ceil(width);
    }
    if (selector === ".col-dh") {
      const width = dhHeads[dhHeadIndex]?.getBoundingClientRect().width || 160;
      dhHeadIndex += 1;
      return Math.ceil(width);
    }
    return Math.ceil(document.querySelector(selector)?.getBoundingClientRect().width || 0);
  });

  const mantriWidth = Math.max(185, ...state.mantri.map((mantri) => {
    const nameW = textWidth(mantri.name, "900 30px Arial") + 44;
    const pn = getMantriPN(mantri.name);
    const pnW = pn ? textWidth("PN " + pn, "700 22px Arial") + 44 : 0;
    return Math.max(nameW, pnW);
  }));
  const customerNames = state.mantri.flatMap((mantri) => mantri.customers.map((customer) => customer.name || "-"));
  const customerWidth = Math.max(305, ...customerNames.map((name) => textWidth(name, "900 28px Arial") + 54));
  columns[1] = Math.max(columns[1], mantriWidth);
  columns[2] = Math.max(columns[2], customerWidth);

  state.loans.forEach((loan, index) => {
    const osIndex = 4 + index * 2;
    const values = state.mantri.flatMap((mantri) => mantri.customers.map((customer) => {
      const value = getCustomerLoanValue(customer, loan);
      return value ? formatRupiah(value) : "";
    }));
    columns[osIndex] = Math.max(columns[osIndex], textWidth(loan, "900 28px Arial") + 42, ...values.map((value) => textWidth(value, "900 28px Arial") + 48));
  });

  const totalWidth = Math.max(190, ...state.mantri.map((mantri) => textWidth(formatRupiah(getMantriTotal(mantri)), "900 30px Arial") + 48));
  const maxDebWidth = Math.max(320, textWidth(`TOTAL DEB ${state.mantri.reduce((sum, mantri) => sum + getMantriDeb(mantri), 0)}`, "900 42px Arial") + 122);
  const totalIndex = 3 + state.loans.length * 2;
  columns[totalIndex] = Math.max(columns[totalIndex], totalWidth);
  columns[totalIndex + 1] = Math.max(columns[totalIndex + 1], maxDebWidth);

  // Pastikan lebar kolom DH cukup untuk teks total DH
  (state.dhColumns || []).forEach((dhName, dhIdx) => {
    const colIdx = totalIndex + 4 + dhIdx;
    const dhTotal = state.mantri.reduce((sum, mantri) => {
      const raw = Array.isArray(mantri.dhValues) ? mantri.dhValues[dhIdx] : "";
      return sum + (raw !== undefined && raw !== "" ? parseNumber(String(raw)) : 0);
    }, 0);
    const totalTextW = textWidth(dhTotal ? formatRupiah(dhTotal) : "—", "900 36px Arial") + 56;
    const nameW = textWidth(dhName, "900 28px Arial") + 56;
    const dhValW = Math.max(
      ...state.mantri.map(mantri => {
        const raw = Array.isArray(mantri.dhValues) ? mantri.dhValues[dhIdx] : "";
        const n = raw !== "" && raw !== undefined ? parseNumber(String(raw)) : 0;
        return n ? textWidth(formatRupiah(n), "900 30px Arial") + 48 : 0;
      }),
      0
    );
    columns[colIdx] = Math.max(columns[colIdx] || 200, totalTextW, nameW, dhValW, 220);
  });

  return columns;
}

function buildExportPlans() {
  return state.mantri.map((mantri) => {
    const customers = mantri.customers.length ? mantri.customers : [{ name: "-", loans: {}, empty: true }];
    const rows = customers.map((customer) => {
      const nameLines = [customer.empty ? "-" : customer.name || "-"];
      const osLines = state.loans.map((loan) => {
        if (customer.empty) return ["-"];
        const value = getCustomerLoanValue(customer, loan);
        return [value ? formatRupiah(value) : ""];
      });
      return { customer, nameLines, osLines, height: 82 };
    });
    return { mantri, rows, groupHeight: rows.reduce((sum, row) => sum + row.height, 0) };
  });
}

function drawExportTable(ctx, x, y, columns, plans, tc) {
  const tableWidth = columns.reduce((sum, width) => sum + width, 0);
  const headerTop = 76;
  const headerSub = 68;
  const footerHeight = 82;
  let cx = x;

  // Header background gradient
  const headGrad = makeHeaderGradient(ctx, x, y, tableWidth, headerTop + headerSub, tc.headTop, tc.headBot);
  ctx.fillStyle = headGrad;
  ctx.fillRect(x, y, tableWidth, headerTop + headerSub);

  drawHeadCell(ctx, cx, y, columns[0], headerTop + headerSub, ["No"], tc); cx += columns[0];
  drawHeadCell(ctx, cx, y, columns[1], headerTop + headerSub, ["Mantri"], tc); cx += columns[1];
  drawHeadCell(ctx, cx, y, columns[2], headerTop + headerSub, ["Nama", "Nasabah"], tc); cx += columns[2];
  state.loans.forEach((loan, index) => {
    const debW = columns[3 + index * 2];
    const osW = columns[4 + index * 2];
    drawHeadCell(ctx, cx, y, debW + osW, headerTop, [loan], tc);
    drawHeadCell(ctx, cx, y + headerTop, debW, headerSub, ["DEB"], tc);
    drawHeadCell(ctx, cx + debW, y + headerTop, osW, headerSub, ["OS"], tc);
    cx += debW + osW;
  });
  const totalIndex = 3 + state.loans.length * 2;
  drawHeadCell(ctx, cx, y, columns[totalIndex], headerTop + headerSub, ["Total", "OS"], tc); cx += columns[totalIndex];
  drawHeadCell(ctx, cx, y, columns[totalIndex + 1], headerTop + headerSub, ["Total", "DEB"], tc); cx += columns[totalIndex + 1];
  drawHeadCell(ctx, cx, y, columns[totalIndex + 2], headerTop + headerSub, ["AMKKM"], tc); cx += columns[totalIndex + 2];
  drawHeadCell(ctx, cx, y, columns[totalIndex + 3], headerTop + headerSub, ["BRINS"], tc); cx += columns[totalIndex + 3];
  (state.dhColumns || []).forEach((dhName, dhIdx) => {
    drawHeadCell(ctx, cx, y, columns[totalIndex + 4 + dhIdx], headerTop + headerSub, [dhName], tc); cx += columns[totalIndex + 4 + dhIdx];
  });

  let cy = y + headerTop + headerSub;
  let grand = 0;
  let grandDeb = 0;

  plans.forEach((plan, mantriIndex) => {
    const mantriTotal = getMantriTotal(plan.mantri);
    const mantriDeb = getMantriDeb(plan.mantri);
    const amkkmAuto = mantriDeb * getAmkkmRate();
    const brinsAuto = mantriDeb * getBrinsRate();
    grand += mantriTotal;
    grandDeb += mantriDeb;
    const gy = cy;
    const gh = plan.groupHeight;
    cx = x;

    // Alternating row background setiap mantri (sedikit soft)
    const rowBg = mantriIndex % 2 === 0 ? "#ffffff" : tc.soft;
    ctx.fillStyle = rowBg;
    ctx.fillRect(x, gy, tableWidth, gh);

    drawGroupCell(ctx, cx, gy, columns[0], gh, String(mantriIndex + 1), true, tc); cx += columns[0];
    drawGroupCell(ctx, cx, gy, columns[1], gh, plan.mantri.name || "-", false, tc); cx += columns[1];

    plan.rows.forEach((row) => {
      let rowX = cx;
      drawTextCell(ctx, rowX, cy, columns[2], row.height, row.nameLines, tc); rowX += columns[2];
      state.loans.forEach((loan, loanIndex) => {
        if (cy === gy) {
          const debValue = getLoanDeb(plan.mantri, loan);
          drawGroupCell(ctx, rowX, gy, columns[3 + loanIndex * 2], gh, debValue ? String(debValue) : "", false, tc);
        }
        rowX += columns[3 + loanIndex * 2];
        drawTextCell(ctx, rowX, cy, columns[4 + loanIndex * 2], row.height, row.osLines[loanIndex], tc);
        rowX += columns[4 + loanIndex * 2];
      });
      cy += row.height;
    });

    cx = x + columns[0] + columns[1] + columns[2] + state.loans.reduce((sum, _, index) => sum + columns[3 + index * 2] + columns[4 + index * 2], 0);
    drawGroupCell(ctx, cx, gy, columns[totalIndex], gh, mantriTotal ? formatRupiah(mantriTotal) : "", false, tc); cx += columns[totalIndex];
    drawGroupCell(ctx, cx, gy, columns[totalIndex + 1], gh, mantriDeb ? String(mantriDeb) : "", false, tc); cx += columns[totalIndex + 1];
    const amkkmVal = plan.mantri.amkkmOverride !== undefined ? plan.mantri.amkkmOverride : insurance;
    const brinsVal = plan.mantri.brinsOverride !== undefined ? plan.mantri.brinsOverride : insurance;
    drawGroupCell(ctx, cx, gy, columns[totalIndex + 2], gh, amkkmVal ? String(amkkmVal) : "", false, tc); cx += columns[totalIndex + 2];
    drawGroupCell(ctx, cx, gy, columns[totalIndex + 3], gh, brinsVal ? String(brinsVal) : "", false, tc); cx += columns[totalIndex + 3];
    (state.dhColumns || []).forEach((dhName, dhIdx) => {
      const dhRaw = Array.isArray(plan.mantri.dhValues) ? (plan.mantri.dhValues[dhIdx] || "") : "";
      const dhNum = dhRaw !== "" ? parseNumber(String(dhRaw)) : 0;
      drawGroupCell(ctx, cx, gy, columns[totalIndex + 4 + dhIdx], gh, dhNum ? formatRupiah(dhNum) : "", false, tc);
      cx += columns[totalIndex + 4 + dhIdx];
    });
  });

  // ── FOOTER ──
  // Hitung total per kolom DH
  const dhTotals = (state.dhColumns || []).map((_, dhIdx) =>
    state.mantri.reduce((sum, mantri) => {
      const raw = Array.isArray(mantri.dhValues) ? mantri.dhValues[dhIdx] : "";
      return sum + (raw !== undefined && raw !== "" ? parseNumber(String(raw)) : 0);
    }, 0)
  );

  const footerH = 88;

  // Background footer
  const footGrad = makeHeaderGradient(ctx, x, cy, tableWidth, footerH, tc.footTop, tc.footBot);
  ctx.fillStyle = footGrad;
  ctx.fillRect(x, cy, tableWidth, footerH);

  // Garis atas & bawah footer
  drawLine(ctx, x, cy, x + tableWidth, cy, tc);
  drawLine(ctx, x, cy + footerH, x + tableWidth, cy + footerH, tc);

  // Hitung posisi X tiap kolom footer
  const beforeTotalWidth = columns.slice(0, totalIndex).reduce((sum, w) => sum + w, 0);
  const totalOsX  = x + beforeTotalWidth;
  const totalDebX = totalOsX + columns[totalIndex];
  const amkkmX    = totalDebX + columns[totalIndex + 1];
  const brinsX    = amkkmX + columns[totalIndex + 2];
  let   dhStartX  = brinsX + columns[totalIndex + 3];

  // ── Sel "TOTAL REALISASI" (mencakup semua kolom kiri s/d Total OS) ──
  const realisasiW = beforeTotalWidth + columns[totalIndex];
  strokeRectOnly(ctx, x, cy, realisasiW, footerH, tc);

  // Lingkaran centang
  ctx.fillStyle = tc.headTop;
  ctx.beginPath();
  ctx.arc(x + 58, cy + footerH / 2, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u2713", x + 58, cy + footerH / 2 + 1);
  ctx.fillStyle = tc.primary;
  ctx.textAlign = "left";
  ctx.font = "900 38px Arial";
  const totalLabel = "TOTAL REALISASI";
  ctx.fillText(totalLabel, x + 92, cy + footerH / 2 + 2);
  const totalLabelWidth = ctx.measureText(totalLabel).width;
  ctx.font = "900 42px Arial";
  ctx.fillText(formatRupiah(grand), x + 92 + totalLabelWidth + 42, cy + footerH / 2 + 2);

  // ── Sel "TOTAL DEB" ──
  strokeRectOnly(ctx, totalDebX, cy, columns[totalIndex + 1], footerH, tc);
  ctx.fillStyle = tc.headTop;
  const debColWidth = columns[totalIndex + 1];
  const debText = "TOTAL DEB";
  const debValue = String(grandDeb);
  ctx.font = "900 30px Arial";
  const labelWidth = ctx.measureText(debText).width;
  ctx.font = "900 42px Arial";
  const valueWidth = ctx.measureText(debValue).width;
  const iconSize = 44;
  const gap = 14;
  const groupWidth = iconSize + gap + labelWidth + gap + valueWidth;
  const groupStart = totalDebX + Math.max(14, (debColWidth - groupWidth) / 2);
  const iconCenterX = groupStart + iconSize / 2;
  ctx.beginPath();
  ctx.arc(iconCenterX, cy + footerH / 2, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 26px Arial";
  ctx.textAlign = "center";
  ctx.fillText("D", iconCenterX, cy + footerH / 2 + 1);
  ctx.fillStyle = tc.primary;
  ctx.textAlign = "left";
  ctx.font = "900 30px Arial";
  ctx.fillText(debText, groupStart + iconSize + gap, cy + footerH / 2 + 2);
  ctx.font = "900 42px Arial";
  ctx.fillText(debValue, groupStart + iconSize + gap + labelWidth + gap, cy + footerH / 2 + 2);

  // ── Sel AMKKM (kosong di footer) ──
  strokeRectOnly(ctx, amkkmX, cy, columns[totalIndex + 2], footerH, tc);

  // ── Sel BRINS (kosong di footer) ──
  strokeRectOnly(ctx, brinsX, cy, columns[totalIndex + 3], footerH, tc);

  // ── Sel Total DH — sejajar di baris yang sama ──
  (state.dhColumns || []).forEach((dhName, dhIdx) => {
    const colW = columns[totalIndex + 4 + dhIdx];
    const cellX = dhStartX;
    strokeRectOnly(ctx, cellX, cy, colW, footerH, tc);

    const total = dhTotals[dhIdx];
    const midY = cy + footerH / 2;

    // Label kecil di atas
    ctx.fillStyle = tc.primary;
    ctx.globalAlpha = 0.55;
    ctx.font = "700 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TOTAL DH", cellX + colW / 2, midY - 18);
    ctx.globalAlpha = 1;

    // Nilai di tengah bawah
    ctx.fillStyle = tc.primary;
    ctx.font = "900 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total ? formatRupiah(total) : "\u2014", cellX + colW / 2, midY + 16);

    dhStartX += colW;
  });
}

// Hanya gambar border rect tanpa fill (untuk sel footer)
function strokeRectOnly(ctx, x, y, width, height, tc) {
  ctx.strokeStyle = tc ? tc.line : "#91a9ef";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(width), Math.round(height));
}

function drawHeadCell(ctx, x, y, width, height, lines, tc) {
  strokeRect(ctx, x, y, width, height, tc);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 28px Arial";
  drawCenteredLines(ctx, lines, x, y, width, height, 32);
}

function drawGroupCell(ctx, x, y, width, height, text, badge, tc) {
  strokeRect(ctx, x, y, width, height, tc);
  ctx.fillStyle = tc ? tc.primary : "#001976";
  ctx.font = badge ? "900 42px Arial" : "900 30px Arial";
  const lines = [String(text ?? "")];
  if (badge) {
    const badgeColor = tc ? tc.headTop : "#052699";
    ctx.fillStyle = badgeColor;
    roundRect(ctx, x + width / 2 - 26, y + height / 2 - 28, 52, 56, 7);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    drawCenteredLines(ctx, lines, x, y, width, height, 44);
    return;
  }
  // Check if this is a mantri name cell (has a PN number) — draw name + PN stacked
  const pn = getMantriPN(text);
  if (pn) {
    const midY = y + height / 2;
    ctx.fillStyle = tc ? tc.primary : "#001976";
    ctx.font = "900 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(text ?? ""), x + width / 2, midY - 18);
    ctx.globalAlpha = 0.62;
    ctx.font = "700 22px Arial";
    ctx.fillText("PN " + pn, x + width / 2, midY + 18);
    ctx.globalAlpha = 1;
    return;
  }
  drawCenteredLines(ctx, lines, x, y, width, height, 34);
}

function drawTextCell(ctx, x, y, width, height, lines, tc) {
  strokeRect(ctx, x, y, width, height, tc);
  ctx.fillStyle = tc ? tc.primary : "#001976";
  ctx.font = "900 28px Arial";
  drawCenteredLines(ctx, lines, x, y, width, height, 34);
}

function strokeRect(ctx, x, y, width, height, tc) {
  ctx.strokeStyle = tc ? tc.line : "#91a9ef";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(width), Math.round(height));
}

function drawLine(ctx, x1, y1, x2, y2, tc) {
  ctx.strokeStyle = tc ? tc.line : "#91a9ef";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
  ctx.stroke();
}

function drawCenteredLines(ctx, lines, x, y, width, height, lineHeight) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const startY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => ctx.fillText(line, x + width / 2, startY + index * lineHeight));
}

function wrapCanvasText(ctx, text, maxWidth) {
  if (text === "") return [""];
  const words = String(text || "-").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      return;
    }
    if (line) lines.push(line);
    line = word;
    while (ctx.measureText(line).width > maxWidth && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut -= 1;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : ["-"];
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}
// Boot: show unit picker on fresh load
showUnitPicker();

// ── Mobile: aktifkan pinch-zoom & pastikan tidak ada listener yang memblokirnya ──
(function enableMobilePinchZoom() {
  // Hapus listener touchmove pasif yang mungkin memblokir zoom
  document.addEventListener('touchmove', function(e) {}, { passive: true });

  // Pastikan meta viewport selalu mengizinkan zoom (untuk kasus JS mengubahnya)
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content',
      'width=1200, initial-scale=0.28, minimum-scale=0.1, maximum-scale=5.0, user-scalable=yes'
    );
  }

  // Pada table-wrap: izinkan scroll + pinch-zoom sekaligus
  document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.querySelector('.table-wrap');
    if (wrap) {
      wrap.style.touchAction = 'pan-x pan-y pinch-zoom';
    }
  });
})();

// ── Auto-scroll ke tengah laporan saat halaman dibuka (mobile) ──
// Hanya jalankan setelah unit picker tutup & tabel sudah dirender
function autoScrollToCenter() {
  function doScroll() {
    if (document.getElementById("unitPickerOverlay")) return;
    const maxX = document.body.scrollWidth - window.innerWidth;
    if (maxX > 0) {
      window.scrollTo({ left: maxX / 2, top: 0, behavior: 'instant' });
    }
  }
  setTimeout(doScroll, 300);
  setTimeout(doScroll, 700);
}

// ── Saat picker tampil (refresh/load), paksa viewport normal agar menu tengah terlihat ──
(function fixPickerViewport() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content',
      'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes'
    );
  }
  // Setelah unit dipilih & picker hilang, kembalikan viewport ke mode tabel lebar
  const observer = new MutationObserver(() => {
    if (!document.getElementById("unitPickerOverlay")) {
      viewport && viewport.setAttribute('content',
        'width=1200, initial-scale=0.28, minimum-scale=0.1, maximum-scale=5.0, user-scalable=yes'
      );
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: false });
})();
