import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { injected } from '../Util/connectors'

export function useInitialConnect() {
  const web3Connect = useWeb3React()
  const [tried, setTried] = useState(false)

  useEffect(() => {
    const connect = async () => {
      const isAuthorized = await injected.isAuthorized()
      if (isAuthorized) {
        await web3Connect.activate(
          injected,
          (error) => {
            web3Connect.setError(error)
            setTried(true)
          },
          false
        )
      } else {
        setTried(true)
      }
    }
    connect()
  }, [web3Connect.activate])
  useEffect(() => {
    if (!tried && web3Connect.active) {
      setTried(true)
    }
  }, [tried, web3Connect.active])

  return tried
}
