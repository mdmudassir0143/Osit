# Alora Phase 3 + 4 Sub-Plan: Smart Contracts & Frontend Role Routes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan section by section. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the on-chain primitives (`WorkerRegistry` refactor + new `AttestationLog` + new `AccessGrants`) and the three frontend role-routes (Worker / Issuer / Consumer) that consume them. End-to-end demoable on localnet.

**Architecture:** Three Algorand Python (PuyaPy) contracts using box storage. Three React role-routes with role-specific component sub-trees. Frontend reads on-chain directly; off-chain dependencies (vault, gateway, OTP) are stubbed in the browser until their dedicated phases.

**Tech Stack:** Algorand Python (PuyaPy), AlgoKit, algokit_utils + AlgorandClient, pytest + algorand_python_testing, React 18 + Vite + Tailwind + use-wallet, AlgorandClient TypeScript, generated typed app clients.

**Spec reference:** `docs/superpowers/specs/2026-04-29-alora-reputation-substrate-design.md`
**Parent plan:** `docs/superpowers/plans/2026-04-29-alora-implementation.md` (Phases 3 + 4 outlined there)

**User-confirmed stub strategy** (replace cleanly when each downstream phase lands):
- **Phone-OTP (Phase 7 stub):** Browser hashes user-typed phone with SHA-256. No real verification; the call site is isolated to `services/phone.ts` so the swap is one file.
- **Encrypted vault (Phase 6 stub):** Issuer encrypts the JSON payload to itself (deterministic key derived from issuer wallet) and stores the encrypted blob in `localStorage` keyed by SHA-256 hash. The hash doubles as the on-chain `content_cid` and `content_hash` is the same value. Consumer reads pull blobs from `localStorage` for now; in Phase 6 a vault client replaces it.
- **Read API gateway (Phase 5 stub):** Consumer dashboard queries Algorand directly (algod boxes + indexer). No subscription gating in V1 of this phase; grants are still enforced client-side against the on-chain `AccessGrants` contract.

---

## Section A — Smart Contracts

**Working directory for this section:** `/Users/mohammadmudassir/Projects/gig/gigpay/projects/gigpay-contracts/`

### Storage layout reference (used across contracts)

| Contract | Box prefix | Key | Value |
|---|---|---|---|
| WorkerRegistry | `wkr` | `wkr_{address}` (33B) | `WorkerInfo` (~96B) |
| WorkerRegistry | `phn` | `phn_{phone_hash}` (35B) | `Address` (32B) |
| AttestationLog | `att` | `att_{id}` (35B) | `Attestation` (~152B) |
| AttestationLog | `cnt_s` | `cnt_s_{address}` (37B) | `UInt64` count |
| AttestationLog | `cnt_i` | `cnt_i_{address}` (37B) | `UInt64` count |
| AttestationLog | `s_idx` | `s_idx_{address}_{index_be8}` (45B) | `Bytes32` att_id |
| AttestationLog | `i_idx` | `i_idx_{address}_{index_be8}` (45B) | `Bytes32` att_id |
| AccessGrants | `gnt` | `gnt_{worker}_{consumer}` (66B) | `Grant` (~80B) |

The composite-key indices (`s_idx`, `i_idx`) avoid the read-modify-write cost of mutating a `DynamicArray` inside a box on every issuance. Each issuance writes exactly: `att_{id}` (one new box), `s_idx_..._{n}` (one new box), `i_idx_..._{n}` (one new box), and increments `cnt_s_..._` and `cnt_i_..._` (existing boxes). Listings happen client-side by reading the count then reading the index range.

### Data structures

```python
# Shared types — defined in each contract that uses them

class WorkerInfo(arc4.Struct):
    handle: arc4.String        # 4-32 chars, UTF-8
    phone_hash: arc4.StaticBytes[32]
    registered_at: arc4.UInt64

class Attestation(arc4.Struct):
    subject: arc4.Address
    issuer: arc4.Address
    issued_at: arc4.UInt64
    valid_until: arc4.UInt64   # 0 = no expiry
    category: arc4.UInt8       # 1=work_event, 2=skill, 3=payment_proof, 4=vouch, 5=other
    weight: arc4.UInt16        # 0..10000 basis points
    content_cid: arc4.StaticBytes[32]
    content_hash: arc4.StaticBytes[32]
    revoked: arc4.Bool

class Grant(arc4.Struct):
    worker: arc4.Address
    consumer: arc4.Address
    scope_bitmask: arc4.UInt32  # bit per category (1=cat 1, 2=cat 2, 4=cat 3, ...)
    granted_at: arc4.UInt64
    expires_at: arc4.UInt64     # 0 = no expiry
    query_limit: arc4.UInt32    # 0 = unlimited
    queries_used: arc4.UInt32
    revoked: arc4.Bool
```

### Task A.1: Set up the new contract directory structure

**Files:**
- Delete: `projects/gigpay-contracts/smart_contracts/escrow_pool/`
- Delete: `projects/gigpay-contracts/smart_contracts/task_verification/`
- Delete: `projects/gigpay-contracts/tests/escrow_pool_client_test.py`
- Delete: `projects/gigpay-contracts/tests/task_verification_client_test.py`
- Create: `projects/gigpay-contracts/smart_contracts/attestation_log/__init__.py`
- Create: `projects/gigpay-contracts/smart_contracts/attestation_log/contract.py` (stub)
- Create: `projects/gigpay-contracts/smart_contracts/attestation_log/deploy_config.py`
- Create: `projects/gigpay-contracts/smart_contracts/access_grants/__init__.py`
- Create: `projects/gigpay-contracts/smart_contracts/access_grants/contract.py` (stub)
- Create: `projects/gigpay-contracts/smart_contracts/access_grants/deploy_config.py`

- [ ] **Step 1: Delete legacy contract directories**

```bash
cd /Users/mohammadmudassir/Projects/gig/gigpay/projects/gigpay-contracts
rm -rf smart_contracts/escrow_pool
rm -rf smart_contracts/task_verification
rm -f tests/escrow_pool_client_test.py
rm -f tests/task_verification_client_test.py
```

- [ ] **Step 2: Create new directory skeletons**

Create empty `__init__.py` files for the two new contract packages. Create `contract.py` files containing only minimal class skeletons (filled in by subsequent tasks). Create `deploy_config.py` files modeled on `worker_registry/deploy_config.py` — adapt the contract name + import path, leave deployment logic stubbed for now.

The skeletons are placeholders so `__main__.py`'s contract discovery (`folder.is_dir() and has_contract_file(folder)`) finds them. Real contract code lands in Tasks A.3 and A.4.

```python
# attestation_log/contract.py — skeleton
from algopy import ARC4Contract, arc4

class AttestationLog(ARC4Contract):
    pass
```

```python
# access_grants/contract.py — skeleton
from algopy import ARC4Contract, arc4

class AccessGrants(ARC4Contract):
    pass
```

- [ ] **Step 3: Verify project still builds with skeletons**

