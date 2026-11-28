# Capability Map: Group Appointment Booking

| Module ID | Responsibility | Depends on |
|---|---|---|
| `group-booking-domain` | Private group-link data, booking-contact details, client gender, multi-attendee registration, duplicate matching, and owner API data. | — |
| `group-intake` | Customer individual/group choice, attendee add/remove limit, per-attendee details, sequential checklists, and new-code-only confirmation. | `group-booking-domain` |
| `group-booking-desk` | Owner display of the linked group, contact, attendee gender, and individual scheduling entry points. | `group-booking-domain` |

Build order: `group-booking-domain` → `group-intake` and `group-booking-desk`.

Status: approved 2026-11-28.
