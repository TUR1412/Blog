import { HashRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { AppChrome } from './components/chrome/AppChrome'
import { AppRouter } from './routes/AppRouter'
import { CommandPaletteProvider } from './providers/command/CommandPaletteProvider'
import { initPerf } from './lib/perf'

export default function App() {
  useEffect(() => {
    initPerf()
  }, [])

  return (
    <HashRouter>
      <CommandPaletteProvider>
        <AppChrome>
          <AppRouter />
        </AppChrome>
      </CommandPaletteProvider>
    </HashRouter>
  )
}
