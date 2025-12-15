import { HashRouter } from 'react-router-dom'
import { AppChrome } from './components/chrome/AppChrome'
import { AppRouter } from './routes/AppRouter'
import { CommandPaletteProvider } from './providers/command/CommandPaletteProvider'
import { PerformanceProvider } from './providers/performance/PerformanceProvider'
import { ThemeProvider } from './providers/theme/ThemeProvider'

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <PerformanceProvider>
          <CommandPaletteProvider>
            <AppChrome>
              <AppRouter />
            </AppChrome>
          </CommandPaletteProvider>
        </PerformanceProvider>
      </ThemeProvider>
    </HashRouter>
  )
}