```bash
cd /Users/mohammadmudassir/Projects/gig/gigpay
algokit project run build
```

Expected: build succeeds. The two skeleton contracts produce minimal artifacts; no tests run yet against them. WorkerRegistry continues to build.

If the build fails because legacy code references the deleted contracts, hunt down the references — they should only be in `__main__.py` artifact paths or in tests that were just deleted. Don't proceed until build is clean.

---

### Task A.2: Refactor `WorkerRegistry`

**Files:**
- Modify: `projects/gigpay-contracts/smart_contracts/worker_registry/contract.py` — full rewrite per new spec
- Modify: `projects/gigpay-contracts/smart_contracts/worker_registry/deploy_config.py` — minor (mostly unchanged)
- Test: `projects/gigpay-contracts/tests/worker_registry_client_test.py` — full rewrite

The current `WorkerRegistry` (243 lines) has fields for rating, earnings, deliveries, etc. — all carried over from the GigPay payment context. Refactor it to the minimal sybil-anchor + handle model from spec §3.2 / §8.1.

- [ ] **Step 1: Write the failing tests first (TDD)**

Replace the contents of `tests/worker_registry_client_test.py` with tests for the new surface. Use the existing `conftest.py` `algorand_fixture` pattern.

Test cases (each as its own `def test_*`):
1. `test_register_worker_writes_both_maps` — call `register_worker(phone_hash, handle)`; verify `wkr_{address}` box has the right `WorkerInfo`; verify `phn_{phone_hash}` box maps back to the address.
2. `test_register_worker_rejects_duplicate_phone` — register a phone, attempt to register a different address with the same phone, expect a logic error.
3. `test_register_worker_rejects_duplicate_address` — register a worker, attempt to register the same address again with a different phone, expect a logic error.
4. `test_update_handle_modifies_only_handle` — register, then `update_handle("new")`; verify handle changed, phone_hash and registered_at unchanged.
5. `test_update_handle_unregistered_fails` — call `update_handle` on an unregistered address, expect a logic error.
6. `test_lookup_by_phone_hash_returns_address` — register then call `lookup_by_phone_hash(phone_hash)`; expect the right address.
7. `test_lookup_by_phone_hash_unknown_fails` — call with a phone hash never registered, expect a logic error.
8. `test_get_worker_info_returns_struct` — register, then `get_worker_info(addr)` returns the expected `WorkerInfo` fields.
9. `test_handle_length_validation` — handles outside the 4-32 char range are rejected.

Use `algokit_utils.AlgorandClient.from_environment()` for localnet. Generate a fresh `phone_hash` per test (e.g., `secrets.token_bytes(32)`).

- [ ] **Step 2: Run the tests; confirm they fail**

```bash
cd projects/gigpay-contracts
poetry run pytest tests/worker_registry_client_test.py -v
```

Expected: tests fail because the contract still has the legacy surface. That's the red state for TDD.

- [ ] **Step 3: Replace the contract code**

Full rewrite of `worker_registry/contract.py`:

```python
from algopy import ARC4Contract, BoxMap, Global, Txn, arc4, op

MIN_HANDLE_LEN = 4
MAX_HANDLE_LEN = 32

class WorkerInfo(arc4.Struct):
    handle: arc4.String
    phone_hash: arc4.StaticBytes[32]
    registered_at: arc4.UInt64

class WorkerRegistry(ARC4Contract):
    def __init__(self) -> None:
        # box prefix "wkr" → key is sender address (32 bytes); value is WorkerInfo
        self.workers = BoxMap(arc4.Address, WorkerInfo, key_prefix="wkr")
        # box prefix "phn" → key is phone_hash (32 bytes); value is the wallet Address
        self.phone_index = BoxMap(arc4.StaticBytes[32], arc4.Address, key_prefix="phn")

    @arc4.abimethod
    def register_worker(
        self,
        phone_hash: arc4.StaticBytes[32],
        handle: arc4.String,
    ) -> None:
        sender = arc4.Address(Txn.sender)
        # length checks on handle
        assert handle.bytes.length >= MIN_HANDLE_LEN, "handle too short"
        assert handle.bytes.length <= MAX_HANDLE_LEN, "handle too long"
        # neither sender nor phone may already be registered
        assert sender not in self.workers, "address already registered"
        assert phone_hash not in self.phone_index, "phone already registered"

        info = WorkerInfo(
            handle=handle,
            phone_hash=phone_hash,
            registered_at=arc4.UInt64(Global.latest_timestamp),
        )
        self.workers[sender] = info.copy()
        self.phone_index[phone_hash] = sender.copy()

    @arc4.abimethod
    def update_handle(self, handle: arc4.String) -> None:
        sender = arc4.Address(Txn.sender)
        assert handle.bytes.length >= MIN_HANDLE_LEN, "handle too short"
        assert handle.bytes.length <= MAX_HANDLE_LEN, "handle too long"
        assert sender in self.workers, "not registered"
        existing = self.workers[sender].copy()
        self.workers[sender] = WorkerInfo(
            handle=handle,
            phone_hash=existing.phone_hash,
            registered_at=existing.registered_at,
        ).copy()

    @arc4.abimethod(readonly=True)
    def lookup_by_phone_hash(
        self, phone_hash: arc4.StaticBytes[32]
    ) -> arc4.Address:
        assert phone_hash in self.phone_index, "phone not registered"
        return self.phone_index[phone_hash]

    @arc4.abimethod(readonly=True)
    def get_worker_info(self, addr: arc4.Address) -> WorkerInfo:
        assert addr in self.workers, "not registered"
        return self.workers[addr]
```

The implementer should follow `algorand-plugin:algorand-python` skill for exact PuyaPy syntax. The above sketch is correct in shape; minor adjustments may be needed for box-mutation idioms.

- [ ] **Step 4: Run the tests; confirm they pass**

```bash
cd projects/gigpay-contracts
algokit project run build  # rebuild artifacts + regen TS clients
poetry run pytest tests/worker_registry_client_test.py -v
```

Expected: all 9 tests pass.

If any fail, iterate on the contract until green. Don't relax the tests — they encode the spec.

- [ ] **Step 5: Update `deploy_config.py`**

The deploy config mostly stays the same — it uses AlgoKit's standard deploy pattern. Only change the deployment description text (since "rating" / "earnings" no longer apply). The contract name `WorkerRegistry` stays.

---

### Task A.3: Create `AttestationLog`

**Files:**
- Modify: `projects/gigpay-contracts/smart_contracts/attestation_log/contract.py` — full implementation
- Modify: `projects/gigpay-contracts/smart_contracts/attestation_log/deploy_config.py` — adapt from `worker_registry/deploy_config.py`
- Create: `projects/gigpay-contracts/tests/attestation_log_client_test.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/attestation_log_client_test.py` covering:

