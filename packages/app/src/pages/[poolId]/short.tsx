import { useRouter } from 'next/router'
import Underlying from '../../component/Trade/Underlying'

export function getInitialProps() {
  return { props: {} }
}

export default function Short() {
  const router = useRouter()
  const { poolId } = router.query
  console.log({ poolId })
  return <Underlying poolId={poolId as string} />
}
