/* ===== Glow Bliss — booking.js ===== */
const WHATSAPP_NUMBER = "31633343093";
const FORMSPREE_URL   = "https://formspree.io/f/xnjryarb"; // replace token after signup

// ─── Service catalogue ───────────────────────────────────────────────────────
const SERVICES = [
  { group: "Threading", items: [
    ["Eyebrows", 5], ["Upper lip + chin", 5], ["Forehead", 3],
    ["Neck", 5], ["Side locks", 5], ["Full face", 12],
  ]},
  { group: "Pedicure (incl. polish)", items: [
    ["Pedicure — Legs", 25], ["Pedicure — French", 32], ["Pedicure — Ozone", 38],
  ]},
  { group: "Manicure (incl. polish)", items: [
    ["Manicure — Hands", 20], ["Manicure — French", 25], ["Manicure — Ozone", 28],
  ]},
  { group: "Waxing — Rica",
    note: "Prices are starting rates. Final cost is based on area size and time required — always confirmed with you before we begin.",
    items: [
      ["Full face (Rica)", 12], ["Full hands (Rica)", 15], ["Half hands (Rica)", 10],
      ["Full legs (Rica)", 25], ["Half legs (Rica)", 20], ["Under arms (Rica)", 10],
  ]},
  { group: "Waxing — Brazilian", items: [
    ["Full face (Brazilian)", 15], ["Full hands (Brazilian)", 20], ["Half hands (Brazilian)", 15],
    ["Full legs (Brazilian)", 30], ["Half legs (Brazilian)", 25], ["Under arms (Brazilian)", 15],
  ]},
  { group: "Regular Facials", items: [
    ["Basic cleanup", 12], ["Fruit facial", 15], ["Silver facial", 12],
    ["Gold facial", 15], ["Diamond facial", 18], ["Pearl facial", 22],
    ["Red Wine facial", 25], ["O3+ Facial", 30], ["Herbal Tree", 25],
    ["Herbal Tree (Papaya)", 28], ["Gold cream bleach", 15], ["Party Glow", 20],
  ]},
  { group: "De-Tan Pack", items: [
    ["De-Tan — Twacha", 11], ["De-Tan — Natures", 15], ["De-Tan — Raga", 12], ["De-Tan — O3+", 20],
  ]},
  { group: "Signature Hydra Facial", items: [
    ["Hydra 40 mins", 55], ["Hydra 60 mins", 76], ["Hydra 90 mins", 100], ["LED light add-on", 10],
  ]},
  { group: "Hair", items: [
    ["Straight cut", 7], ["Trimming", 10], ["V shape", 12], ["U shape", 12],
    ["Layered cut", 22], ["Feather cut", 22], ["Normal hair wash", 15], ["Hair spa", 25],
  ]},
  { group: "Massages", items: [
    ["Head (30 mins)", 30], ["Neck & hands (30 mins)", 28], ["Back (40 mins)", 40],
    ["Leg (30 mins)", 35], ["Full body (60 mins)", 65],
  ]},
  { group: "Makeup", items: [
    ["Basic look", 30], ["HD look", 40],
  ]},
];

// ─── App state ────────────────────────────────────────────────────────────────
const state = { services: [], date: null, time: null };

