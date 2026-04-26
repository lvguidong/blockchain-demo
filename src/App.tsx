import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import HashPage from '@/pages/Hash'
import BlockPage from '@/pages/Block'
import BlockchainPage from '@/pages/Blockchain'
import DistributedPage from '@/pages/Distributed'
import TokensPage from '@/pages/Tokens'
import CoinbasePage from '@/pages/Coinbase'
import styles from './App.module.css'

function App() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/hash" replace />} />
          <Route path="/hash" element={<HashPage />} />
          <Route path="/block" element={<BlockPage />} />
          <Route path="/blockchain" element={<BlockchainPage />} />
          <Route path="/distributed" element={<DistributedPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/coinbase" element={<CoinbasePage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