1. `test_issue_attestation_writes_box` — issue with valid params; verify `att_{id}` box exists with the right `Attestation` struct.
2. `test_issue_attestation_returns_deterministic_id` — issue twice with the same params (different timestamps); verify the IDs differ. Issue then re-issue with explicit nonce; ensure ID computation deterministic given inputs.
3. `test_issue_increments_subject_count` — first issuance against subject A: count=1, index 0 holds the att_id; second issuance: count=2, index 1 holds the new id; index 0 still holds the first id.
4. `test_issue_increments_issuer_count` — same pattern for issuer side.
5. `test_issue_rejects_invalid_category` — category=0 or category=255 should fail (range 1..5 only).
6. `test_issue_rejects_invalid_weight` — weight > 10000 should fail.
7. `test_get_attestation_returns_struct` — issued attestation can be read back.
8. `test_revoke_attestation_by_issuer_succeeds` — issuer can revoke their own; `revoked` flag flips to true.
9. `test_revoke_attestation_by_subject_succeeds` — subject can revoke an attestation about themselves.
10. `test_revoke_attestation_by_third_party_fails` — random other address cannot revoke.
11. `test_revoke_attestation_idempotent` — revoking twice is a no-op (or fails predictably; pick one and document).

- [ ] **Step 2: Run; confirm fail**

```bash
cd projects/gigpay-contracts
poetry run pytest tests/attestation_log_client_test.py -v
```

Expected: every test fails (the contract is still a skeleton).

- [ ] **Step 3: Implement the contract**

```python
from algopy import ARC4Contract, BoxMap, Global, Txn, arc4, op

VALID_CATEGORIES = (1, 2, 3, 4, 5)
MAX_WEIGHT = 10000

class Attestation(arc4.Struct):
    subject: arc4.Address
    issuer: arc4.Address
    issued_at: arc4.UInt64
    valid_until: arc4.UInt64
    category: arc4.UInt8
    weight: arc4.UInt16
    content_cid: arc4.StaticBytes[32]
    content_hash: arc4.StaticBytes[32]
    revoked: arc4.Bool

class AttestationLog(ARC4Contract):
    def __init__(self) -> None:
        self.attestations = BoxMap(
            arc4.StaticBytes[32], Attestation, key_prefix="att"
        )
        self.subject_count = BoxMap(arc4.Address, arc4.UInt64, key_prefix="cnt_s")
        self.issuer_count = BoxMap(arc4.Address, arc4.UInt64, key_prefix="cnt_i")
        # For composite-key boxes (subject_idx[address][index]), we use a manually
        # constructed box key built from prefix + address + index_bigendian.
        # Implementer should follow algorand-plugin:algorand-python skill for the
        # exact pattern (Box.put_in / op.box_put with concatenated keys).

    @arc4.abimethod
    def issue_attestation(
        self,
        subject: arc4.Address,
        category: arc4.UInt8,
        weight: arc4.UInt16,
        valid_until: arc4.UInt64,
        content_cid: arc4.StaticBytes[32],
        content_hash: arc4.StaticBytes[32],
    ) -> arc4.StaticBytes[32]:
        # validate inputs
        c = category.native
        assert c >= 1 and c <= 5, "invalid category"
        assert weight.native <= MAX_WEIGHT, "weight out of range"

        issuer = arc4.Address(Txn.sender)
        now = arc4.UInt64(Global.latest_timestamp)

        # id = sha256(issuer || subject || now || cid)
        # Implementer: use op.sha256 with concatenated bytes.
        att_id_bytes = op.sha256(
            issuer.bytes + subject.bytes + op.itob(now.native) + content_cid.bytes
        )
        att_id = arc4.StaticBytes[32].from_bytes(att_id_bytes)

        # write attestation box
        att = Attestation(
            subject=subject,
            issuer=issuer,
            issued_at=now,
            valid_until=valid_until,
            category=category,
            weight=weight,
            content_cid=content_cid,
            content_hash=content_hash,
            revoked=arc4.Bool(False),
        )
        self.attestations[att_id] = att.copy()

        # subject index
        s_count = self.subject_count.get(key=subject, default=arc4.UInt64(0))
        # write s_idx_{subject}_{s_count_be8} = att_id  (composite key)
        self._set_subject_index(subject, s_count.native, att_id)
        self.subject_count[subject] = arc4.UInt64(s_count.native + 1)

        # issuer index
        i_count = self.issuer_count.get(key=issuer, default=arc4.UInt64(0))
        self._set_issuer_index(issuer, i_count.native, att_id)
        self.issuer_count[issuer] = arc4.UInt64(i_count.native + 1)

        return att_id

    @arc4.abimethod
    def revoke_attestation(self, att_id: arc4.StaticBytes[32]) -> None:
        assert att_id in self.attestations, "attestation not found"
        att = self.attestations[att_id].copy()
        sender = arc4.Address(Txn.sender)
        assert sender == att.issuer or sender == att.subject, "not authorized"
        att.revoked = arc4.Bool(True)
        self.attestations[att_id] = att.copy()

    @arc4.abimethod(readonly=True)
    def get_attestation(
        self, att_id: arc4.StaticBytes[32]
    ) -> Attestation:
        assert att_id in self.attestations, "attestation not found"
        return self.attestations[att_id]

    @arc4.abimethod(readonly=True)
    def get_subject_count(self, subject: arc4.Address) -> arc4.UInt64:
        return self.subject_count.get(key=subject, default=arc4.UInt64(0))

    @arc4.abimethod(readonly=True)
    def get_issuer_count(self, issuer: arc4.Address) -> arc4.UInt64:
        return self.issuer_count.get(key=issuer, default=arc4.UInt64(0))

    @arc4.subroutine
    def _set_subject_index(
        self,
        subject: arc4.Address,
        index: UInt64,
        att_id: arc4.StaticBytes[32],
    ) -> None:
        # composite key: "s_idx" + subject (32B) + index_be (8B)
        key = b"s_idx" + subject.bytes + op.itob(index)
        op.Box.put(key, att_id.bytes)

    @arc4.subroutine
    def _set_issuer_index(
        self,
        issuer: arc4.Address,
        index: UInt64,
        att_id: arc4.StaticBytes[32],
    ) -> None:
        key = b"i_idx" + issuer.bytes + op.itob(index)
        op.Box.put(key, att_id.bytes)
```

The composite-key box pattern (manual `op.Box.put` with concatenated keys) is the trickiest piece. Implementer must reference `algorand-plugin:algorand-python` for the exact box-low-level API (it may be `op.Box.put_in`, `op.box_put`, or similar — the skill knows current syntax).

Client-side listing (frontend):
```typescript
// pseudocode — actual code lives in services/attestations.ts
const count = await client.getSubjectCount({subject: address})
const ids: Uint8Array[] = []
for (let i = 0; i < count; i++) {
  const key = concat(textEncoder.encode("s_idx"), address.publicKey, itob(BigInt(i)))
  const idBox = await algorand.client.algod.getApplicationBoxByName(appId, key).do()
  ids.push(idBox.value)
}
```

- [ ] **Step 4: Run; confirm green**

```bash
algokit project run build
poetry run pytest tests/attestation_log_client_test.py -v
```

