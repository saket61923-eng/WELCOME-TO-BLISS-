# Bliss Pulse Neurotherapy Clinic: project brief (give this to any AI or developer)

Owner: clinic owner, B1/A-302 Sonigara Kesar, Kaspate Wasti, Wakad, Pune. Clinic phone/WhatsApp Business: 93073 22041.
Hosting: GitHub Pages, repo https://saket61923-eng.github.io/WELCOME-TO-BLISS-/ . Everything must be FREE (no paid services).
Owner is not technical: explain steps in plain language, one step at a time.

## What exists (all working, tested)
1. `index.html`: single-file customer page opened by scanning the QR.
   - Phones/tablets always see the customer flow; computers see the printable standee (hash `#standee` forces standee, `#play` forces the app).
   - Flow: name + age + mobile number -> one-page card list of 257 issues in 12 headings (from BlissPulseDiseaseCureList.xlsx) with "Other issues" box last -> round BLISS tick button -> final page.
   - Mood meter top right: BLISS letters + eyes shrink as issues are ticked (score = 50 - 5 per tick; 100 if none ticked).
   - Final page: animated logo, cursive line "If you still think you're healthy, you're already in Bliss, if not drop in at Bliss Pulse", "Book an appointment" call button (tel:+919307322041), review stars + comments, "Post review" button -> WhatsApp wa.me/919307322041 with name, age, mobile, code, issues, review, comments. Fallback: copy review / WhatsApp business short link https://wa.me/message/ZAPXWWICU2LIC1 / SMS.
   - When `const API=''` is filled with the Apps Script URL, it registers the client and shows their code (e.g. BP-7K4M2).
2. `Bliss-Pulse-Standee.pdf`: print-ready standee, 24 x 63.6 in, with QR to the URL above.
3. `clinic/Code.gs`: Google Apps Script backend (private Google Sheet in blisspulse.pune@gmail.com). Actions: register, issues, status (public); lookup, search, addVisit, checkSlot, schedule, cancel, due, agenda, newClient, getConfig, setConfig (need owner PIN stored in Script property `PIN`). Random codes BP-XXXXX, client data never shown to other clients, PIN lockout, clash check with 1-hour buffer, Google Calendar events with alerts 1 day and 60 min before. Working hours default Mon-Sat 3-7 pm, 30 min sessions, editable in Settings.
4. `clinic/owner.html`: owner desk (PIN lock): reminders list with one-tap WhatsApp, client search/record/history, add visit/treatment, book next appointment, new client, settings.
5. `clinic/status.html`: client enters code, sees only the next appointment, can download an .ics calendar file with alerts.
See `clinic/SETUP.md` for the Google setup steps.

## Current status
Owner was in the middle of Google setup: Sheet created, Apps Script open, PIN property being added. Still to do: paste Code.gs, run `setup`, deploy as Web app (Execute as Me, access Anyone), paste the /exec URL into owner.html, status.html and index.html (`const API=`), upload to GitHub (index.html in root, owner.html + status.html in /clinic), then test.

## Rules and decisions
- Free only. Clients get reminders by one-tap WhatsApp from the owner (free WhatsApp cannot send automatically). Owner gets automatic Google Calendar alerts.
- Never put client data in the public GitHub repo. Never ask for or store the owner's Google password or PIN.
- Calendar invites cannot go to a phone number (email only), so clients use the downloadable .ics instead.
- Brand colours: #2a45b0, #1c2f8a, #5f9ea0, #a8e6d6, #e8efe6. Fonts: Montserrat, Dancing Script (cursive line).
- Known: the original page build pipeline is not included; edit index.html directly.
- Always use the `ask` tool when asking the user a question.
