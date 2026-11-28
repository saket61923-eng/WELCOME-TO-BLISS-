/**
 * Bliss Pulse Neurotherapy Clinic: private backend (Google Apps Script)
 * Runs inside the clinic Google account. Data lives in that account's Google Sheet.
 * Public pages can only: register, update their own issues (needs code + phone), and
 * ask "when is my next appointment" (needs code). Everything else needs the owner PIN.
 */
const CFG = {
  TZ: 'Asia/Kolkata',
  DAYS: [1, 2, 3, 4, 5, 6],      // Mon..Sat  (0 = Sunday)
  OPEN: 15 * 60,                 // 3:00 pm, in minutes after midnight
  CLOSE: 19 * 60,                // 7:00 pm
  DURATION: 30,                  // minutes per session (change here)
  BUFFER: 60,                    // free minutes kept between two sessions
  STEP: 15,                      // slot grid in minutes
  CLINIC: 'Bliss Pulse Neurotherapy Clinic',
  MAX_FAILS: 5,                  // wrong PINs before a 15 minute lock
};
/* Settings saved from the desk (Settings tab) override the defaults above. */
function loadCfg() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('CFG');
    if (!raw) return;
    const c = JSON.parse(raw);
    ['OPEN', 'CLOSE', 'DURATION', 'BUFFER'].forEach(k => { if (typeof c[k] === 'number') CFG[k] = c[k]; });
    if (Array.isArray(c.DAYS)) CFG.DAYS = c.DAYS;
  } catch (e) {}
}
function cfgOut() { return { open: CFG.OPEN, close: CFG.CLOSE, duration: CFG.DURATION, buffer: CFG.BUFFER, days: CFG.DAYS }; }
function getConfig() { return { ok: true, cfg: cfgOut() }; }
function setConfig(q) {
  const open = Math.round(+q.open), close = Math.round(+q.close), dur = Math.round(+q.duration), buf = Math.round(+q.buffer);
  const days = (Array.isArray(q.days) ? q.days : []).map(Number).filter(d => d >= 0 && d <= 6);
  if (!(open >= 0 && close <= 24 * 60 && close - open >= 15) || !(dur >= 10 && dur <= 240) || !(buf >= 0 && buf <= 240) || !days.length)
    return { ok: false, error: 'Please check the hours, session length, gap and days.' };
  PropertiesService.getScriptProperties().setProperty('CFG', JSON.stringify({ OPEN: open, CLOSE: close, DURATION: dur, BUFFER: buf, DAYS: days }));
  loadCfg();
  return { ok: true, cfg: cfgOut() };
}

const SHEETS = {
  Clients: ['Code', 'Name', 'Age', 'Phone', 'Registered', 'Issues', 'Other', 'Gender', 'GroupId', 'BookingPhone'],
  Visits: ['Code', 'Date', 'Treatment', 'Changes', 'Notes'],
  Appts: ['ApptId', 'Code', 'Start', 'End', 'Status', 'EventId', 'Note'],
};
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/* ---------- entry points ---------- */
function doGet() { return out({ ok: true, service: 'bliss' }); }

function doPost(e) {
  let r;
  try {
    const q = JSON.parse(e.postData.contents);
    r = route(q);
  } catch (err) {
    r = { ok: false, error: 'Something went wrong. Please try again.' };
  }
  return out(r);
}
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

const PUBLIC = { register: register, registerGroup: registerGroup, issues: issues, status: status };
const OWNER = { lookup: lookup, search: search, addVisit: addVisit, checkSlot: checkSlot,
  schedule: schedule, cancel: cancel, due: due, agenda: agenda, newClient: newClient, getConfig: getConfig, setConfig: setConfig };

function route(q) {
  loadCfg();
  if (PUBLIC[q.action]) return withLock(() => PUBLIC[q.action](q));
  if (OWNER[q.action]) {
    const bad = checkPin(q.pin);
    if (bad) return bad;
    return withLock(() => OWNER[q.action](q));
  }
  return { ok: false, error: 'Unknown request.' };
}
function withLock(fn) {
  const l = LockService.getScriptLock();
  l.waitLock(20000);
  try { return fn(); } finally { l.releaseLock(); }
}

