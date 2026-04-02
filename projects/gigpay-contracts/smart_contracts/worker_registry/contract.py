from algopy import (
    ARC4Contract,
    Account,
    Bytes,
    Global,
    GlobalState,
    Txn,
    UInt64,
    arc4,
    gtxn,
    op,
)


class WorkerRegistry(ARC4Contract):
    """Registry for gig workers with personal details, ratings, and earnings tracking."""

    def __init__(self) -> None:
        self.admin = GlobalState(Account)
        self.total_workers = UInt64(0)

    @arc4.abimethod(create="require")
    def create(self) -> None:
        """Initialize the contract. Sets sender as admin."""
        self.admin.value = Txn.sender

    @arc4.abimethod
    def add_worker(
        self,
        worker: Account,
        name: Bytes,
        phone: Bytes,
        upi_id: Bytes,
        rating: UInt64,
        mbr_pay: gtxn.PaymentTransaction,
    ) -> None:
        """Admin adds a worker with personal details. Rating 10-50 (1.0-5.0 stars)."""
        assert Txn.sender == self.admin.value
        assert rating >= 10
        assert rating <= 50

        key = b"wrk_" + worker.bytes
        assert not op.Box.get(key)[1]  # worker must not already exist

        assert mbr_pay.receiver == Global.current_application_address
        assert mbr_pay.amount >= 100_000  # MBR for box (2500 + key + 120 bytes)

        # Pad fields to fixed sizes: name(32) + phone(16) + upi_id(32)
        padded_name = op.extract(name + Bytes(b"\x00" * 32), 0, 32)
        padded_phone = op.extract(phone + Bytes(b"\x00" * 16), 0, 16)
        padded_upi = op.extract(upi_id + Bytes(b"\x00" * 32), 0, 32)

        # Build record: name(32) + phone(16) + upi_id(32) + rating(8) + status(8)
        #   + registered_at(8) + total_earned(8) + tasks_completed(8) = 120 bytes
        record = (
            padded_name
            + padded_phone
            + padded_upi
            + op.itob(rating)
            + op.itob(UInt64(1))  # status = active
            + op.itob(Global.latest_timestamp)
            + op.itob(UInt64(0))  # total_earned
            + op.itob(UInt64(0))  # tasks_completed
        )
        op.Box.put(key, record)
        self.total_workers += 1

    @arc4.abimethod
    def update_rating(self, worker: Account, new_rating: UInt64) -> None:
        """Admin updates a worker's rating (10-50)."""
        assert Txn.sender == self.admin.value
        assert new_rating >= 10
        assert new_rating <= 50

        key = b"wrk_" + worker.bytes
        _data, exists = op.Box.get(key)
        assert exists

        # rating is at offset 80 (name 32 + phone 16 + upi_id 32)
        op.Box.replace(key, 80, op.itob(new_rating))

    @arc4.abimethod
    def update_worker_status(self, worker: Account, status: UInt64) -> None:
        """Admin updates a worker's status. 0=inactive, 1=active, 2=suspended."""
        assert Txn.sender == self.admin.value
        assert status <= 2

        key = b"wrk_" + worker.bytes
        _data, exists = op.Box.get(key)
        assert exists

        # status is at offset 88 (name 32 + phone 16 + upi_id 32 + rating 8)
        op.Box.replace(key, 88, op.itob(status))

    @arc4.abimethod
    def increment_earnings(self, worker: Account, amount: UInt64) -> None:
        """Increment worker's earnings and task count after payment. Admin only."""
        assert Txn.sender == self.admin.value

        key = b"wrk_" + worker.bytes
        data, exists = op.Box.get(key)
        assert exists

        # total_earned at offset 104, tasks_completed at offset 112
        current_earned = op.btoi(op.extract(data, 104, 8))
        current_tasks = op.btoi(op.extract(data, 112, 8))

        op.Box.replace(key, 104, op.itob(current_earned + amount))
        op.Box.replace(key, 112, op.itob(current_tasks + 1))

    @arc4.abimethod(readonly=True)
    def get_worker_info(self, worker: Account) -> Bytes:
        """Read worker info from box storage. Returns 120 bytes raw."""
        key = b"wrk_" + worker.bytes
        data, exists = op.Box.get(key)
        assert exists
        return data

    @arc4.abimethod(readonly=True)
    def get_worker_rating(self, worker: Account) -> UInt64:
        """Get worker's current rating (10-50)."""
        key = b"wrk_" + worker.bytes
        data, exists = op.Box.get(key)
        assert exists
        return op.btoi(op.extract(data, 80, 8))

    @arc4.abimethod(readonly=True)
    def get_worker_status(self, worker: Account) -> UInt64:
        """Get worker's status."""
        key = b"wrk_" + worker.bytes
        data, exists = op.Box.get(key)
        assert exists
        return op.btoi(op.extract(data, 88, 8))
