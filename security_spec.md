# Firebase Security Specification & TDD Framework

## 1. Data Invariants
1. **User Identity Invariant**: A user document under `/users/{email}` can only be created or modified by the authenticated user whose email address matches the document ID (converted to lower case).
2. **System Configurations Guard**: Global settings in `/system/config` can only be updated by verified administrators. Standard users have read-only access.
3. **Transaction Origin Integrity**: Transactions in `/users/{email}/transactions/{id}` can only be created by the owner of that user account. Once created, a transaction is immutable and cannot be updated or deleted.
4. **KYC Status Immortality**: Once a user is verified (`kycStatus == 'verified'`), they cannot downgrade themselves to `unverified` or `pending`.
5. **Admin Authorization**: Only registered, authentic server-side admin documents in `/admins/{uid}` can modify system-wide properties, override user bans, or verify KYC documents.

---

## 2. The "Dirty Dozen" Payloads
These payloads attempt to breach identity, integrity, state logic, and budget exhaustion parameters, and must return `PERMISSION_DENIED`.

### Payload 1: Admin Privilege Self-Assignment
*   **Target**: `/users/malicious@attack.com`
*   **Intended Action**: Write a profile claiming to be an administrator.
*   **Malicious Payload**:
    ```json
    {
      "username": "Malicious Attacker",
      "email": "malicious@attack.com",
      "pin": "999999",
      "balance": 10000000,
      "joinedAt": "2026-07-11T08:00:00Z",
      "isAdmin": true
    }
    ```

### Payload 2: Account Identity Theft
*   **Target**: `/users/victim@safe.com`
*   **Intended Action**: Attack user `malicious@attack.com` modifies victim `victim@safe.com`'s pin.
*   **Malicious Payload**:
    ```json
    {
      "pin": "111111"
    }
    ```

### Payload 3: Direct Unapproved Balance Inflation
*   **Target**: `/users/malicious@attack.com`
*   **Intended Action**: Artificially inflate bank balance directly without going through transactional deposit.
*   **Malicious Payload**:
    ```json
    {
      "balance": 999999999.99
    }
    ```

### Payload 4: Invalid Format Pin Injection (Sanitization Bypass)
*   **Target**: `/users/malicious@attack.com`
*   **Intended Action**: Inject alphanumeric string or non-6-digit pin to cause server-side logic crashes.
*   **Malicious Payload**:
    ```json
    {
      "pin": "ABCDEF"
    }
    ```

### Payload 5: System Settings Poisoning (Relational Spoof)
*   **Target**: `/system/config`
*   **Intended Action**: Unauthenticated or non-admin user updates payout details to their routing numbers.
*   **Malicious Payload**:
    ```json
    {
      "accountNumber": "9999999999",
      "accountName": "Hacker Account",
      "fee": 1,
      "supportLink": "https://t.me/scammer_group"
    }
    ```

### Payload 6: KYC Verification Self-Upgrade
*   **Target**: `/users/malicious@attack.com`
*   **Intended Action**: Bypass payment and manual admin audit to set verification status directly to `verified`.
*   **Malicious Payload**:
    ```json
    {
      "kycStatus": "verified"
    }
    ```

### Payload 7: Expired Session Extension / Time Spoofing
*   **Target**: `/users/malicious@attack.com/joinedCompanies/comp_1`
*   **Intended Action**: Set `joinedAt` date into the future or the past to cheat offline earn calculations.
*   **Malicious Payload**:
    ```json
    {
      "companyId": "comp_1",
      "joinedAt": "2035-01-01T00:00:00Z"
    }
    ```

### Payload 8: Transaction Record Tampering (Deletion)
*   **Target**: `/users/malicious@attack.com/transactions/tx_123`
*   **Intended Action**: Delete a withdrawal or payment transaction to erase auditing logs.
*   **Malicious Payload**: *Empty delete request*

### Payload 9: Denial-of-Wallet Massive String Injection
*   **Target**: `/users/malicious@attack.com`
*   **Intended Action**: Inject a 10MB Base64 string into `avatarUrl` to inflate bandwidth and storage costs.
*   **Malicious Payload**:
    ```json
    {
      "avatarUrl": "[A very long string exceeding 1000 characters...]"
    }
    ```

### Payload 10: Sibling Transaction Forgery
*   **Target**: `/users/victim@safe.com/transactions/tx_456`
*   **Intended Action**: Inject a custom completed withdrawal transaction into a victim's log directly.
*   **Malicious Payload**:
    ```json
    {
      "id": "tx_456",
      "type": "withdraw",
      "title": "Withdrawal Completed",
      "amount": 500000,
      "date": "2026-07-11T08:00:00Z",
      "status": "completed"
    }
    ```

### Payload 11: Banned User Bypass Action
*   **Target**: `/users/banned@locked.com/joinedCompanies/comp_3`
*   **Intended Action**: A restricted user attempts to join a revenue pool.
*   **Malicious Payload**:
    ```json
    {
      "companyId": "comp_3",
      "joinedAt": "2026-07-11T08:00:00Z"
    }
    ```

### Payload 12: Terminal State Overwrite
*   **Target**: `/users/malicious@attack.com/transactions/tx_789`
*   **Intended Action**: Update a transaction with status `failed` to `completed` to trick balance managers.
*   **Malicious Payload**:
    ```json
    {
      "status": "completed"
    }
    ```

---

## 3. Test Runner Specification
The complete test suite is implemented in `firestore.rules.test.ts`. All of these tests verify that unauthenticated, unauthorized, or malformed operations are properly rejected by the Firestore Rules compiler.
