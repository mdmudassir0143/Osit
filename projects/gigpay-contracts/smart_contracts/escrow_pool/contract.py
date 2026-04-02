from algopy import (
    ARC4Contract,
    Account,
    Asset,
    Global,
    GlobalState,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
    op,
)


class PaymentRecord(arc4.Struct):
    amount: arc4.UInt64
    timestamp: arc4.UInt64
    delivery_id: arc4.UInt64


class EscrowPool(ARC4Contract):
    """Escrow pool for USDC custody and release to gig workers.
    Admin (platform) manages deposits and releases payments based on confirmed deliveries.
    """

    def __init__(self) -> None:
        self.platform = GlobalState(Account)
        self.usdc_asset_id = UInt64(0)
        self.total_deposited = UInt64(0)
        self.total_released = UInt64(0)

    @arc4.abimethod
    def initialize(self, usdc_asset_id: UInt64, mbr_pay: gtxn.PaymentTransaction) -> None:
        """Opt contract into USDC ASA. Creator only."""
        assert Txn.sender == Global.creator_address
        assert self.usdc_asset_id == 0

        assert mbr_pay.receiver == Global.current_application_address
        assert mbr_pay.amount >= 100_000

        self.platform.value = Txn.sender
        self.usdc_asset_id = usdc_asset_id

        itxn.AssetTransfer(
            asset_receiver=Global.current_application_address,
            xfer_asset=Asset(usdc_asset_id),
            asset_amount=0,
            fee=0,
        ).submit()

    @arc4.abimethod
    def deposit_funds(self, payment: gtxn.AssetTransferTransaction, amount: UInt64) -> None:
        """Platform deposits USDC into escrow."""
        assert payment.asset_receiver == Global.current_application_address
        assert payment.xfer_asset == Asset(self.usdc_asset_id)
        assert payment.asset_amount == amount

        self.total_deposited += amount

    @arc4.abimethod
    def release_payment(
        self,
        worker: Account,
        amount: UInt64,
        delivery_id: UInt64,
    ) -> None:
        """Admin releases USDC to worker for a confirmed delivery."""
        assert Txn.sender == self.platform.value

        itxn.AssetTransfer(
            xfer_asset=Asset(self.usdc_asset_id),
            asset_receiver=worker,
            asset_amount=amount,
            fee=0,
        ).submit()

        self.total_released += amount

        key = b"pay_" + worker.bytes + op.itob(delivery_id)
        record = PaymentRecord(
            amount=arc4.UInt64(amount),
            timestamp=arc4.UInt64(Global.latest_timestamp),
            delivery_id=arc4.UInt64(delivery_id),
        )
        op.Box.put(key, record.bytes)

    @arc4.abimethod
    def withdraw_unused(self, amount: UInt64) -> None:
        """Platform withdraws unused USDC. Creator only."""
        assert Txn.sender == Global.creator_address

        itxn.AssetTransfer(
            xfer_asset=Asset(self.usdc_asset_id),
            asset_receiver=Txn.sender,
            asset_amount=amount,
            fee=0,
        ).submit()

    @arc4.abimethod(readonly=True)
    def get_balance(self) -> UInt64:
        """Read USDC balance held by the contract."""
        balance, _exists = op.AssetHoldingGet.asset_balance(
            Global.current_application_address, Asset(self.usdc_asset_id)
        )
        return balance
