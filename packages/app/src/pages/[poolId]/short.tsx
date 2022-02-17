import { useRouter } from 'next/router'
import Underlying from '../../component/Trade/Underlying'

export default function Create() {
  const router = useRouter()
  const { poolId } = router.query
  return <Underlying poolId={poolId as string} />
}
