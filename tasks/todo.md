# Group Booking Domain Tasks

## Task 1: Extend the private client schema and public registration API

**Description:** Add non-destructive client fields and validated individual/group registration while preserving the existing private Sheet and code model.

**Acceptance criteria:**
- [ ] `setup` appends missing Gender, group-link, and booking-contact columns without deleting or moving existing rows.
- [ ] Individual registration accepts only Female or Male gender and persists it.
- [ ] Group registration accepts 1–10 complete attendees and creates or reuses individual records under the existing lock.

**Verification:**
- [ ] `node --check clinic/Code.gs` passes.
- [ ] A private test Sheet preserves pre-existing rows after `setup`.
- [ ] Individual and two-attendee group test payloads return the documented result.

**Dependencies:** None

**Files likely touched:**
- `clinic/Code.gs`

**Estimated scope:** Small: 1 file

## Task 2: Persist group issue lists and extend PIN-protected owner lookup

**Description:** Store each attendee’s issue selections during group registration and return linked group information only to authenticated owner lookup requests.

**Acceptance criteria:**
- [ ] Each group attendee retains their own issue list.
- [ ] A matched repeat attendee retains their old code and it is omitted from the public response.
- [ ] Owner lookup returns gender, booking contact, and linked attendee summaries.

**Verification:**
- [ ] `node --check clinic/Code.gs` passes.
- [ ] Private Sheet contents and owner `lookup` response are correct for a new and repeat attendee.

**Dependencies:** Task 1

**Files likely touched:**
- `clinic/Code.gs`

**Estimated scope:** Small: 1 file

## Checkpoint: Domain API

- [ ] Existing individual registration, status lookup, visits, and scheduling retain their request/response behavior.
- [ ] Group test data contains linked individual records and a private booking contact.
- [ ] No existing code appears in a public group-registration response.
