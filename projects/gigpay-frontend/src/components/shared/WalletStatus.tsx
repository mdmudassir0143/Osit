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
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-mono border border-charcoal/15 rounded-lg px-3 py-1.5 bg-cream">
            <span className="w-2 h-2 bg-sage rounded-full" />
            {ellipseAddress(activeAddress)}
          </span>
          <button
            className="nb-btn-ghost !py-1.5 !px-3 !text-[12px]"
            onClick={() => setOpenModal(true)}
          >
            Switch
          </button>
        </div>
      ) : (
        <button
          className="nb-btn bg-terra text-white px-5 py-2 text-sm font-display font-bold"
          onClick={() => setOpenModal(true)}
        >
          Connect
        </button>
      )}
      <ConnectWallet openModal={openModal} closeModal={() => setOpenModal(false)} />
    </>
  )
}

export default WalletStatus
