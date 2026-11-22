/* ===== Glow Bliss — booking.js ===== */
const WHATSAPP_NUMBER = "31633343093";

// ─── App state ────────────────────────────────────────────────────────────────
// Each selected service is { name, category }. Names repeat across categories
// (e.g. "Full Face" in Threading and both Waxing types), so always match on both.
const state = { services: [], date: null, time: null };

// ─── Load services from rate_card.json and render ────────────────────────────
async function initBooking() {
  try {
    const response = await fetch('rate_card.json');
    if (!response.ok) throw new Error('Failed to load rate_card.json');
    const rateCard = await response.json();

    const container = document.getElementById("serviceContainer");
    container.innerHTML = "";

    Object.entries(rateCard).forEach(([categoryKey, categoryData]) => {
      const wrap = document.createElement("div");
      wrap.className = "svc-group";

      const h = document.createElement("h3");
      h.textContent = categoryData.name;
      wrap.appendChild(h);

      const opts = document.createElement("div");
      opts.className = "svc-options";

      Object.values(categoryData.services).forEach((serviceData) => {
        const name     = serviceData.name;
        const category = categoryData.name;

        const label = document.createElement("label");
        label.className = "svc-chip";
        label.innerHTML = `<input type="checkbox"><span></span>`;
        label.querySelector("span").textContent = name;

        const input = label.querySelector("input");
        input.value = name;
        input.addEventListener("change", () => {
          label.classList.toggle("checked", input.checked);
          if (input.checked) {
            state.services.push({ name, category });
          } else {
            state.services = state.services.filter(
              s => !(s.name === name && s.category === category)
            );
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
        note.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Not sure whether to pick Rica or Brazilian? Choose either one and mention it in your message in step 4 — we'll advise you.</span>`;
        wrap.appendChild(note);
      }

      container.appendChild(wrap);
    });

    // Render dates and times after services are loaded
    renderDates();
    generateTimeSlots(false);

  } catch (error) {
    console.error('❌ Error loading rate_card.json:', error);
    document.getElementById("serviceContainer").innerHTML =
      '<p style="color:red;padding:1rem">Error loading services. Please refresh the page.</p>';
  }
}

// Start loading
initBooking();

// ─── Render dates (next 15 days) ─────────────────────────────────────────────
const DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function renderDates() {
  const dateGrid = document.getElementById("dateGrid");
  dateGrid.innerHTML = "";
  for (let i = 1; i <= 15; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const card = document.createElement("div");
    card.className = "date-card";
    const label = i === 1 ? "Tomorrow" : DOWS[d.getDay()];
    card.innerHTML = `<div class="dow">${label}</div>
      <div class="dnum">${d.getDate()}</div>
      <div class="mon">${MONS[d.getMonth()]}</div>`;
    const human = `${DOWS[d.getDay()]} ${d.getDate()} ${MONS[d.getMonth()]} ${d.getFullYear()}`;
    card.addEventListener("click", () => {
      document.querySelectorAll(".date-card").forEach(c => c.classList.remove("checked"));
      card.classList.add("checked");
      state.date = human;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      generateTimeSlots(isWeekend);
      updateSummary();
    });
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
      card.textContent = t;
      card.addEventListener("click", () => {
        document.querySelectorAll(".time-card").forEach(c => c.classList.remove("checked"));
        card.classList.add("checked");
        state.time = t;
        updateSummary();
      });
      timeGrid.appendChild(card);
    });
  }
}

// ─── Summary bar: service count instead of a total ───────────────────────────
function updateSummary() {
  const n = state.services.length;
  document.getElementById("sumTotal").textContent =
    n === 0 ? "No services yet" : `${n} service${n > 1 ? "s" : ""} selected`;

  const parts = [];
  if (state.date) parts.push(state.date);
  if (state.time) parts.push(state.time);
  document.getElementById("sumText").textContent =
    parts.length ? parts.join(" · ") : (n === 0 ? "Pick your services above" : "Now pick a date and time");
}

// ─── Shared validation ────────────────────────────────────────────────────────
function validateBooking() {
  let ok = true;
  toggleErr("errServices", state.services.length === 0); if (!state.services.length) ok = false;
  toggleErr("errDate",     !state.date);                 if (!state.date)            ok = false;
  toggleErr("errTime",     !state.time);                 if (!state.time)            ok = false;
  if (!ok) {
    document.querySelector(".err.show")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return ok;
}
function toggleErr(id, show) {
  document.getElementById(id).classList.toggle("show", show);
}

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
  const msg = buildMessage(true);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
});

// ─── SMS submit: opens the phone's own messaging app ─────────────────────────
// iPhone/iPad expect "&body=", Android and others expect "?body=".
function isAppleMobile() {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/.test(ua) ||
         (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
}

document.getElementById("submitSms").addEventListener("click", () => {
  if (!validateBooking()) return;
  const msg = buildMessage(false);
  const sep = isAppleMobile() ? "&" : "?";
  window.location.href = `sms:+${WHATSAPP_NUMBER}${sep}body=${encodeURIComponent(msg)}`;
});