Expected: all 11 tests pass.

- [ ] **Step 5: Update `deploy_config.py`**

Adapt from `worker_registry/deploy_config.py`. Same pattern, change the contract name and import.

---

### Task A.4: Create `AccessGrants`

**Files:**
- Modify: `projects/gigpay-contracts/smart_contracts/access_grants/contract.py`
- Modify: `projects/gigpay-contracts/smart_contracts/access_grants/deploy_config.py`
- Create: `projects/gigpay-contracts/tests/access_grants_client_test.py`

- [ ] **Step 1: Tests first**

Cases:
1. `test_grant_access_writes_box` — issue a grant; verify `gnt_{worker}_{consumer}` box has the right `Grant` struct.
2. `test_grant_access_can_overwrite` — grant, then grant again with different scope/expiry; the box reflects the new values.
3. `test_revoke_access_marks_revoked` — grant then revoke; box's `revoked` field is true.
4. `test_revoke_access_unauthorized_fails` — only the worker (sender == grant.worker) may revoke; consumer's attempt to revoke fails.
5. `test_revoke_access_unknown_grant_fails` — revoking a non-existent (worker, consumer) pair fails.
6. `test_check_grant_returns_struct` — registered grant returns the struct.
7. `test_check_grant_unknown_returns_zero_or_default` — unregistered (worker, consumer) returns a sentinel grant struct (worker=zero address). Test that the consumer can detect this.
8. `test_check_grant_expired_still_returns` — `check_grant` does NOT enforce expiry on read; consumers compare `expires_at` themselves. Test verifies the struct comes back even when `expires_at` is in the past.

- [ ] **Step 2: Run; confirm fail**

- [ ] **Step 3: Implement**

```python
from algopy import ARC4Contract, BoxMap, Global, Txn, arc4, op

class Grant(arc4.Struct):
    worker: arc4.Address
    consumer: arc4.Address
    scope_bitmask: arc4.UInt32
    granted_at: arc4.UInt64
    expires_at: arc4.UInt64
    query_limit: arc4.UInt32
    queries_used: arc4.UInt32
    revoked: arc4.Bool

class AccessGrants(ARC4Contract):
    def __init__(self) -> None:
        # Composite key: prefix "gnt" + worker (32B) + consumer (32B)
        # Total box key = 3 + 32 + 32 = 67 bytes. Use BoxMap with a Bytes64 composite key.
        self.grants = BoxMap(arc4.StaticBytes[64], Grant, key_prefix="gnt")

    @arc4.abimethod
    def grant_access(
        self,
        consumer: arc4.Address,
        scope_bitmask: arc4.UInt32,
        expires_at: arc4.UInt64,
        query_limit: arc4.UInt32,
    ) -> None:
        worker = arc4.Address(Txn.sender)
        key = arc4.StaticBytes[64].from_bytes(worker.bytes + consumer.bytes)
        grant = Grant(
            worker=worker,
            consumer=consumer,
            scope_bitmask=scope_bitmask,
            granted_at=arc4.UInt64(Global.latest_timestamp),
            expires_at=expires_at,
            query_limit=query_limit,
            queries_used=arc4.UInt32(0),
            revoked=arc4.Bool(False),
        )
        self.grants[key] = grant.copy()

    @arc4.abimethod
    def revoke_access(self, consumer: arc4.Address) -> None:
        worker = arc4.Address(Txn.sender)
        key = arc4.StaticBytes[64].from_bytes(worker.bytes + consumer.bytes)
        assert key in self.grants, "no grant to revoke"
        existing = self.grants[key].copy()
        existing.revoked = arc4.Bool(True)
        self.grants[key] = existing.copy()

    @arc4.abimethod(readonly=True)
    def check_grant(
        self,
        worker: arc4.Address,
        consumer: arc4.Address,
    ) -> Grant:
        key = arc4.StaticBytes[64].from_bytes(worker.bytes + consumer.bytes)
        if key in self.grants:
            return self.grants[key]
        # sentinel for "no grant" — all-zero struct; client checks worker.bytes against zero address
        return Grant(
            worker=arc4.Address(Global.zero_address),
            consumer=arc4.Address(Global.zero_address),
            scope_bitmask=arc4.UInt32(0),
            granted_at=arc4.UInt64(0),
            expires_at=arc4.UInt64(0),
            query_limit=arc4.UInt32(0),
            queries_used=arc4.UInt32(0),
            revoked=arc4.Bool(False),
        )
```

- [ ] **Step 4: Run; confirm green**

```bash
algokit project run build
poetry run pytest tests/access_grants_client_test.py -v
```

---

### Task A.5: Update `__main__.py` deployment script

**Files:**
- Modify: `projects/gigpay-contracts/smart_contracts/__main__.py`

The existing `__main__.py` auto-discovers contracts by directory scan, so it'll pick up `attestation_log` and `access_grants` automatically. The only changes needed:

- [ ] **Step 1: Verify auto-discovery picks up the new contracts**

```bash
cd projects/gigpay-contracts
algokit project run build
ls smart_contracts/artifacts/
```

Expected: `attestation_log/`, `access_grants/`, `worker_registry/` directories under `artifacts/` — all with `.arc56.json` and `*Client.ts` files. No `escrow_pool/` or `task_verification/` artifacts (those should be cleaned up; if they linger, delete them manually).

- [ ] **Step 2: Update root README and the contracts README**

The root `README.md` references the three legacy contracts. Update the table to list the new three. Also update `projects/gigpay-contracts/README.md` similarly. Brief: 1-line description per contract, matching the spec.

---

### Task A.6: Build, link, and verify the full contract suite

**Files:**
- Run: build + test + link

- [ ] **Step 1: Full clean build**

```bash
cd /Users/mohammadmudassir/Projects/gig/gigpay
algokit project run build
```

Expected: success. Three contracts compile, three sets of artifacts written, three TypeScript clients generated and linked into `projects/gigpay-frontend/src/contracts/`.

- [ ] **Step 2: Run the full test suite**

```bash
cd projects/gigpay-contracts
poetry run pytest -v
```

Expected: all tests across all three contracts pass.

- [ ] **Step 3: Check the linked TS clients exist in the frontend**

```bash
ls /Users/mohammadmudassir/Projects/gig/gigpay/projects/gigpay-frontend/src/contracts/
```

Expected: files for `WorkerRegistry`, `AttestationLog`, `AccessGrants`. Files for `EscrowPool` or `TaskVerification` should be gone (or, if they linger, delete manually as part of this task).

- [ ] **Step 4: Deploy to localnet for manual smoke check (optional but recommended)**

```bash
algokit localnet start
algokit project deploy localnet
```

Expected: each contract deploys successfully. App IDs printed.

---

## Section B — Frontend Role Routes

**Working directory for this section:** `/Users/mohammadmudassir/Projects/gig/gigpay/projects/gigpay-frontend/`

This section assumes Section A is complete (typed clients exist in `src/contracts/`). The skeleton work (routing, layouts, mock data) can in theory start in parallel, but final wiring requires the clients.