/* ---------- PIN (set it in Project Settings > Script properties > PIN) ---------- */
function checkPin(pin) {
  const cache = CacheService.getScriptCache();
  const fails = +(cache.get('fails') || 0);
  if (fails >= CFG.MAX_FAILS) return { ok: false, locked: true, error: 'Too many wrong PINs. Try again in 15 minutes.' };
  const real = PropertiesService.getScriptProperties().getProperty('PIN');
  if (!real) return { ok: false, error: 'PIN not set yet. See the setup guide.' };
  if (String(pin || '') !== String(real)) {
    cache.put('fails', String(fails + 1), 900);
    return { ok: false, badPin: true, error: 'Wrong PIN.' };
  }
  cache.remove('fails');
  return null;
}

/* ---------- sheet helpers ---------- */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(n => {
    let sh = ss.getSheetByName(n);
    if (!sh) { sh = ss.insertSheet(n); sh.getRange('A:Z').setNumberFormat('@'); sh.appendRow(SHEETS[n]); sh.setFrozenRows(1); } // plain text, so Sheets never turns dates into real dates
    else if (n === 'Clients') {
      const headers = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
      SHEETS.Clients.forEach(k => {
        if (headers.indexOf(k) < 0) {
          sh.getRange(1, sh.getLastColumn() + 1).setValue(k);
          headers.push(k);
        }
      });
    }
  });
  const d = ss.getSheetByName('Sheet1');
  if (d && ss.getSheets().length > 1) ss.deleteSheet(d);
}
function sh(n) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n); }
function rows(n) {
  const v = sh(n).getDataRange().getValues();
  const h = v[0];
  return v.slice(1).map((r, i) => {
    const o = { _row: i + 2 };
    h.forEach((k, j) => {
      let v = r[j] === undefined ? '' : r[j];
      if (Object.prototype.toString.call(v) === '[object Date]') v = Utilities.formatDate(v, CFG.TZ, 'yyyy-MM-dd HH:mm');
      o[k] = v;
    });
    return o;
  });
}
function add(n, o) { sh(n).appendRow(SHEETS[n].map(k => (o[k] === undefined ? '' : o[k]))); }
function setCell(n, row, key, val) { sh(n).getRange(row, SHEETS[n].indexOf(key) + 1).setValue(val); }

/* ---------- small utilities ---------- */
function nowStr() { return Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd HH:mm'); }
function clean(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n); }
function phone10(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
  if (d.length === 11 && d[0] === '0') d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : '';
}
function newCode(existing) {
  for (let t = 0; t < 50; t++) {
    let c = 'BP-';
    for (let i = 0; i < 5; i++) c += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    if (!existing[c]) return c;
  }
  throw new Error('code');
}
function normCode(c) { return String(c || '').toUpperCase().replace(/\s/g, '').replace(/^BP(?!-)/, 'BP-'); }
// 'yyyy-MM-dd HH:mm' (clinic time) <-> minutes since epoch
function toMin(s) { return Math.round(Date.parse(String(s).replace(' ', 'T') + ':00+05:30') / 60000); }
function fromMin(m) {
  const d = new Date((m + 330) * 60000); // shift to IST, then read as UTC
  const p = n => (n < 10 ? '0' : '') + n;
  return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes());
}
function dayOf(s) { return String(s).slice(0, 10); }
function weekday(dateStr) { return new Date(dateStr + 'T12:00:00+05:30').getUTCDay(); }
function hm(s) { return +String(s).slice(11, 13) * 60 + +String(s).slice(14, 16); }

