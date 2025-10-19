import { useEffect, useState } from 'react'

const apiBase = import.meta.env.VITE_SUB_API_URL || (typeof __SUB_API__ !== 'undefined' ? __SUB_API__ : 'http://localhost:3000')

export default function App() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const endpoint = `${apiBase}/api/dashboard`
        const start = performance.now()
        console.groupCollapsed('Admin-App Fetch')
        console.log('Endpoint:', endpoint)
        console.log('Navigator online:', navigator.onLine)
        const res = await fetch(endpoint, {
          method: 'GET',
          mode: 'cors',
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        })
        const elapsed = (performance.now() - start).toFixed(2)
        console.log('Status:', res.status, res.statusText)
        console.log('Tempo (ms):', elapsed)
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          console.error('Resposta não OK. Corpo:', text)
          throw new Error(`Erro API: ${res.status}`)
        }
        const data = await res.json()
        console.log('Payload recebido:', data)
        console.groupEnd()
        setStats(data.stats)
      } catch (e) {
        console.group('Admin-App Fetch Error')
        console.error('Erro no fetch:', e)
        console.log('Tipo:', e?.name)
        console.log('Mensagem:', e?.message)
        console.log('Causa:', e?.cause)
        console.log('UserAgent:', navigator.userAgent)
        console.log('Network type:', navigator.connection?.effectiveType)
        console.groupEnd()
        setError(e.message || 'Falha ao buscar dados')
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <h1 className="text-2xl font-bold mb-4">Admin JournalScope</h1>
      <p className="mb-2 text-sm">Backend: {apiBase}</p>
      {error && <div className="text-red-600">{error}</div>}
      {stats ? (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="border rounded p-4">
              <div className="text-sm text-gray-600">{key}</div>
              <div className="text-xl font-semibold">{value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>Carregando...</div>
      )}
    </div>
  )
}