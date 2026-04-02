from algopy import (
    ARC4Contract,
    Account,
    Bytes,
    Global,
    GlobalState,
    Txn,
    UInt64,
    arc4,
    op,
)


class DeliveryManager(ARC4Contract):
    """Track deliveries, confirm completion, calculate rating-based payouts."""

    def __init__(self) -> None:
        self.admin = GlobalState(Account)
        self.total_deliveries = UInt64(0)

    @arc4.abimethod(create="require")
    def create(self) -> None:
        """Initialize the contract. Sets sender as admin."""
        self.admin.value = Txn.sender

    @arc4.abimethod
    def create_delivery(
        self,
        delivery_id: UInt64,
        worker: Account,
        base_amount: UInt64,
        customer_name: Bytes,
        pickup: Bytes,
        dropoff: Bytes,
    ) -> None:
        """Admin creates a delivery order assigned to a worker."""
        assert Txn.sender == self.admin.value

        key = b"dlv_" + op.itob(delivery_id)
        assert not op.Box.get(key)[1]  # delivery must not already exist

        # Pad strings to fixed sizes
        padded_customer = op.extract(customer_name + Bytes(b"\x00" * 32), 0, 32)
        padded_pickup = op.extract(pickup + Bytes(b"\x00" * 32), 0, 32)
        padded_dropoff = op.extract(dropoff + Bytes(b"\x00" * 32), 0, 32)

        # Record: worker(32) + customer_name(32) + pickup(32) + dropoff(32)
        #   + base_amount(8) + final_amount(8) + status(8) + created_at(8) + delivered_at(8) = 168 bytes
        record = (
            worker.bytes
            + padded_customer
            + padded_pickup
            + padded_dropoff
            + op.itob(base_amount)
            + op.itob(UInt64(0))  # final_amount (calculated on confirmation)
            + op.itob(UInt64(0))  # status: 0=assigned
            + op.itob(Global.latest_timestamp)  # created_at
            + op.itob(UInt64(0))  # delivered_at
        )
        op.Box.put(key, record)
        self.total_deliveries += 1

    @arc4.abimethod
    def mark_picked_up(self, delivery_id: UInt64) -> None:
        """Mark delivery as picked up. Admin only."""
        assert Txn.sender == self.admin.value

        key = b"dlv_" + op.itob(delivery_id)
        data, exists = op.Box.get(key)
        assert exists

        status = op.btoi(op.extract(data, 136, 8))
        assert status == 0  # must be assigned

        op.Box.replace(key, 136, op.itob(UInt64(1)))  # status = picked_up

    @arc4.abimethod
    def confirm_delivery(self, delivery_id: UInt64, worker_rating: UInt64) -> None:
        """Confirm delivery completed. Calculates payout from base_amount * rating multiplier.
        worker_rating: 10-50 (1.0-5.0 stars). Admin only.

        Rating multipliers (applied to base_amount):
          50 (5 stars) = 150%
          40 (4 stars) = 120%
          30 (3 stars) = 100%
          20 (2 stars) = 80%
          10 (1 star)  = 60%
        """
        assert Txn.sender == self.admin.value
        assert worker_rating >= 10
        assert worker_rating <= 50

        key = b"dlv_" + op.itob(delivery_id)
        data, exists = op.Box.get(key)
        assert exists

        status = op.btoi(op.extract(data, 136, 8))
        assert status <= 1  # must be assigned or picked_up

        base_amount = op.btoi(op.extract(data, 128, 8))

        # Calculate multiplier: rating 10 → 60, 20 → 80, 30 → 100, 40 → 120, 50 → 150
        # Formula: multiplier = 40 + (worker_rating * 22) / 10
        # Simplified: final = base_amount * (40 + worker_rating * 22 / 10) / 100
        multiplier = UInt64(40) + (worker_rating * UInt64(22)) // UInt64(10)
        final_amount = (base_amount * multiplier) // UInt64(100)

        # Offsets: worker(32) + customer(32) + pickup(32) + dropoff(32) = 128
        # base_amount at 128, final_amount at 136, status at 144, created_at at 152, delivered_at at 160
        op.Box.replace(key, 136, op.itob(final_amount))
        op.Box.replace(key, 144, op.itob(UInt64(2)))  # status = delivered
        op.Box.replace(key, 160, op.itob(Global.latest_timestamp))

    @arc4.abimethod
    def mark_paid(self, delivery_id: UInt64) -> None:
        """Mark delivery as paid after escrow release. Admin only."""
        assert Txn.sender == self.admin.value

        key = b"dlv_" + op.itob(delivery_id)
        data, exists = op.Box.get(key)
        assert exists

        status = op.btoi(op.extract(data, 144, 8))
        assert status == 2  # must be delivered

        op.Box.replace(key, 144, op.itob(UInt64(3)))  # status = paid

    @arc4.abimethod(readonly=True)
    def get_delivery_info(self, delivery_id: UInt64) -> Bytes:
        """Get full delivery record (168 bytes)."""
        key = b"dlv_" + op.itob(delivery_id)
        data, exists = op.Box.get(key)
        assert exists
        return data

    @arc4.abimethod(readonly=True)
    def get_delivery_status(self, delivery_id: UInt64) -> UInt64:
        """Get delivery status. 0=assigned, 1=picked_up, 2=delivered, 3=paid."""
        key = b"dlv_" + op.itob(delivery_id)
        data, exists = op.Box.get(key)
        assert exists
        return op.btoi(op.extract(data, 144, 8))

    @arc4.abimethod(readonly=True)
    def get_delivery_worker(self, delivery_id: UInt64) -> Account:
        """Get the worker assigned to a delivery."""
        key = b"dlv_" + op.itob(delivery_id)
        data, exists = op.Box.get(key)
        assert exists
        return Account(op.extract(data, 0, 32))

    @arc4.abimethod(readonly=True)
    def get_delivery_amount(self, delivery_id: UInt64) -> UInt64:
        """Get the final payout amount (after rating multiplier)."""
        key = b"dlv_" + op.itob(delivery_id)
        data, exists = op.Box.get(key)
        assert exists
        return op.btoi(op.extract(data, 136, 8))