/* ---------- PUBLIC actions ---------- */
function validGender(value) {
  const gender = clean(value, 20);
  return gender === 'Female' || gender === 'Male' ? gender : '';
}
function register(q) {
  const name = clean(q.name, 60), age = Math.round(+q.age), ph = phone10(q.phone), gender = validGender(q.gender);
  if (name.length < 2 || !(age >= 1 && age <= 120) || !ph || !gender) return { ok: false, error: 'Please check name, age, gender and mobile number.' };
  const cl = rows('Clients');
  const hit = cl.filter(c => String(c.Phone) === ph)[0];
  if (hit) return { ok: true, existing: true }; // never reveal an existing code on the open web
  const map = {}; cl.forEach(c => { map[c.Code] = 1; });
  const code = newCode(map);
  add('Clients', { Code: code, Name: name, Age: age, Phone: ph, Registered: nowStr(), Gender: gender });
  return { ok: true, code: code };
}
function registerGroup(q) {
  const contactPhone = phone10(q.contactPhone);
  const attendees = Array.isArray(q.attendees) ? q.attendees : [];
  if (!contactPhone || !attendees.length || attendees.length > 10)
    return { ok: false, error: 'Please check the group details.' };
  const normalized = [];
  for (const attendee of attendees) {
    const name = clean(attendee && attendee.name, 60);
    const age = Math.round(+(attendee && attendee.age));
    const gender = validGender(attendee && attendee.gender);
    const phone = phone10(attendee && (attendee.phone || q.contactPhone));
    const issues = attendee && attendee.issues;
    if (name.length < 2 || !(age >= 1 && age <= 120) || !gender || !phone ||
        !(Array.isArray(issues) ? issues.length > 0 : typeof issues === 'string' && clean(issues, 4000).length > 0))
      return { ok: false, error: 'Please complete every attendee’s name, age, gender, mobile number and issues.' };
    normalized.push({ name: name, age: age, gender: gender, phone: phone,
      issues: Array.isArray(issues) ? clean(issues.join(', '), 4000) : clean(issues, 4000) });
  }
  const cl = rows('Clients');
  const codes = {}; cl.forEach(c => { codes[c.Code] = 1; });
  const groupId = Utilities.getUuid();
  const created = [];
  normalized.forEach(a => {
    const hit = cl.filter(c => clean(c.Name, 60).toLowerCase() === a.name.toLowerCase() &&
      +c.Age === a.age && c.Gender === a.gender && phone10(c.BookingPhone) === contactPhone)[0];
    if (hit) return;
    const code = newCode(codes); codes[code] = 1;
    add('Clients', { Code: code, Name: a.name, Age: a.age, Phone: a.phone, Registered: nowStr(),
      Issues: a.issues, Gender: a.gender, GroupId: groupId, BookingPhone: contactPhone });
    cl.push({ Code: code, Name: a.name, Age: a.age, Gender: a.gender, BookingPhone: contactPhone, GroupId: groupId });
    created.push(code);
  });
  return { ok: true, created: created };
}
function issues(q) {
  const code = normCode(q.code), ph = phone10(q.phone);
  const c = rows('Clients').filter(r => r.Code === code && String(r.Phone) === ph)[0];
  if (!c) return { ok: false, error: 'Not found.' };
  setCell('Clients', c._row, 'Issues', clean(q.issues, 4000));
  setCell('Clients', c._row, 'Other', clean(q.other, 500));
  return { ok: true };
}
function status(q) {
  const code = normCode(q.code);
  const c = rows('Clients').filter(r => r.Code === code)[0];
  if (!c) return { ok: false, error: 'Code not found. Please check it and try again.' };
  const now = toMin(nowStr());
  const next = rows('Appts').filter(a => a.Code === code && a.Status === 'booked' && toMin(a.End) > now)
    .sort((a, b) => toMin(a.Start) - toMin(b.Start))[0];
  return { ok: true, name: String(c.Name).split(' ')[0], next: next ? { start: next.Start, end: next.End } : null, clinic: CFG.CLINIC };
}

