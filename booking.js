/* ===== Glow Bliss — booking.js ===== */
const WHATSAPP_NUMBER = "31633343093";
const FORMSPREE_URL   = "https://formspree.io/f/xnjryarb"; // Active Formspree form
const PRICE_NOTE      = "Prices will be confirmed at the salon.";

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

      // Add waxing note
      if (categoryKey === "waxing_rica" || categoryKey === "waxing_brazilian") {
        const note = document.createElement("p");
        note.className = "price-note booking-note";
        note.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Final details are confirmed with you before we begin.`;
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

// ─── WhatsApp submit ──────────────────────────────────────────────────────────
document.getElementById("submitWa").addEventListener("click", () => {
  if (!validateBooking()) return;
  const name  = document.getElementById("custName").value.trim();
  const note  = document.getElementById("custNote").value.trim();

  let msg = "*New Appointment Request — Glow Bliss*\n\n";
  if (name) msg += `*Name:* ${name}\n`;
  msg += `*Date:* ${state.date}\n*Time:* ${state.time}\n\n*Services:*\n`;
  state.services.forEach(s => { msg += `• ${s.category} — ${s.name}\n`; });
  msg += `\n${PRICE_NOTE}\n`;
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
  const servicesList = state.services.map(s => `${s.category} — ${s.name}`).join("\n")
    + `\n\n${PRICE_NOTE}`;

  // Fill hidden form fields
  document.getElementById("fs_name").value     = name || "Not provided";
  document.getElementById("fs_email").value    = email || "Not provided";
  document.getElementById("fs_phone").value    = phone || "Not provided";
  document.getElementById("fs_replyto").value  = email || "";
  document.getElementById("fs_date").value     = state.date;
  document.getElementById("fs_time").value     = state.time;
  document.getElementById("fs_services").value = servicesList;
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
      showSuccess(email, phone);
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
function showSuccess(email, phone) {
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
      <div class="sd-row"><span>Prices</span><b>Confirmed at the salon</b></div>
      ${email ? `<div class="sd-row"><span>We'll reply to</span><b></b></div>` : ""}
      ${phone ? `<div class="sd-row"><span>Or call/WhatsApp</span><b></b></div>` : ""}
    </div>`;

  // Insert customer-typed values as text, not HTML
  const rows = det.querySelectorAll(".sd-row b");
  let i = 4;
  if (email) rows[i++].textContent = email;
  if (phone) rows[i++].textContent = phone;

  msg.style.display = "block";
  msg.scrollIntoView({ behavior: "smooth", block: "start" });
}