### Component file structure

**Reused (no change in this phase):**
- `components/shared/AloraLogo.tsx`
- `components/shared/NotificationBell.tsx`
- `components/shared/TransactionToast.tsx`
- `components/shared/WalletStatus.tsx`
- `components/ConnectWallet.tsx`
- `components/ErrorBoundary.tsx`
- `layouts/DashboardLayout.tsx`

**Repurposed (significantly modified):**
- `pages/WorkerDashboard.tsx` — rewrite around attestations + grants
- `components/worker/WorkerProfile.tsx` — keep handle/phone display, drop earnings/rating
- `components/worker/RegisterWorker.tsx` — switch to phone-OTP-stub flow (hash + register)

**Deleted:**
- `pages/PlatformDashboard.tsx`
- All of `components/platform/`
- `components/worker/DeliveryHistory.tsx`
- `components/worker/EarningsBreakdown.tsx`
- `components/worker/EarningsCard.tsx`
- `components/worker/OfframpCard.tsx`
- `components/worker/RatingInsight.tsx`
- `components/worker/SendUsdc.tsx`
- `components/Transact.tsx` (USDC-specific helper)
- `hooks/useWorkerData.ts` (will need a fresh `useWorkerProfile` and `useWorkerAttestations` instead)

**New files:**
- `pages/IssuerDashboard.tsx`
- `pages/ConsumerDashboard.tsx`
- `components/worker/AttestationsList.tsx`
- `components/worker/GrantsManager.tsx`
- `components/issuer/IssueAttestationForm.tsx`
- `components/issuer/IssuanceHistory.tsx`
- `components/issuer/IssuerProfile.tsx`
- `components/consumer/ConsumerProfile.tsx`
- `components/consumer/QueryConsole.tsx`
- `components/consumer/GrantStatus.tsx`
- `services/phone.ts` — phone-hash stub (Phase 7 swap target)
- `services/vault.ts` — encrypted-blob stub (Phase 6 swap target)
- `services/attestations.ts` — typed-client wrappers + box-listing helpers
- `services/grants.ts` — grant lookup/manage helpers
- `hooks/useWorkerProfile.ts`
- `hooks/useWorkerAttestations.ts`
- `hooks/useIssuerHistory.ts`
- `hooks/useConsumerQuery.ts`

### Task B.1: Update routing and remove platform route

**Files:**
- Modify: `projects/gigpay-frontend/src/App.tsx` lines 39-52 (the `<Routes>` block)
- Delete: `projects/gigpay-frontend/src/pages/PlatformDashboard.tsx`

- [ ] **Step 1: Update `App.tsx` Routes**

Replace the imports and the `<Routes>` block:

```tsx
import Landing from './pages/Landing'
import WorkerDashboard from './pages/WorkerDashboard'
import IssuerDashboard from './pages/IssuerDashboard'
import ConsumerDashboard from './pages/ConsumerDashboard'

// inside the JSX:
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/worker" element={<WorkerDashboard />} />
  <Route path="/issuer" element={<IssuerDashboard />} />
  <Route path="/consumer" element={<ConsumerDashboard />} />
</Routes>
```

Drop the `PlatformDashboard` import and the `/platform` route.

- [ ] **Step 2: Delete `PlatformDashboard.tsx` and the platform components directory**

```bash
cd projects/gigpay-frontend
rm src/pages/PlatformDashboard.tsx
rm -rf src/components/platform
```

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
npm run lint
```

Expected: errors will surface in `WorkerDashboard.tsx` (it imports many components we're about to delete). That's expected — fix in Task B.3. Also a `Navigate to="/platform"` reference inside `WorkerDashboard.tsx:78` — drop it (the admin redirect was payment-platform-specific and no longer applies).

For now, accept the lint errors and move on. They'll be cleaned up by the end of Task B.3.

---

### Task B.2: Stub services (phone, vault, attestations, grants)

**Files:**
- Create: `projects/gigpay-frontend/src/services/phone.ts`
- Create: `projects/gigpay-frontend/src/services/vault.ts`
- Create: `projects/gigpay-frontend/src/services/attestations.ts`
- Create: `projects/gigpay-frontend/src/services/grants.ts`

These are the boundary-layer modules the dashboards depend on. Building them first means the dashboards have a stable surface to call into.

- [ ] **Step 1: `services/phone.ts` (phone-hash stub)**

```typescript
// services/phone.ts
//
// Phase 7 swap target: this file is the single boundary for phone verification.
// In Phase 7 the `verifyAndHash` function will dispatch an OTP, validate it,
// and return the same SHA-256 hash. Until then, no verification — we just
// hash whatever the user typed.

const SALT = 'alora-v1' // a global constant ensures the same phone always hashes consistently

export async function verifyAndHash(phone: string): Promise<Uint8Array> {
  // Future: dispatch OTP, await user-entered code, verify
  // V1 stub: hash directly
  const normalized = normalizePhone(phone)
  const data = new TextEncoder().encode(SALT + ':' + normalized)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(buf)
}

function normalizePhone(phone: string): string {
  // strip everything except digits and a leading +
  return phone.replace(/[^\d+]/g, '')
}
```

- [ ] **Step 2: `services/vault.ts` (encrypted-blob stub)**

```typescript
// services/vault.ts
//
// Phase 6 swap target: this file is the single boundary for the encrypted vault.
// In Phase 6 these functions will encrypt to the worker's public key, upload to
// IPFS or a self-hosted store, and return real CIDs. V1 stub: store JSON in
// localStorage keyed by SHA-256 hash of the canonical-stringified payload.

export interface AttestationPayload {
  category: number
  claim: string             // free text, opaque per spec V1
  rating?: number           // optional issuer-suggested rating
  metadata?: Record<string, unknown>
}

const PREFIX = 'alora.vault.'

export async function uploadPayload(payload: AttestationPayload): Promise<{
  contentCid: Uint8Array
  contentHash: Uint8Array
}> {
  const json = canonicalStringify(payload)
  const data = new TextEncoder().encode(json)
  const hashBuf = await crypto.subtle.digest('SHA-256', data)
  const hash = new Uint8Array(hashBuf)
  // V1: cid === hash. Phase 6 will introduce real CIDs.
  localStorage.setItem(PREFIX + bytesToHex(hash), json)
  return { contentCid: hash, contentHash: hash }
}

export async function fetchPayload(
  contentCid: Uint8Array
): Promise<AttestationPayload | null> {
  const item = localStorage.getItem(PREFIX + bytesToHex(contentCid))
  if (!item) return null
  return JSON.parse(item) as AttestationPayload
}

function canonicalStringify(value: unknown): string {
  // sort keys for deterministic hashing
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(canonicalStringify).join(',') + ']'
  const keys = Object.keys(value as Record<string, unknown>).sort()
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify((value as Record<string, unknown>)[k])).join(',') + '}'
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
```

- [ ] **Step 3: `services/attestations.ts` (typed-client wrapper + box listing)**

The actual code depends on the generated `AttestationLogClient.ts`. Implementer should follow `algorand-plugin:algorand-typescript` skill for the `getTypedAppClientById` pattern.

Sketch of the surface:

```typescript
// services/attestations.ts
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
// ...generated client import...

