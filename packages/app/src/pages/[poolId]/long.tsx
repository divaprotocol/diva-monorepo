import { useRouter } from 'next/router'
import Underlying from '../../component/Trade/Underlying'

export function getInitialProps() {
  return { props: {} }
}

export default function Lon() {
  const router = useRouter()
  const { poolId } = router.query
  return <Underlying isLong poolId={poolId as string} />
}
