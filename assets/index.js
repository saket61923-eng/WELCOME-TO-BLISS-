const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
$$("img[data-logo]").forEach((i) => (i.src = "assets/bliss-pulse-logo.webp"));
const esc = (s) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const ORDER = ["gate", "sheet", "result"];
let who = { n: "", a: "", p: "", c: "" },
  picked = new Set(),
  st = 0,
  score = 50,
  tms = [],
  FLAT = [];
const T = (f, ms) => tms.push(setTimeout(f, ms)),
  clr = () => {
    tms.forEach(clearTimeout);
    tms = [];
  };
function show(id) {
  const k = ORDER.indexOf(id);
  $$("#app>section").forEach((s) => {
    const j = ORDER.indexOf(s.id);
    s.classList.toggle("on", j === k);
    s.classList.toggle("past", j < k);
  });
  $("#" + id).scrollTop = 0;
  $$("#" + id + " .gw,#" + id + " .rw").forEach((x) => (x.scrollTop = 0));
}
/* ---- mood meter (BLISS letters + eyes, size changes with ticks) ---- */
const mf = $("#mface");
[..."BLISS"].forEach((ch, i) => {
  const e = document.createElement("div");
  e.className = "ml" + (i % 2 ? "" : " w");
  e.textContent = ch;
  mf.appendChild(e);
});
function setMeter() {
  const c = Math.min(1, score / 50);
  mf.querySelectorAll(".ml").forEach((e, i) => {
    const k = i - 2;
    e.style.left = 48 + k * 17 + "px";
    e.style.top = 35 - 4.2 * c * k * k + "px";
    e.style.transform = `translateX(-50%) rotate(${k * 11 * c}deg)`;
  });
  mf.querySelectorAll(".me").forEach(
    (e) => (e.style.transform = `scaleY(${0.15 + 0.85 * c})`),
  );
  $("#mk").style.left = score + "%";
  $("#meter").style.transform = `scale(${0.75 + score * 0.005})`;
}
/* ---- checklist ---- */
const calc = () => Math.max(0, 50 - 5 * picked.size);
function mascot() {
  return `<svg viewBox="0 0 160 210"><path d="M68 136L62 184M92 136L98 184M52 84L26 114" stroke="#1c2f8a" stroke-width="9" stroke-linecap="round" fill="none"/><ellipse cx="58" cy="191" rx="13" ry="6" fill="#e8575a"/><ellipse cx="102" cy="191" rx="13" ry="6" fill="#e8575a"/><rect x="48" y="72" width="64" height="68" rx="18" fill="#5f9ea0"/><text x="80" y="111" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="900" font-size="14" fill="#fff" stroke="#1c2f8a" stroke-width=".5">BLISS</text><circle cx="26" cy="114" r="7" fill="#e8efe6"/><g class="wv"><path d="M108 84L136 54" stroke="#1c2f8a" stroke-width="9" stroke-linecap="round"/><circle cx="137" cy="52" r="7" fill="#e8efe6"/></g><circle cx="80" cy="40" r="31" fill="#e8efe6" stroke="#1c2f8a" stroke-width="3"/><ellipse cx="69" cy="34" rx="4" ry="4" fill="#1c2f8a"/><ellipse cx="91" cy="34" rx="4" ry="4" fill="#1c2f8a"/><path d="M63 50Q80 67 97 50" fill="none" stroke="#e8575a" stroke-width="3.5" stroke-linecap="round"/></svg>`;
}
const ICONS = [
  "🦴",
  "🧠",
  "🍽️",
  "❤️",
  "🌬️",
  "👂",
  "💧",
  "🩺",
  "⚖️",
  "🧘",
  "🧴",
  "🦠",
];
function build() {
  let h = "";
  FLAT = [];
  SHEET.forEach((s, si) => {
    h += `<div class="sec"><div class="sh"><span class="ic">${ICONS[si] || "✚"}</span><h3>${esc(s.h)}</h3><span class="cc"></span></div><div class="items">`;
    for (const t of s.i) {
      h += `<label class="it"><input type="checkbox" value="${FLAT.length}"><i class="box"></i><span class="tx">${esc(t)}</span></label>`;
      FLAT.push(t);
    }
    h += "</div></div>";
  });
  h += `<div class="sec"><div class="sh"><span class="ic">✍️</span><h3>Other issues</h3></div><div class="oth"><textarea id="oth" rows="3" maxlength="400" placeholder="Anything else? Describe any other issue you face…"></textarea></div></div>`;
  $("#grid").innerHTML = h;
}
function upd() {
  const n = picked.size;
  $("#cnt").innerHTML =
    `<b>${n}</b> selected<small>Tap the tick when done →</small>`;
  $("#tk").classList.toggle("pulse", n > 0);
}
function startApp() {
  who = { n: "", a: "", p: "", c: "" };
  $("#gp").value = "";
  $("#mycode").hidden = true;
  picked = new Set();
  st = 0;
  $("#gn").value = $("#ga").value = "";
  $("#ger").textContent = "";
  $("#cm").value = "";
  $$("#stars button").forEach((b) => b.classList.remove("on"));
  $("#mas").innerHTML = mascot();
  build();
  upd();
  score = 50;
  setMeter();
  $("#meter").classList.add("on");
  show("gate");
}
$("#gf").addEventListener("submit", (e) => {
  e.preventDefault();
  const n = $("#gn").value.trim().replace(/\s+/g, " "),
    a = parseInt($("#ga").value, 10);
  if (n.length < 2) {
    $("#ger").textContent = "Please enter your name.";
    $("#gn").focus();
    return;
  }
  if (!(a >= 1 && a <= 120)) {
    $("#ger").textContent = "Please enter your age (1 to 120).";
    $("#ga").focus();
    return;
  }
  const p = ph10($("#gp").value);
  if (!p) {
    $("#ger").textContent = "Please enter your 10-digit mobile number.";
    $("#gp").focus();
    return;
  }
  who = { n, a, p, c: "" };
  register();
  $("#hn").textContent = n;
  $("#ha").textContent = a + " yrs";
  if (document.activeElement) document.activeElement.blur();
  show("sheet");
});
$("#grid").addEventListener("change", (e) => {
  const i = e.target;
  if (i.type !== "checkbox") return;
  i.closest(".it").classList.toggle("on", i.checked);
  const sec = i.closest(".sec"),
    n = sec.querySelectorAll("input:checked").length,
    cc = sec.querySelector(".cc");
  cc.textContent = n + " ticked";
  cc.classList.toggle("on", n > 0);
  i.checked ? picked.add(+i.value) : picked.delete(+i.value);
  score = calc();
  setMeter();
  upd();
});
/* ---- review (WhatsApp) ---- */
const API =
  ""; /* paste the Web app URL here after setting up the clinic system; leave empty to run without codes */