/* ---------- OWNER actions ---------- */
function present(c) { return { code: c.Code, name: c.Name, age: c.Age, phone: String(c.Phone), registered: c.Registered, issues: c.Issues, other: c.Other }; }
function lookup(q) {
  const code = normCode(q.code);
  const clients = rows('Clients');
  const c = clients.filter(r => r.Code === code)[0];
  if (!c) return { ok: false, error: 'No client with that code.' };
  const visits = rows('Visits').filter(v => v.Code === code).sort((a, b) => toMin(a.Date) - toMin(b.Date))
    .map(v => ({ date: v.Date, treatment: v.Treatment, changes: v.Changes, notes: v.Notes }));
  const appts = rows('Appts').filter(a => a.Code === code && a.Status === 'booked').sort((a, b) => toMin(a.Start) - toMin(b.Start))
    .map(a => ({ id: a.ApptId, start: a.Start, end: a.End, note: a.Note }));
  const linked = c.GroupId ? clients.filter(r => r.GroupId === c.GroupId)
    .map(r => ({ name: r.Name, age: r.Age, gender: r.Gender })) : [];
  const client = present(c);
  client.gender = c.Gender || '';
  client.bookingPhone = c.BookingPhone || '';
  client.linkedAttendees = linked;
  return { ok: true, client: client, visits: visits, appts: appts };
}
function search(q) {
  const s = clean(q.q, 40).toLowerCase(), d = s.replace(/\D/g, '');
  if (s.length < 2) return { ok: true, list: [] };
  const list = rows('Clients').filter(c => String(c.Name).toLowerCase().indexOf(s) > -1 || String(c.Code).toLowerCase().indexOf(s) > -1 || (d.length >= 4 && String(c.Phone).indexOf(d) > -1))
    .slice(0, 15).map(present);
  return { ok: true, list: list };
}
function newClient(q) { return register(q); }
function addVisit(q) {
  const code = normCode(q.code);
  if (!rows('Clients').some(r => r.Code === code)) return { ok: false, error: 'No client with that code.' };
  const date = /^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(q.date || '') ? q.date : nowStr();
  add('Visits', { Code: code, Date: date, Treatment: clean(q.treatment, 2000), Changes: clean(q.changes, 2000), Notes: clean(q.notes, 2000) });
  return { ok: true };
}

