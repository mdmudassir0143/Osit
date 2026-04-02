import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from '../ConnectWallet'
import { ellipseAddress } from '../../utils/ellipseAddress'

const WalletStatus: React.FC = () => {
  const { activeAddress } = useWallet()
  const [openModal, setOpenModal] = useState(false)

  return (
    <>
      {activeAddress ? (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-mono text-muted">
            <span className="w-1.5 h-1.5 bg-sage rounded-full" />
            {ellipseAddress(activeAddress)}
          </span>
          <button
            className="text-[10px] tracking-wider uppercase text-muted hover:text-charcoal transition-colors"
            onClick={() => setOpenModal(true)}
          >
            Switch
          </button>
        </div>
      ) : (
        <button
          className="bg-terra text-white px-4 py-2 text-sm font-medium hover:bg-terra-dark transition-colors rounded"
          onClick={() => setOpenModal(true)}
        >
          Connect Wallet
        </button>
      )}
      <ConnectWallet openModal={openModal} closeModal={() => setOpenModal(false)} />
    </>
  )
}

export default WalletStatus
