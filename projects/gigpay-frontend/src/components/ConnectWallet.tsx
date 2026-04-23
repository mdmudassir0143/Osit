import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  if (!openModal) return null

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-6" onClick={closeModal}>
      <div
        className="nb-card bg-white p-8 max-w-md w-full shadow-brutal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-bold text-charcoal">Connect Wallet</h3>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center border-2 border-charcoal rounded-lg hover:bg-charcoal hover:text-white transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {activeAddress && (
          <>
            <Account />
            <div className="divider-line my-5" />
          </>
        )}

        {!activeAddress && (
          <div className="space-y-3">
            {wallets?.map((wallet) => (
              <button
                data-test-id={`${wallet.id}-connect`}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-2 border-charcoal rounded-lg font-display font-semibold text-sm text-charcoal hover:bg-charcoal hover:text-white transition-all hover:shadow-brutal-sm"
                key={`provider-${wallet.id}`}
                onClick={() => wallet.connect()}
              >
                {!isKmd(wallet) && (
                  <img
                    alt={`wallet_icon_${wallet.id}`}
                    src={wallet.metadata.icon}
                    className="w-7 h-7 object-contain"
                  />
                )}
                <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6 pt-5 border-t-2 border-charcoal/10">
          {activeAddress && (
            <button
              className="nb-btn-ghost flex-1 !border-terra !text-terra hover:!bg-terra hover:!text-white"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                }
              }}
            >
              Logout
            </button>
          )}
          <button
            data-test-id="close-wallet-modal"
            className="nb-btn-ghost flex-1"
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
export default ConnectWallet
