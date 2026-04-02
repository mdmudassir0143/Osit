import React from 'react'
import { useSnackbar } from 'notistack'

export function useTransactionToast() {
  const { enqueueSnackbar } = useSnackbar()

  const showSuccess = (txId: string) => {
    enqueueSnackbar(`Transaction confirmed: ${txId.slice(0, 8)}...`, {
      variant: 'success',
      autoHideDuration: 5000,
    })
  }

  const showError = (message: string) => {
    enqueueSnackbar(`Error: ${message}`, {
      variant: 'error',
      autoHideDuration: 5000,
    })
  }

  const showInfo = (message: string) => {
    enqueueSnackbar(message, {
      variant: 'info',
      autoHideDuration: 3000,
    })
  }

  return { showSuccess, showError, showInfo }
}
