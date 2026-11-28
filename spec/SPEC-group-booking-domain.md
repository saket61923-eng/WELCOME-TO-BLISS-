# Spec: Group Booking Domain — V1

Status: proposed
Module: `group-booking-domain`

## Objective

Allow a booking contact to register up to ten attendees as private individual clients while preserving one clinical history and one Bliss code per attendee. The customer-facing application submits the group only after all attendee issue checklists are complete. The clinic owner can retrieve an attendee and see their private linked group and booking contact, but scheduling remains one attendee per session.

Success means that a group submission creates or safely reuses individual client records, persists every attendee’s gender and issue list, links the records privately, and never returns an existing attendee’s code to the public page.

## Tech Stack

- Static HTML, CSS, and browser JavaScript for the GitHub Pages customer application.
- Google Apps Script (`clinic/Code.gs`) for the private API and Google Sheet storage.
- Google Sheets for private client, visit, and appointment data.
- No additional services, dependencies, paid products, or public client-data storage.

## Commands

No package manifest or repository build, lint, or automated test command exists.

- Deploy backend change: Apps Script → **Deploy** → **Manage deployments** → edit deployment → **New version** → **Deploy**.
- Manual domain verification: follow `clinic/SETUP.md` section 7 using test client data, then remove those test records from the private Sheet.

## Project Structure

```text
clinic/Code.gs                    private registration, issue, lookup, and scheduling API
clinic/owner.html                 PIN-protected owner client of the private API
clinic/SETUP.md                   manual Google Apps Script deployment instructions
index.html                        public intake markup
assets/index.js                   public intake API client and state
spec/capability-map.md            approved initiative module boundaries
spec/SPEC-group-booking-domain.md this module specification
```

## Code Style

Keep Apps Script APIs small, explicit, and defensive. Validate and normalize all public input at the API boundary; persist only named fields declared in `SHEETS`; keep public requests separate from PIN-protected owner requests.

```js
function registerGroup(q) {
  const contactPhone = phone10(q.contactPhone);
  const attendees = Array.isArray(q.attendees) ? q.attendees : [];
  if (!contactPhone || !attendees.length || attendees.length > 10) {
    return { ok: false, error: 'Please check the group details.' };
  }
  // Create or reuse each individual client inside the existing script lock.
}
```

Use existing camelCase request fields, PascalCase Sheet headings, single quotes, and the existing object-response convention (`{ ok: true, ... }` or `{ ok: false, error: '...' }`). Do not log client data.

## Testing Strategy

No automated test framework exists. Verify the domain behavior against a dedicated private test Sheet:

1. Run `setup` on a Sheet containing existing client rows; confirm it adds missing headings without deleting or moving existing data.
2. Submit a two-attendee group with distinct gender and issue selections; confirm two client records, a shared private group link, the booking contact, and each attendee’s own issues are stored.
3. Submit the same attendee details again; confirm no duplicate client or public old-code disclosure.
4. Look up either attendee with the owner PIN; confirm their gender, booking contact, and both linked attendees are returned.
5. Schedule each attendee separately; confirm existing duration, buffer, and clash checks are unchanged.

## Boundaries

- Always: validate all submitted names, ages, gender values, phone numbers, attendee count, and checklist payloads; add schema columns without deleting existing client data; hold the existing script lock around group registration; keep all client data in the private Sheet.
- Ask first: changing the client matching rule, expanding gender choices beyond Female/Male, changing the ten-attendee limit, changing session capacity, or changing public code-disclosure rules.
- Never: expose a prior client code to a public request; put any client data, PIN, Apps Script URL with secrets, or private group identifier in the public repository; weaken PIN, locking, or appointment-clash safeguards.

## Success Criteria

- `setup` preserves existing `Clients` rows and adds fields for gender, group linking, and booking contact when absent.
- The public API accepts one group booking of 1–10 attendees only after every attendee has name, age, Female/Male gender, and their own issue selections.
- Each attendee is created or reused as an individual client with a private group link and booking contact.
- A repeated attendee is matched by normalized name, age, gender, and booking-contact mobile; their old code is neither returned nor displayed publicly.
- The API response exposes newly created codes only.
- The owner lookup for an attendee returns their gender, booking contact, and linked attendees.
- Existing individual client registration, visits, status lookup, and one-attendee-per-session clash behavior continue to work.

## Out of Scope (Deferred)

- Customer-selected appointment time slots; the owner schedules each attendee separately.
- Shared group treatment sessions or group-capacity scheduling.
- Gender values other than Female and Male.
- Automatic WhatsApp messaging; the clinic continues to use its existing manual WhatsApp flow.

## Open Questions

None.
