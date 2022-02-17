import React from 'react'
import Head from 'next/head'
import Markets from '../component/Markets/Markets'

export default () => {
  return (
    <>
      <Head>
        <title>Diva Protocol</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Markets />
    </>
  )
}