const ph10 = (v) => {
  let d = String(v || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d[0] === "0") d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
};
function api(o) {
  if (!API) return Promise.resolve({ ok: false });
  return fetch(API, { method: "POST", body: JSON.stringify(o) })
    .then((r) => r.json())
    .catch(() => ({ ok: false }));
}
function register() {
  api({ action: "register", name: who.n, age: who.a, phone: who.p }).then(
    (r) => {
      if (r && r.ok && r.code) {
        who.c = r.code;
        showCode();
        rl();
      } else if (r && r.existing) {
        who.c = "";
        who.back = true;
      }
    },
  );
}
function showCode() {
  if (who.c) {
    $("#mcv").textContent = who.c;
    $("#mycode").hidden = false;
  }
}
const WA = "919307322041",
  cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
function msg(short) {
  let iss = [...picked].sort((a, b) => a - b).map((i) => FLAT[i]);
  let list = iss.join(", ");
  if (short && list.length > 300) {
    let k = iss.length;
    while (k > 1 && iss.slice(0, k).join(", ").length > 260) k--;
    list = iss.slice(0, k).join(", ") + " …+" + (iss.length - k) + " more";
  }
  const oth = ($("#oth") && $("#oth").value.trim()) || "",
    cm = $("#cm").value.trim();
  return (
    "Hi Bliss Pulse!\nName: " +
    who.n +
    "\nAge: " +
    who.a +
    "\nMobile: " +
    who.p +
    (who.c ? "\nMy code: " + who.c : "") +
    "\nIssues ticked (" +
    picked.size +
    "): " +
    (list || "none") +
    (oth ? "\nOther: " + (short ? cut(oth, 100) : oth) : "") +
    "\nReview: " +
    ("★".repeat(st) || "(no rating)") +
    "\nComments: " +
    (cm ? (short ? cut(cm, 200) : cm) : "-")
  );
}
const waUrl = () =>
  "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg(true));