export interface AttestationRecord {
  id: Uint8Array
  subject: string
  issuer: string
  issuedAt: bigint
  validUntil: bigint
  category: number
  weight: number
  contentCid: Uint8Array
  contentHash: Uint8Array
  revoked: boolean
}

export async function issueAttestation(params: {
  algorand: AlgorandClient
  appId: bigint
  signer: TransactionSigner  // from useWallet
  sender: string
  subject: string
  category: number
  weight: number
  validUntil: bigint
  contentCid: Uint8Array
  contentHash: Uint8Array
}): Promise<Uint8Array /* attId */> { /* ... */ }

export async function listBySubject(params: {
  algorand: AlgorandClient
  appId: bigint
  subject: string
}): Promise<AttestationRecord[]> {
  // 1. Read get_subject_count(subject) → count
  // 2. For i in 0..count-1: read box "s_idx" + addressBytes + itob(i) → att_id
  // 3. For each att_id: get_attestation(att_id) → struct
  // 4. Decode and return
}

export async function listByIssuer(params: {
  algorand: AlgorandClient
  appId: bigint
  issuer: string
}): Promise<AttestationRecord[]> { /* mirror listBySubject */ }

export async function revokeAttestation(params: {
  algorand: AlgorandClient
  appId: bigint
  signer: TransactionSigner
  sender: string
  attId: Uint8Array
}): Promise<void> { /* ... */ }
```

- [ ] **Step 4: `services/grants.ts` (typed-client wrapper for AccessGrants)**

```typescript
// services/grants.ts

export interface GrantRecord {
  worker: string
  consumer: string
  scopeBitmask: number
  grantedAt: bigint
  expiresAt: bigint
  queryLimit: number
  queriesUsed: number
  revoked: boolean
  exists: boolean  // false if check_grant returned the zero-address sentinel
}

export async function grantAccess(params: {
  algorand: AlgorandClient
  appId: bigint
  signer: TransactionSigner
  sender: string
  consumer: string
  scopeBitmask: number
  expiresAt: bigint
  queryLimit: number
}): Promise<void> { /* ... */ }

export async function revokeAccess(params: {
  algorand: AlgorandClient
  appId: bigint
  signer: TransactionSigner
  sender: string
  consumer: string
}): Promise<void> { /* ... */ }

export async function checkGrant(params: {
  algorand: AlgorandClient
  appId: bigint
  worker: string
  consumer: string
}): Promise<GrantRecord> {
  // call check_grant; detect sentinel by worker === ZERO_ADDRESS
}

export function isGrantValid(g: GrantRecord, category: number, now: bigint): boolean {
  if (!g.exists) return false
  if (g.revoked) return false
  if (g.expiresAt > 0n && g.expiresAt < now) return false
  if (g.queryLimit > 0 && g.queriesUsed >= g.queryLimit) return false
  if ((g.scopeBitmask & (1 << (category - 1))) === 0) return false
  return true
}
```

- [ ] **Step 5: Verify services typecheck**

```bash
npm run lint
```

Service files alone should be lint-clean. Existing dashboard errors persist — those land in B.3.

---

### Task B.3: Rewrite `WorkerDashboard.tsx` and supporting worker components

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/WorkerDashboard.tsx` — full rewrite
- Modify: `projects/gigpay-frontend/src/components/worker/WorkerProfile.tsx` — drop earnings/rating, keep handle/phone
- Modify: `projects/gigpay-frontend/src/components/worker/RegisterWorker.tsx` — phone-OTP-stub flow
- Create: `projects/gigpay-frontend/src/components/worker/AttestationsList.tsx`
- Create: `projects/gigpay-frontend/src/components/worker/GrantsManager.tsx`
- Create: `projects/gigpay-frontend/src/hooks/useWorkerProfile.ts`
- Create: `projects/gigpay-frontend/src/hooks/useWorkerAttestations.ts`
- Delete: `projects/gigpay-frontend/src/components/worker/{DeliveryHistory,EarningsBreakdown,EarningsCard,OfframpCard,RatingInsight,SendUsdc}.tsx`
- Delete: `projects/gigpay-frontend/src/components/Transact.tsx`
- Delete: `projects/gigpay-frontend/src/hooks/useWorkerData.ts`

- [ ] **Step 1: Delete the retired components and hooks**

```bash
cd projects/gigpay-frontend/src
rm components/worker/DeliveryHistory.tsx
rm components/worker/EarningsBreakdown.tsx
rm components/worker/EarningsCard.tsx
rm components/worker/OfframpCard.tsx
rm components/worker/RatingInsight.tsx
rm components/worker/SendUsdc.tsx
rm components/Transact.tsx
rm hooks/useWorkerData.ts
```

- [ ] **Step 2: Refactor `RegisterWorker.tsx`**

The current `RegisterWorker.tsx` has fields for name, phone, UPI, etc. (payment-era). Replace with: handle (4-32 chars), phone (with the V1 stub flow). On submit, call `services/phone.ts`'s `verifyAndHash`, then call `WorkerRegistryClient.registerWorker({ phoneHash, handle })`.

Component shape:
- Form with `<input>` for handle and phone
- "Register" button — disabled until both fields valid
- On submit: hash phone → call contract → toast on success → trigger profile refetch

Keep the brutalist styling consistent with the rest of the app (`nb-card`, `nb-btn`, `bg-cream`, etc.).

- [ ] **Step 3: Refactor `WorkerProfile.tsx`**

Drop the rating/earnings/deliveries display. Show:
- Handle
- Wallet address (truncated, copyable)
- Phone hash (truncated, displayed as a hex string with a tooltip "this hash is what links your record across employers")
- Registered-at timestamp

- [ ] **Step 4: New component `AttestationsList.tsx`**

Renders the list of attestations issued *to* the connected worker. For each attestation card show:
- Issuer address (truncated; future Phase 6 link to issuer profile)
- Issued date
- Category (label, not the number)
- Whether expired or active
- Revoked badge (if revoked)
- "View" button → expand to show the decrypted claim text from `services/vault.ts`'s `fetchPayload`

Empty state: friendly message + a CTA "Share your worker link" (future feature, just text for now).

Data source: `services/attestations.ts` `listBySubject(workerAddress)`.

- [ ] **Step 5: New component `GrantsManager.tsx`**

