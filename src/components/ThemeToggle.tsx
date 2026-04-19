import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base hover:bg-zinc-700 transition-colors shadow-lg"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
