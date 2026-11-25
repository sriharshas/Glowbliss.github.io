/* ===== Glow Bliss — booking.js =====
   Works on the Dutch (/book.html) and English (/en/book.html) booking pages.
   The message sent to the salon is always in English, with the salon's own menu names. */
const SALON_NUMBER = "31633343093";
const LANG = (document.documentElement.lang || "nl").slice(0, 2) === "en" ? "en" : "nl";

const TXT = {
  nl: {
    none: "Nog geen behandelingen", pick: "Kies hierboven je behandelingen", next: "Kies nu een datum en tijd",
    selected: n => `${n} behandeling${n > 1 ? "en" : ""} gekozen`, from: "vanaf",
    tomorrow: "Morgen", dows: ["zo", "ma", "di", "wo", "do", "vr", "za"],
    mons: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
    wax: "Twijfel je tussen Rica en Braziliaans? Kies er één en zet het in je bericht bij stap 4 – we adviseren je.",
    loadErr: "De behandelingen konden niet worden geladen. Vernieuw de pagina."
  },
  en: {
    none: "No services yet", pick: "Pick your services above", next: "Now pick a date and time",
    selected: n => `${n} service${n > 1 ? "s" : ""} selected`, from: "from",
    tomorrow: "Tomorrow", dows: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    mons: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    wax: "Not sure whether to pick Rica or Brazilian? Choose either one and mention it in your message in step 4 — we'll advise you.",
    loadErr: "Error loading services. Please refresh the page."
  }
}[LANG];

// English date names, used in the message to the salon
const DOWS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── App state ────────────────────────────────────────────────────────────────
// Each selected service is { name, category } in English (the salon's menu names).
// Names repeat across categories (e.g. "Full Face"), so always match on both.
const state = { services: [], date: null, dateLabel: null, time: null };