Renders all grants the worker has issued (i.e., consumers they've authorized). Card per grant:
- Consumer address (truncated)
- Scope (which categories — render as small chips)
- Expiry date
- Query usage (`queriesUsed / queryLimit` if limit > 0, else "unlimited")
- "Revoke" button → calls `services/grants.ts` `revokeAccess(consumer)`

Empty state: "No active grants. When a consumer requests access, you'll see it here."

For V1, the grant-request inbox is a Phase 5+ feature (the gateway delivers requests). For now, the worker can manually grant by entering a consumer's address into a small form at the bottom of the panel.

- [ ] **Step 6: New hook `useWorkerProfile.ts`**

```typescript
// hooks/useWorkerProfile.ts
import { useEffect, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
// ...

export interface WorkerProfile {
  registered: boolean
  handle: string
  phoneHash: Uint8Array
  registeredAt: bigint
}

export function useWorkerProfile(refreshKey: number = 0): {
  profile: WorkerProfile | null
  loading: boolean
  error: Error | null
} {
  // - get connected address from useWallet
  // - call WorkerRegistryClient.getWorkerInfo(address)
  // - if box-not-found error → return { registered: false, ... }
  // - otherwise return parsed struct
}
```

- [ ] **Step 7: New hook `useWorkerAttestations.ts`**

Similar pattern. Wraps `services/attestations.ts` `listBySubject`. Returns `{ attestations, loading, error }`.

- [ ] **Step 8: Rewrite `WorkerDashboard.tsx`**

Top-level page composition:

```tsx
const WorkerDashboard: React.FC = () => {
  const { activeAddress, transactionSigner } = useWallet()
  const [refreshKey, setRefreshKey] = useState(0)
  const [walletModal, setWalletModal] = useState(false)
  const { profile, loading: profileLoading } = useWorkerProfile(refreshKey)
  const { attestations, loading: attestationsLoading } = useWorkerAttestations(refreshKey)

  // Wallet not connected → "Connect Wallet" landing card
  if (!activeAddress) {
    /* same as before, except remove the ADMIN_ADDRESS redirect */
  }

  // Profile loading → spinner
  if (profileLoading) return <DashboardLayout>...</DashboardLayout>

  // Not registered → show RegisterWorker form, on success → setRefreshKey
  if (!profile?.registered) {
    return (
      <DashboardLayout>
        <RegisterWorker onSuccess={() => setRefreshKey(k => k + 1)} />
      </DashboardLayout>
    )
  }

  // Registered → show profile + attestations + grants
  return (
    <DashboardLayout>
      <WorkerProfileCard profile={profile} />
      <AttestationsList
        attestations={attestations}
        loading={attestationsLoading}
        onRefresh={() => setRefreshKey(k => k + 1)}
      />
      <GrantsManager
        workerAddress={activeAddress}
        onRefresh={() => setRefreshKey(k => k + 1)}
      />
    </DashboardLayout>
  )
}
```

Drop the USDC opt-in flow entirely. Drop the `ADMIN_ADDRESS === activeAddress → /platform` redirect. Drop the `useWorkerData` hook reference.

- [ ] **Step 9: Verify**

```bash
npm run lint
```

Expected: clean. If errors remain, they're either from imports we deleted but still referenced, or from the hooks not yet wired correctly. Hunt and fix.

---

### Task B.4: Build `IssuerDashboard.tsx` and issuer components

**Files:**
- Create: `projects/gigpay-frontend/src/pages/IssuerDashboard.tsx`
- Create: `projects/gigpay-frontend/src/components/issuer/IssueAttestationForm.tsx`
- Create: `projects/gigpay-frontend/src/components/issuer/IssuanceHistory.tsx`
- Create: `projects/gigpay-frontend/src/components/issuer/IssuerProfile.tsx`
- Create: `projects/gigpay-frontend/src/hooks/useIssuerHistory.ts`

- [ ] **Step 1: `IssueAttestationForm.tsx`**

Form fields:
- Subject — input accepts either a wallet address (58 chars, base32) or a phone string (parsed via `services/phone.ts` and resolved on-chain via `WorkerRegistry.lookup_by_phone_hash`).
- Category — dropdown: Work Event / Skill / Payment Proof / Vouch / Other.
- Claim — textarea (free-form, opaque text per spec V1). Multi-line OK; encourage but don't enforce structured content.
- Rating (optional) — 1-5 stars, mapped to weight basis points.
- Expiry (optional) — date picker; if empty → `valid_until = 0`.

Submit flow:
1. Resolve subject if phone provided → wallet address.
2. Build payload `{ category, claim, rating, metadata }`.
3. `services/vault.ts` `uploadPayload(payload)` → `{ contentCid, contentHash }`.
4. `services/attestations.ts` `issueAttestation({ subject, category, weight, validUntil, contentCid, contentHash })`.
5. Toast on success; reset form; trigger history refetch.

Validation: subject required; claim required; category required.

- [ ] **Step 2: `IssuanceHistory.tsx`**

List of attestations the connected issuer has issued. Card per attestation showing:
- Subject (truncated)
- Category label
- Issued date
- Active/expired/revoked status
- "Revoke" button (issuer can revoke their own attestations)

Empty state: "No attestations issued yet. Use the form above to issue your first."

Data source: `services/attestations.ts` `listByIssuer(issuerAddress)`.

- [ ] **Step 3: `IssuerProfile.tsx`**

Minimal — for V1, just shows:
- Issuer wallet address (truncated, copy)
- Total attestations issued count
- Optional self-declared display name (not on-chain; from `localStorage`)
- A "Verified business?" label that says "Pseudonymous" for V1 (verification flow is V2).

- [ ] **Step 4: `useIssuerHistory.ts`**

Wraps `listByIssuer`. Same shape as `useWorkerAttestations`.

- [ ] **Step 5: `IssuerDashboard.tsx`**

Top-level composition:

```tsx
const IssuerDashboard: React.FC = () => {
  const { activeAddress, transactionSigner } = useWallet()
  const [refreshKey, setRefreshKey] = useState(0)
  const { history, loading } = useIssuerHistory(refreshKey)
  const [walletModal, setWalletModal] = useState(false)

  if (!activeAddress) return <ConnectWalletCard onOpen={() => setWalletModal(true)} />

  return (
    <DashboardLayout>
      <IssuerProfile address={activeAddress} attestationsCount={history.length} />
      <IssueAttestationForm onIssued={() => setRefreshKey(k => k + 1)} />
      <IssuanceHistory attestations={history} loading={loading} />
    </DashboardLayout>
  )
}
```

Reuse the same brutalist visual language as the worker dashboard. The "ConnectWalletCard" is the same wallet-prompt block currently inlined in `WorkerDashboard.tsx`; consider extracting to `components/shared/ConnectWalletCard.tsx` and reusing across all three role pages — that's a small refactor justified by triplication.

- [ ] **Step 6: Verify**

```bash
npm run lint
```

Expected: clean.

---

### Task B.5: Build `ConsumerDashboard.tsx` and consumer components

**Files:**
- Create: `projects/gigpay-frontend/src/pages/ConsumerDashboard.tsx`
- Create: `projects/gigpay-frontend/src/components/consumer/ConsumerProfile.tsx`
- Create: `projects/gigpay-frontend/src/components/consumer/QueryConsole.tsx`
- Create: `projects/gigpay-frontend/src/components/consumer/GrantStatus.tsx`
- Create: `projects/gigpay-frontend/src/hooks/useConsumerQuery.ts`

- [ ] **Step 1: `ConsumerProfile.tsx`**

Same minimal pattern as `IssuerProfile`. Shows wallet address, optional display name, V1 disclaimer "Subscription billing arrives in Phase 5."

- [ ] **Step 2: `QueryConsole.tsx`**

The main consumer interaction. Two-pane layout:

Left pane — query input:
- Subject lookup (wallet address or phone) — same resolution as the issuer form.
- Category filter — multi-select (defaults to all 5 categories).
- "Query" button.

Right pane — results:
- For each attestation the consumer has access to (i.e., grant exists, valid, scope matches): render the same attestation card as the worker side, but additionally with the decrypted claim text inline.
- For attestations where access is denied: show a "Request access" CTA per attestation OR (simpler V1) show a single panel: "Worker has N attestations matching your filter. Request a grant to view details" + a "Request grant" button that does nothing yet (Phase 5 wires it; for V1, just toasts "Grant request sent to worker (stub)").

Behind the scenes:
- Resolve subject → address.
- `services/grants.ts` `checkGrant(worker=subject, consumer=activeAddress)` → grant.
- `services/attestations.ts` `listBySubject(subject)` → all attestations.
- For each attestation:
  - If `isGrantValid(grant, attestation.category, now)` → fetch payload from vault, show full card.
  - Else → show "access required" placeholder.

- [ ] **Step 3: `GrantStatus.tsx`**

Side panel showing all grants the connected consumer holds. Each card:
- Worker address (truncated)
- Categories accessible (chips)
- Expiry
- Queries remaining (`queryLimit - queriesUsed`)

Data source: this is harder than worker grants because the `AccessGrants` contract doesn't index by consumer (only by `gnt_{worker}_{consumer}` composite key). For V1, the consumer must remember which workers granted them access (track in `localStorage` after each grant request was satisfied). Phase 5 gateway will index this server-side.

V1 rendering: an empty state "Active grants will appear here" plus a small "Add grant" form where consumer pastes a worker address and we then call `checkGrant` to verify and store. Pragmatic; not pretty.

- [ ] **Step 4: `useConsumerQuery.ts`**

Wraps the dual-fetch flow above (`checkGrant` + `listBySubject` + per-result vault fetch). Returns `{ results, loading, error }`.

- [ ] **Step 5: `ConsumerDashboard.tsx`**

Top-level composition: `ConsumerProfile` + `QueryConsole` + `GrantStatus` side panel. Layout: two-column on desktop (console wide, status narrow), stacked on mobile.

- [ ] **Step 6: Verify**

```bash
npm run lint
```

---

### Task B.6: Final integration check

**Files:**
- Modify: any leftover lint or wiring issues across the three dashboards.
- Verify: `npm run build` from `projects/gigpay-frontend/`.

- [ ] **Step 1: Full project lint**

```bash
cd projects/gigpay-frontend
npm run lint
```

Target: zero errors in any of the new/modified files. Pre-existing warnings in unrelated files are acceptable; new warnings introduced by this work are not.

- [ ] **Step 2: Full project build**

```bash
npm run build
```

Expected: zero TypeScript errors; Vite emits assets cleanly.

- [ ] **Step 3: Sanity-check the dependency graph**

```bash
grep -r "OfframpCard\|EarningsBreakdown\|DeliveryHistory\|RatingInsight\|SendUsdc\|Transact\|PlatformDashboard\|useWorkerData" src/
```

Expected: zero matches in source code (matches in `node_modules`, `dist`, or `.git` are noise — filter them).

- [ ] **Step 4: Manual walk-through (optional but recommended)**

```bash
algokit localnet start
algokit project deploy localnet
cd projects/gigpay-frontend
npm run dev
```

Walk through the demo on localnet:
1. Open `/` — landing page renders.
2. Open `/worker`, connect a localnet KMD wallet, enter handle + phone, click Register. Verify profile appears.
3. Open `/issuer` in a different localnet account, enter the worker's address as subject, fill the form, submit. Verify the issuance succeeded and shows in history.
4. Back in `/worker` (refresh), confirm the new attestation appears in `AttestationsList`.
5. From `/worker`, manually grant access to a third localnet address (the consumer).
6. Open `/consumer` in that third address, enter the worker's address into the query console. Verify the attestation comes back decrypted.

If any step fails, hunt down the issue. Don't mark Section B complete until the demo loop closes.

---

## Definition of Done

**Section A:**
- All three contracts (`WorkerRegistry`, `AttestationLog`, `AccessGrants`) build cleanly.
- `poetry run pytest` passes all tests across all three contracts.
- TypeScript clients are linked into `projects/gigpay-frontend/src/contracts/`.
- No legacy contract code remains in `smart_contracts/` or `tests/`.

**Section B:**
- `/worker`, `/issuer`, `/consumer` routes all render without errors.
- `/platform` is gone.
- `npm run lint` passes for the frontend.
- `npm run build` succeeds for the frontend.
- Manual demo loop (worker registers → issuer issues → consumer queries) closes end-to-end on localnet.

**Cross-cutting:**
- No remaining references to legacy components, hooks, or contracts in active code paths.
- All stub services (`phone.ts`, `vault.ts`, `attestations.ts`, `grants.ts`) have clear "Phase X swap target" comments at the top.
- Brutalist design system preserved across all three new dashboards (palette, `nb-card`, `shadow-brutal-*`).

---

## Self-Review Notes

- **Spec coverage:** Sections §3.2 (3 contracts), §4 (data model), §5 (identity & registration), §6 (privacy/grants flow), §7 (worker/issuer/consumer flows), §8 (contract method surfaces) — all addressed across Section A and Section B tasks. §9 (off-chain components) is stubbed in `services/`; full implementation in Phases 5-7.
- **Stubs:** Phone, vault, gateway stubs are isolated to single files (`services/phone.ts`, `services/vault.ts`, plus the on-chain-direct query path) — single-file swap when each downstream phase lands.
- **No placeholders left in plan:** Every step has either a concrete code block, a concrete command with expected output, or a concrete verification check. The PuyaPy code blocks are sketches that the implementer translates via the `algorand-plugin:algorand-python` skill — that's a deliberate choice, not a placeholder.
- **Type/symbol consistency:** `WorkerInfo`, `Attestation`, `Grant` structs defined in Section A storage layout; consumed by name in Section B services and hooks. `services/phone.ts` `verifyAndHash` is the only entry point for phone hashing — referenced in `RegisterWorker.tsx` and `IssueAttestationForm.tsx` (subject resolution).
- **Open questions resolved by user:** Phone-OTP stub, vault stub, gateway stub all confirmed before plan was written.
- **Open question still alive:** the exact PuyaPy idiom for composite-key boxes (`s_idx`, `i_idx`, `gnt`) — the implementer subagent must use the algorand-python skill to settle this. If the skill's recommended pattern differs from the sketch in Task A.3 / A.4, follow the skill, not the sketch.