function clock(m) { const h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'pm' : 'am'; return (h % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; }
/* clash + working-hours check, pure logic so it can be tested */
function slotProblem(start, booked, cfg) {
  cfg = cfg || CFG;
  const day = dayOf(start), wd = weekday(day);
  if (cfg.DAYS.indexOf(wd) < 0) return { why: 'closed', msg: 'The clinic is closed on this day.' };
  const s = hm(start), e = s + cfg.DURATION;
  if (s < cfg.OPEN || e > cfg.CLOSE) return { why: 'hours', msg: 'Outside working hours (' + clock(cfg.OPEN) + ' to ' + clock(cfg.CLOSE) + ').' };
  const a = toMin(start), b = a + cfg.DURATION;
  for (const x of booked) {
    const xs = toMin(x.start), xe = toMin(x.end);
    if (a < xe + cfg.BUFFER && xs < b + cfg.BUFFER) {
      const overlap = a < xe && xs < b;
      return { why: overlap ? 'clash' : 'buffer', with: x, msg: overlap ? 'This overlaps another appointment.' : 'Too close to another appointment (needs ' + cfg.BUFFER + ' minutes gap).' };
    }
  }
  return null;
}
function suggestSlots(fromStart, booked, cfg, n) {
  cfg = cfg || CFG; n = n || 5;
  const res = [];
  const nowM = toMin(nowStr());
  let dm = toMin(dayOf(fromStart) + ' 00:00');
  for (let d = 0; d < 21 && res.length < n; d++, dm += 1440) {
    const ds = fromMin(dm).slice(0, 10);
    for (let t = cfg.OPEN; t + cfg.DURATION <= cfg.CLOSE && res.length < n; t += cfg.STEP) {
      const st = ds + ' ' + String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
      if (toMin(st) <= nowM || toMin(st) < toMin(fromStart)) continue;
      if (!slotProblem(st, booked, cfg)) res.push(st);
    }
  }
  return res;
}
function bookedList(ignoreId) {
  return rows('Appts').filter(a => a.Status === 'booked' && a.ApptId !== ignoreId).map(a => ({ id: a.ApptId, start: a.Start, end: a.End, code: a.Code }));
}
function checkSlot(q) {
  if (!/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(q.start || '')) return { ok: false, error: 'Pick a date and time.' };
  const booked = bookedList();
  const p = slotProblem(q.start, booked);
  return { ok: true, free: !p, why: p ? p.why : '', problem: p ? p.msg : '', suggestions: p ? suggestSlots(q.start, booked, CFG, 5) : [] };
}
function schedule(q) {
  const code = normCode(q.code);
  const c = rows('Clients').filter(r => r.Code === code)[0];
  if (!c) return { ok: false, error: 'No client with that code.' };
  if (!/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(q.start || '')) return { ok: false, error: 'Pick a date and time.' };
  if (toMin(q.start) <= toMin(nowStr())) return { ok: false, error: 'That time is in the past.' };
  const booked = bookedList();
  let p = slotProblem(q.start, booked);
  if (p && q.force && (p.why === 'closed' || p.why === 'hours')) p = slotProblem(q.start, booked, Object.assign({}, CFG, { DAYS: [0,1,2,3,4,5,6], OPEN: 0, CLOSE: 24 * 60 }));
  if (p) return { ok: false, clash: true, overridable: p.why === 'closed' || p.why === 'hours', problem: p.msg, suggestions: suggestSlots(q.start, booked, CFG, 5) };
  const end = fromMin(toMin(q.start) + CFG.DURATION);
  const id = 'A' + Date.now().toString(36).toUpperCase();
  let ev = '';
  try {
    const cal = CalendarApp.getDefaultCalendar();
    const e = cal.createEvent('Bliss: ' + c.Name + ' (' + code + ')', new Date(toMin(q.start) * 60000), new Date(toMin(end) * 60000),
      { description: 'Client code ' + code + '. Open the owner page for details.' });
    e.removeAllReminders();
    e.addPopupReminder(1440); // 1 day before
    e.addPopupReminder(60);   // 60 minutes before
    ev = e.getId();
  } catch (err) { ev = ''; }
  add('Appts', { ApptId: id, Code: code, Start: q.start, End: end, Status: 'booked', EventId: ev, Note: clean(q.note, 300) });
  return { ok: true, id: id, start: q.start, end: end, calendar: !!ev };
}
function cancel(q) {
  const a = rows('Appts').filter(r => r.ApptId === q.id)[0];
  if (!a) return { ok: false, error: 'Not found.' };
  setCell('Appts', a._row, 'Status', 'cancelled');
  try { if (a.EventId) CalendarApp.getDefaultCalendar().getEventById(a.EventId).deleteEvent(); } catch (err) {}
  return { ok: true };
}
function agenda(q) {
  const day = /^\d{4}-\d\d-\d\d$/.test(q.date || '') ? q.date : nowStr().slice(0, 10);
  const cl = {}; rows('Clients').forEach(c => { cl[c.Code] = c; });
  const list = rows('Appts').filter(a => a.Status === 'booked' && dayOf(a.Start) === day)
    .sort((a, b) => toMin(a.Start) - toMin(b.Start))
    .map(a => ({ id: a.ApptId, code: a.Code, start: a.Start, end: a.End, name: (cl[a.Code] || {}).Name || '', phone: String((cl[a.Code] || {}).Phone || '') }));
  return { ok: true, date: day, list: list };
}
// everything coming up in the next 2 days, for the reminder list
function due() {
  const now = toMin(nowStr()), cl = {}; rows('Clients').forEach(c => { cl[c.Code] = c; });
  const tomorrow = fromMin(now + 1440).slice(0, 10), today = nowStr().slice(0, 10);
  const list = rows('Appts').filter(a => a.Status === 'booked' && toMin(a.Start) >= now - 30 && toMin(a.Start) <= now + 2 * 1440)
    .sort((a, b) => toMin(a.Start) - toMin(b.Start))
    .map(a => {
      const mins = toMin(a.Start) - now, c = cl[a.Code] || {};
      return { id: a.ApptId, code: a.Code, start: a.Start, name: c.Name || '', phone: String(c.Phone || ''),
        tomorrow: dayOf(a.Start) === tomorrow, today: dayOf(a.Start) === today, minsLeft: mins, soon: mins <= 90 };
    });
  return { ok: true, now: nowStr(), list: list };
}