// ─── Load services from rate_card.json and render ────────────────────────────
async function initBooking() {
  try {
    const response = await fetch("/rate_card.json");
    if (!response.ok) throw new Error("Failed to load rate_card.json");
    const rateCard = await response.json();

    const container = document.getElementById("serviceContainer");
    container.innerHTML = "";

    Object.entries(rateCard).forEach(([categoryKey, categoryData]) => {
      const wrap = document.createElement("div");
      wrap.className = "svc-group";

      const h = document.createElement("h3");
      h.textContent = (LANG === "nl" && categoryData.name_nl) ? categoryData.name_nl : categoryData.name;
      if (categoryData.from) {
        const small = document.createElement("small");
        small.className = "svc-from";
        small.textContent = ` · ${TXT.from} €${categoryData.from}`;
        h.appendChild(small);
      }
      wrap.appendChild(h);

      const opts = document.createElement("div");
      opts.className = "svc-options";

      Object.values(categoryData.services).forEach((serviceData) => {
        const name = serviceData.name;              // English menu name (sent to the salon)
        const category = categoryData.name;         // English category (sent to the salon)
        const shown = (LANG === "nl" && serviceData.name_nl) ? serviceData.name_nl : name;

        const label = document.createElement("label");
        label.className = "svc-chip";
        label.innerHTML = `<input type="checkbox"><span></span>`;
        label.querySelector("span").textContent = shown;

        const input = label.querySelector("input");
        input.value = name;
        input.addEventListener("change", () => {
          label.classList.toggle("checked", input.checked);
          if (input.checked) {
            state.services.push({ name, category });
          } else {
            state.services = state.services.filter(s => !(s.name === name && s.category === category));
          }
          updateSummary();
        });
        opts.appendChild(label);
      });

      wrap.appendChild(opts);

      // One waxing note, shown once after the last waxing group
      if (categoryKey === "waxing_brazilian") {
        const note = document.createElement("p");
        note.className = "price-note booking-note";
        note.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span></span>`;
        note.querySelector("span").textContent = TXT.wax;
        wrap.appendChild(note);
      }

      container.appendChild(wrap);
    });

    renderDates();
    generateTimeSlots(false);
  } catch (error) {
    console.error("Error loading rate_card.json:", error);
    const p = document.createElement("p");
    p.style.cssText = "color:#d95f5f;padding:1rem";
    p.textContent = TXT.loadErr;
    document.getElementById("serviceContainer").replaceChildren(p);
  }
}

initBooking();

// ─── Render dates (next 15 days) ─────────────────────────────────────────────
function renderDates() {
  const dateGrid = document.getElementById("dateGrid");
  dateGrid.innerHTML = "";
  for (let i = 1; i <= 15; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const card = document.createElement("div");
    card.className = "date-card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    const label = i === 1 ? TXT.tomorrow : TXT.dows[d.getDay()];
    card.innerHTML = `<div class="dow">${label}</div><div class="dnum">${d.getDate()}</div><div class="mon">${TXT.mons[d.getMonth()]}</div>`;
    const english = `${DOWS_EN[d.getDay()]} ${d.getDate()} ${MONS_EN[d.getMonth()]} ${d.getFullYear()}`;
    const local = `${TXT.dows[d.getDay()]} ${d.getDate()} ${TXT.mons[d.getMonth()]} ${d.getFullYear()}`;
    const choose = () => {
      document.querySelectorAll(".date-card").forEach(c => c.classList.remove("checked"));
      card.classList.add("checked");
      state.date = english;
      state.dateLabel = local;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      generateTimeSlots(isWeekend);
      updateSummary();
    };
    card.addEventListener("click", choose);
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } });
    dateGrid.appendChild(card);
  }
}

// ─── Render time slots ────────────────────────────────────────────────────────
function generateTimeSlots(isWeekend) {
  const timeGrid = document.getElementById("timeGrid");
  timeGrid.innerHTML = "";
  state.time = null; // slots are re-rendered, so any previous pick is cleared
  const startHour = isWeekend ? 10 : 14;
  const endHour = isWeekend ? 20 : 19;
  for (let h = startHour; h <= endHour; h++) {
    [`${h}:00`, ...(h < endHour ? [`${h}:30`] : [])].forEach(t => {
      const card = document.createElement("div");
      card.className = "time-card";
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      card.textContent = t;
      const choose = () => {
        document.querySelectorAll(".time-card").forEach(c => c.classList.remove("checked"));
        card.classList.add("checked");
        state.time = t;
        updateSummary();
      };
      card.addEventListener("click", choose);
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } });
      timeGrid.appendChild(card);
    });
  }
}

// ─── Summary bar ─────────────────────────────────────────────────────────────
function updateSummary() {
  const n = state.services.length;
  document.getElementById("sumTotal").textContent = n === 0 ? TXT.none : TXT.selected(n);
  const parts = [];
  if (state.dateLabel) parts.push(state.dateLabel);
  if (state.time) parts.push(state.time);
  document.getElementById("sumText").textContent =
    parts.length ? parts.join(" · ") : (n === 0 ? TXT.pick : TXT.next);
}

// ─── Shared validation ────────────────────────────────────────────────────────
function validateBooking() {
  let ok = true;
  toggleErr("errServices", state.services.length === 0); if (!state.services.length) ok = false;
  toggleErr("errDate", !state.date); if (!state.date) ok = false;
  toggleErr("errTime", !state.time); if (!state.time) ok = false;
  if (!ok) document.querySelector(".err.show")?.scrollIntoView({ behavior: "smooth", block: "center" });
  return ok;
}
function toggleErr(id, show) { document.getElementById(id).classList.toggle("show", show); }

// ─── Build the booking message (shared by WhatsApp and SMS) ───────────────────
// bold = true adds WhatsApp *bold* formatting; SMS gets plain text.
function buildMessage(bold) {
  const b = t => bold ? `*${t}*` : t;
  const name = document.getElementById("custName").value.trim();
  const note = document.getElementById("custNote").value.trim();

  let msg = `${b("New Appointment Request — Glow Bliss")}\n\n`;
  if (name) msg += `${b("Name:")} ${name}\n`;
  msg += `${b("Date:")} ${state.date}\n${b("Time:")} ${state.time}\n\n${b("Services:")}\n`;
  state.services.forEach(s => { msg += `• ${s.category} — ${s.name}\n`; });
  if (note) msg += `\n${b("Note:")} ${note}\n`;
  msg += `\nPlease confirm my appointment. Thank you!`;
  return msg;
}

// ─── WhatsApp submit ──────────────────────────────────────────────────────────
document.getElementById("submitWa").addEventListener("click", () => {
  if (!validateBooking()) return;
  window.open(`https://wa.me/${SALON_NUMBER}?text=${encodeURIComponent(buildMessage(true))}`, "_blank");
});

// ─── SMS submit: opens the phone's own messaging app ─────────────────────────
// iPhone/iPad expect "&body=", Android and others expect "?body=".
function isAppleMobile() {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
document.getElementById("submitSms").addEventListener("click", () => {
  if (!validateBooking()) return;
  const sep = isAppleMobile() ? "&" : "?";
  window.location.href = `sms:+${SALON_NUMBER}${sep}body=${encodeURIComponent(buildMessage(false))}`;
});
