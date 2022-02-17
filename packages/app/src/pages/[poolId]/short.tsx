import { useRouter } from 'next/router'
import Underlying from '../../component/Trade/Underlying'

export default function Short() {
  const router = useRouter()
  const { poolId } = router.query
  return typeof window !== 'undefined' ? (
    <Underlying poolId={poolId as string} />
  ) : null
}