function rl() {
  $("#snd").href = waUrl();
}
function copyMsg() {
  const t = msg(false);
  const done = () => {
    $("#pn").textContent =
      "Copied! Now open WhatsApp and paste it to 93073 22041.";
  };
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(t).then(done, () => fb(t, done));
  else fb(t, done);
}
function fb(t, done) {
  const x = document.createElement("textarea");
  x.value = t;
  x.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(x);
  x.select();
  try {
    document.execCommand("copy");
  } catch (e) {}
  x.remove();
  done();
}
$("#snd").addEventListener("click", (e) => {
  e.preventDefault();
  const u = waUrl();
  $("#snd").href = u;
  location.href = u;
  setTimeout(() => {
    if (!document.hidden) {
      showFb();
    }
  }, 2600);
});
function showFb() {
  $("#pn").innerHTML =
    'Not opening? <button type="button" class="lk2" id="cp">Copy my review</button>, <a class="lk2" id="bz" href="https://wa.me/message/ZAPXWWICU2LIC1">open our WhatsApp chat</a> or <a class="lk2" id="sm" href="sms:+' +
    WA +
    "?body=" +
    encodeURIComponent(msg(true)) +
    '">Send by SMS</a> to 93073 22041.';
  $("#cp").onclick = copyMsg;
}
$$("#stars button").forEach(
  (b) =>
    (b.onclick = () => {
      st = +b.dataset.n;
      $$("#stars button").forEach((x) =>
        x.classList.toggle("on", +x.dataset.n <= st),
      );
      rl();
    }),
);
$("#cm").oninput = rl;
$("#tk").onclick = () => {
  score = picked.size ? calc() : 100;
  setMeter();
  rl();
  showCode();
  if (who.c)
    api({
      action: "issues",
      code: who.c,
      phone: who.p,
      issues: [...picked]
        .sort((a, b) => a - b)
        .map((i) => FLAT[i])
        .join(", "),
      other: ($("#oth") && $("#oth").value) || "",
    });
  show("result");
};
$("#back").onclick = () => {
  score = calc();
  setMeter();
  show("sheet");
};
function buildQR(el, u) {
  const q = qrcode(0, "M");
  q.addData(u);
  q.make();
  const n = q.getModuleCount();
  let s = "";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (q.isDark(r, c))
        s += `<rect x="${c}" y="${r}" width="1.02" height="1.02"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" fill="#1c2f8a">${s}</svg>`;
}
const QS = {
  u: "https://saket61923-eng.github.io/WELCOME-TO-BLISS-/",
  m: [
    "11111110011110100111101111111",
    "10000010100111011010101000001",
    "10111010100100100111101011101",
    "10111010010001100011001011101",
    "10111010110110101010001011101",
    "10000010101010011111101000001",
    "11111110101010101010101111111",
    "00000000101000110111100000000",
    "11010011000100101001001110110",
    "00011101110110011000101001001",
    "10111011000001001011010111110",
    "00111000011101001011010100110",
    "10100011001000000100101001011",
    "11100001110110010111100000000",
    "00101011101100100100111001111",
    "10110001010101101101111111010",
    "00010111110110110100100000010",
    "01111101011010100100101101001",
    "10000010000010000010001110011",
    "00101000110110100101001100011",
    "11110111011010111000111110100",
    "00000000111111101110100010111",
    "11111110101011001000101010010",
    "10000010010101110011100011101",
    "10111010011010011100111110001",
    "10111010110111000100111111100",
    "10111010011101101010010011101",
    "10000010110111101100111010010",
    "11111110100110110111110010010",
  ],
};
function qrSvg(rows) {
  const n = rows.length;
  let s = "";
  rows.forEach((r, y) =>
    [...r].forEach((c, x) => {
      if (c === "1")
        s += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
    }),
  );
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" fill="#1c2f8a">${s}</svg>`;
}
function mkQR() {
  const u = $("#lnk").value.trim();
  if (u === QS.u) {
    $("#qr").innerHTML = qrSvg(QS.m);
    return;
  }
  try {
    buildQR($("#qr"), u);
  } catch (e) {
    $("#qr").textContent = "QR library did not load";
  }
}
function isPhoneLike() {
  return (
    /Android|iPhone|iPad|iPod|Mobi|Tablet|Silk/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 0 ||
    matchMedia("(pointer:coarse)").matches ||
    matchMedia("(hover:none)").matches ||
    innerWidth < 700
  );
}
function route() {
  const h = location.hash,
    play = h === "#play" || (h !== "#standee" && isPhoneLike());
  $("#standee").hidden = play;
  $("#app").hidden = $("#meter").hidden = !play;
  if (play) startApp();
  else mkQR();
}
addEventListener("hashchange", route);
route();
