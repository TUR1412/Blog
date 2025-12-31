import { HashRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { AppChrome } from './components/chrome/AppChrome'
import { AppRouter } from './routes/AppRouter'
import { CommandPaletteProvider } from './providers/command/CommandPaletteProvider'
import { OverlayProvider } from './providers/overlay/OverlayProvider'
import { ThemeProvider } from './providers/theme/ThemeProvider'
import { initPerf } from './lib/perf'

export default function App() {
  useEffect(() => {
    initPerf()
  }, [])

  return (
    <HashRouter>
      <ThemeProvider>
        <OverlayProvider>
          <CommandPaletteProvider>
            <AppChrome>
              <AppRouter />
            </AppChrome>
          </CommandPaletteProvider>
        </OverlayProvider>
      </ThemeProvider>
    </HashRouter>
  )
}
