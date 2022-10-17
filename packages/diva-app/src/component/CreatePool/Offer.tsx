import { useCreatePoolFormik } from './formik'
import { useQuery } from 'react-query'
import { config } from '../../constants'
import { queryTestUser } from '../../lib/queries'
import { request } from 'https'
import axios from 'axios'

export function Offer() {
  const offerHash = window.location.pathname.split('/')[2]
  const jsonResponse = useQuery(`json-${offerHash}`, async () => {
    // const response = request(
    //   'https://diva-protocol.herokuapp.com/offers/' + offerHash,
    //   (res) => {
    //     if (res != null) {
    //       return res
    //     } else {
    //       return {}
    //     }
    //   }
    // )
    const response = await fetch(
      'https://diva-protocol.herokuapp.com/offers/' + offerHash,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    )
    return response
  })
  console.log(jsonResponse)
  return (
    <div>
      <h1>Offer</h1>
    </div>
  )
}
