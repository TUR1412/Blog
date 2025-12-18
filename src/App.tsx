import { HashRouter } from 'react-router-dom'
import { AppChrome } from './components/chrome/AppChrome'
import { AppRouter } from './routes/AppRouter'
import { CommandPaletteProvider } from './providers/command/CommandPaletteProvider'

export default function App() {
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
