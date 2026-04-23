import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed bottom-5 right-5 z-50 h-8 px-3 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors shadow-lg tracking-wide"
    >
      {theme === 'dark' ? 'light mode' : 'dark mode'}
    </button>
  )
}
