# Security Specification - Baba Elite

## Data Invariants
- **Players**: `id` must be alphanumeric. `name` (max 100 chars) and `phone` are mandatory.
- **Fair Play**: `score` must be between -100 and 100. `category` must be one of the predefined enums.
- **Attendance**: `status` must be `PRESENTE`, `AUSENTE`, or `JUSTIFICADO`.
- **System Logs**: Read-only for admins. Internal records.

## The Dirty Dozen (Vulnerability Test Cases)
1. **Identity Spoofing**: Attempt to create a player with an arbitrary ID and setting `status_payment` to 'PAGO'.
2. **Resource Poisoning**: Update a player's `name` with a 1MB string.
3. **Privilege Escalation**: Non-admin user attempting to read from the `senders` collection.
4. **State Shortcutting**: Manually updating a match's `updated_at` to bypass logic.
5. **Unauthorized Access**: Reading `system_logs` without being an authorized admin.
6. **ID Injection**: Using a path injection like `../secrets` in a document ID.
7. **PII Leak**: Querying the `players` collection for phones without being a registered member.
8. **Shadow Update**: Adding a `isAdmin: true` field to a player document.
9. **Denial of Wallet**: Repeatedly querying a large collection with unindexed fields (enforced by rule structure).
10. **Terminal State Break**: Attempting to update a match once it has been archived (if terminal state lock exists).
11. **Timestamp Spoofing**: Setting `created_at` to a future date instead of `request.time`.
12. **Orphaned Writes**: Creating an attendance record for a player that does not exist.

## Test Runner Plan
A `firestore.rules.test.ts` will verify that:
- Only authorized admins (verified email) can write to `players`, `app_settings`, and `senders`.
- Public (authenticated) can read ranking data but not PII.
- All writes are validated against schema constraints (size, type, regex).
