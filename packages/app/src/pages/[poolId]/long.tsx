import { useRouter } from 'next/router'
import Underlying from '../../component/Trade/Underlying'

export default function Long() {
  const router = useRouter()
  const { poolId } = router.query
  console.log(typeof window !== 'undefined')
  return typeof window !== 'undefined' ? (
    <Underlying isLong poolId={poolId as string} />
  ) : (
    'No'
  )
  // return typeof window !== 'undefined' ? (
  //   <Underlying isLong poolId={poolId as string} />
  // ) : null
}