// ─── Render services ─────────────────────────────────────────────────────────
const container = document.getElementById("serviceContainer");
SERVICES.forEach((g, gi) => {
  const wrap = document.createElement("div");
  wrap.className = "svc-group";
  const h = document.createElement("h3");
  h.textContent = g.group;
  wrap.appendChild(h);
  const opts = document.createElement("div");
  opts.className = "svc-options";
  g.items.forEach(([name, price], ii) => {
    const label = document.createElement("label");
    label.className = "svc-chip";
    label.innerHTML = `<input type="checkbox" value="${name}" data-price="${price}">
      <span>${name}</span><span class="price">€${price}</span>`;
    const input = label.querySelector("input");
    input.addEventListener("change", () => {
      label.classList.toggle("checked", input.checked);
      if (input.checked) state.services.push({ name, price });
      else state.services = state.services.filter(s => s.name !== name);
      updateSummary();
    });
    opts.appendChild(label);
  });
  wrap.appendChild(opts);
  if (g.note) {
    const note = document.createElement("p");
    note.className = "price-note booking-note";
    note.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${g.note}`;
    wrap.appendChild(note);
  }
  container.appendChild(wrap);
});

// ─── Render dates (next 7 days) ───────────────────────────────────────────────
const DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dateGrid = document.getElementById("dateGrid");
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
    updateSummary();
  });
  dateGrid.appendChild(card);
}

// ─── Render time slots (weekday 14:00–19:00, weekend 10:00–20:00, every 30 min) ───
const timeGrid = document.getElementById("timeGrid");
const dateCards = document.querySelectorAll(".date-card");

function generateTimeSlots(isWeekend) {
  timeGrid.innerHTML = "";
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

// Initial render (assume weekday)
generateTimeSlots(false);

// Update time slots when date changes
dateCards.forEach((card, idx) => {
  card.addEventListener("click", () => {
    const d = new Date();
    d.setDate(d.getDate() + (idx + 1)); // idx+1 because we start from day 1, not day 0
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    generateTimeSlots(isWeekend);
  });
});

// ─── Summary bar ─────────────────────────────────────────────────────────────
function updateSummary() {
  const total = state.services.reduce((s, x) => s + x.price, 0);
  document.getElementById("sumTotal").textContent = "€" + total;
  const n = state.services.length;
  let txt = n === 0 ? "No services selected yet" : `${n} service${n > 1 ? "s" : ""}`;
  if (state.date) txt += ` · ${state.date}`;
  if (state.time) txt += ` · ${state.time}`;
  document.getElementById("sumText").textContent = txt;
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

// ─── WhatsApp submit ──────────────────────────────────────────────────────────
document.getElementById("submitWa").addEventListener("click", () => {
  if (!validateBooking()) return;
  const name  = document.getElementById("custName").value.trim();
  const note  = document.getElementById("custNote").value.trim();
  const total = state.services.reduce((s, x) => s + x.price, 0);

  let msg = "*New Appointment Request — Glow Bliss*\n\n";
  if (name) msg += `*Name:* ${name}\n`;
  msg += `*Date:* ${state.date}\n*Time:* ${state.time}\n\n*Services:*\n`;
  state.services.forEach(s => { msg += `• ${s.name} — €${s.price}\n`; });
  msg += `\n*Estimated total: €${total}*\n`;
  if (note) msg += `\n*Note:* ${note}\n`;
  msg += `\nPlease confirm my appointment. Thank you!`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
});

// ─── Email button — show contact panel ───────────────────────────────────────
const emailPanel  = document.getElementById("emailPanel");
const submitEmail = document.getElementById("submitEmail");
let emailPanelOpen = false;

submitEmail.addEventListener("click", () => {
  if (!validateBooking()) return;

  if (!emailPanelOpen) {
    // First click: reveal contact panel and ask for details
    emailPanel.style.display = "block";
    emailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    submitEmail.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg> Confirm &amp; Send Email`;
    emailPanelOpen = true;
    return;
  }

  // Second click: validate contact fields and submit
  const email = document.getElementById("custEmail").value.trim();
  const phone = document.getElementById("custPhone").value.trim();

  if (!email && !phone) {
    toggleErr("errContact", true);
    document.getElementById("errContact").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  toggleErr("errContact", false);

  submitToFormspree(email, phone);
});

// ─── Formspree submission ─────────────────────────────────────────────────────
async function submitToFormspree(email, phone) {
  const name  = document.getElementById("custName").value.trim();
  const note  = document.getElementById("custNote").value.trim();
  const total = state.services.reduce((s, x) => s + x.price, 0);
  const servicesList = state.services.map(s => `${s.name} — €${s.price}`).join("\n");

  // Fill hidden form fields
  document.getElementById("fs_name").value     = name || "Not provided";
  document.getElementById("fs_email").value    = email || "Not provided";
  document.getElementById("fs_phone").value    = phone || "Not provided";
  document.getElementById("fs_replyto").value  = email || "";
  document.getElementById("fs_date").value     = state.date;
  document.getElementById("fs_time").value     = state.time;
  document.getElementById("fs_services").value = servicesList;
  document.getElementById("fs_total").value    = `€${total} (estimated)`;
  document.getElementById("fs_note").value     = note || "None";

  // Disable button while submitting
  submitEmail.disabled = true;
  submitEmail.textContent = "Sending…";

  try {
    const formData = new FormData(document.getElementById("formspreeForm"));
    const resp = await fetch(FORMSPREE_URL, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (resp.ok) {
      showSuccess(name, email, phone, total);
    } else {
      const data = await resp.json().catch(() => ({}));
      const msg = data?.errors?.map(e => e.message).join(", ") || "Unknown error";
      throw new Error(msg);
    }
  } catch (err) {
    submitEmail.disabled = false;
    submitEmail.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg> Retry — Send Email`;
    // Show inline error
    const existing = document.getElementById("sendError");
    if (existing) existing.remove();
    const errEl = document.createElement("p");
    errEl.id = "sendError";
    errEl.className = "err show";
    errEl.style.marginTop = "1rem";
    errEl.textContent = `Could not send: ${err.message}. Please try WhatsApp instead.`;
    document.getElementById("summaryBar").after(errEl);
  }
}

// ─── Success state ────────────────────────────────────────────────────────────
function showSuccess(name, email, phone, total) {
  // Hide everything except success message
  document.getElementById("summaryBar").style.display = "none";
  emailPanel.style.display = "none";

  const msg = document.getElementById("successMsg");
  const det = document.getElementById("successDetails");

  det.innerHTML = `
    <div class="success-details">
      <div class="sd-row"><span>Date</span><b>${state.date}</b></div>
      <div class="sd-row"><span>Time</span><b>${state.time}</b></div>
      <div class="sd-row"><span>Services</span><b>${state.services.length} selected</b></div>
      <div class="sd-row"><span>Estimated total</span><b>€${total}</b></div>
      ${email ? `<div class="sd-row"><span>We'll reply to</span><b>${email}</b></div>` : ""}
      ${phone ? `<div class="sd-row"><span>Or call/WhatsApp</span><b>${phone}</b></div>` : ""}
    </div>`;

  msg.style.display = "block";
  msg.scrollIntoView({ behavior: "smooth", block: "start" });
}
