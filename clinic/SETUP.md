# Bliss Pulse clinic system: one-time setup (about 15 minutes, free)

Use the clinic account: blisspulse.pune@gmail.com

## 1. Make the private Sheet
1. Sign in at https://sheets.google.com and click **Blank spreadsheet**. Name it `Bliss Clients`.
2. Click **Extensions > Apps Script**.
3. Delete everything in the editor, open `Code.gs` from this folder, copy all of it, paste it in, click the disk icon (Save).

## 2. Set your PIN and time zone
1. In Apps Script click the **gear (Project Settings)**.
2. Tick **Show "appsscript.json" manifest file**, then in the editor open `appsscript.json` and make sure it has `"timeZone": "Asia/Kolkata"`. Save.
3. In Project Settings, under **Script properties**, click **Add script property**: name `PIN`, value = your secret number (use 6 or more digits). Save.

## 3. Prepare the Sheet and allow the script
1. In the editor pick the function **setup** in the dropdown, click **Run**.
2. Google asks for permission. Click **Review permissions**, choose the clinic account, **Advanced > Go to project (unsafe)**, **Allow**. (This is your own script; the warning is normal.)
3. Your Sheet now has three tabs: Clients, Visits, Appts. Never share this Sheet with anyone.

## 4. Publish the gatekeeper
1. Click **Deploy > New deployment**, gear icon > **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**. Click **Deploy**.
3. Copy the **Web app URL** (ends in `/exec`).
"Anyone" only lets the pages talk to the script. Visitors cannot open your Sheet, and everything about clients needs your PIN.

## 5. Paste the URL in three files
- `owner.html`: `const API='PASTE_WEB_APP_URL_HERE';`
- `status.html`: same line
- `index.html` (the customer page): `const API='';` becomes `const API='https://script.google.com/.../exec';`

## 6. Upload to GitHub
Upload `index.html` to the main folder (replace the old one) and create a folder `clinic` with `owner.html` and `status.html`. Do **not** upload `Code.gs` or this file.
- Customer page: your existing link
- Your desk: `https://saket61923-eng.github.io/WELCOME-TO-BLISS-/clinic/owner.html` (bookmark it; do not print it anywhere)
- Client status page: `.../clinic/status.html` (the code message sent to clients links here)

## 7. Test
1. On a phone open the customer page, register with a test name and number: a code like `BP-7K4M2` appears at the end.
2. Open the desk, enter your PIN, search that code, add a visit, book an appointment. Check your Google Calendar for the event with alerts 1 day and 60 minutes before.
3. Open `status.html`, enter the code: you should see only the appointment.

## If you change Code.gs later
**Deploy > Manage deployments > pencil > Version: New version > Deploy.** The URL stays the same.

## Defaults you can change at the top of Code.gs
Session length (`DURATION`, 30 minutes), gap between sessions (`BUFFER`, 60), working days and hours.
