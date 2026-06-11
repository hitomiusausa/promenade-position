import { LocaleProvider, useI18n } from './i18n'
import { useHashRoute } from './router'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { DanceList } from './pages/DanceList'
import { FigureList } from './pages/FigureList'
import { FigureDetail } from './pages/FigureDetail'

function Shell() {
  const { dict } = useI18n()
  const route = useHashRoute()
  return (
    <>
      <header className="app-header">
        <a href="#/" className="app-title">💃 {dict.ui.appName}</a>
        <LanguageSwitcher />
      </header>
      <main>
        {route.page === 'dances' && <DanceList />}
        {route.page === 'figures' && <FigureList dance={route.dance} />}
        {route.page === 'figure' && <FigureDetail dance={route.dance} figureId={route.figureId} />}
      </main>
    </>
  )
}

export default function App() {
  return (
    <LocaleProvider>
      <Shell />
    </LocaleProvider>
  )
}
