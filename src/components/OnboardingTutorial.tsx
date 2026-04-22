import { useState } from 'react'

interface Props {
  onComplete: () => void
}

interface Slide {
  icon: React.ReactNode
  title: string
  subtitle?: string
  bullets: string[]
  signoff?: string
  finishLabel?: string
}

const slides: Slide[] = [
  {
    icon: <ClapperIcon />,
    title: 'writer/director',
    subtitle: 'a tool for writer/directors to go from idea to first draft\nby gia elliot',
    bullets: [
      'This is a space to outline your project and get a working first draft of all your scenes.',
      'Each scene is set up to go through 3 drafts to get you to a first pass.',
      'When you\'re ready, compile the whole script and export to Final Draft or PDF.',
      'Saves automatically, open from any browser to access your projects.',
    ],
  },
  {
    icon: <ListIcon />,
    title: 'Scenes Outline',
    bullets: [
      'Start by creating an outline of all your scenes. If you use physical index cards, you can start there and then transcribe them here.',
      'Add descriptions of the plot and point of each scene.',
      'Drag scenes to reorder them seamlessly at any time.',
      'Filter by Character view to follow any character\'s arc across scenes.',
    ],
  },
  {
    icon: <CirclePlayIcon />,
    title: 'Inside a Scene',
    bullets: [
      'Click into any scene to open it.',
      'Add the main characters in the scene.',
      'Customize each character\'s pill color to keep things visual.',
      'Get ready to outline the internal emotional arc of each character, one at a time.',
    ],
  },
  {
    icon: <HeartIcon />,
    title: 'The Emotional Outline',
    bullets: [
      'Draft the inner emotional life that will give your scenes lift.',
      'Map what each character insanely wants — and what they actually get.',
      'Define the scene they think they\'re in, and the moment they realize they\'re wrong.',
      'Lay out the setting, the plot, and where the character lands.',
      'When all fields are complete, the arrow unlocks your first pass.',
    ],
  },
  {
    icon: <SpotlightIcon />,
    title: 'Community Theater',
    subtitle: 'Everyone says exactly what they mean.',
    bullets: [
      'Draft the first pass of your scene as if writing for community theater.',
      'Have every character say exactly what they mean, out loud.',
      'Reference the emotional outline by character on the left side of the screen.',
      'It should be full of spit-takes — on the nose and a little funny. That\'s the point.',
    ],
  },
  {
    icon: <MaskIcon />,
    title: 'Liar\'s Pass',
    subtitle: 'Nobody says what they really mean.',
    bullets: [
      'Reference your Community Theater pass and emotional outline on the left.',
      'Rewrite the scene so the characters never say exactly what they mean.',
      'Bring them to life — marry the plot, dialogue, and emotional outline.',
      'This is your real first draft.',
    ],
  },
  {
    icon: <CheckIcon />,
    title: 'Compiling Your First Draft',
    bullets: [
      'Toggle back to your scene list at any time.',
      'Rearrange scenes freely — drag and drop whenever you\'re ready.',
      'Compile and export to Final Draft or PDF when you\'re ready to work on the script as a whole.',
    ],
    signoff: 'I hope you enjoy going from outlining → first draft!\nLove,\nGia',
    finishLabel: 'I\'m ready',
  },
]

export default function OnboardingTutorial({ onComplete }: Props) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)

  const isFirst = current === 0
  const isLast = current === slides.length - 1
  const slide = slides[current]

  function go(next: number, dir: 'forward' | 'back') {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrent(next)
      setAnimating(false)
    }, 220)
  }

  function handleNext() {
    if (isLast) { onComplete(); return }
    go(current + 1, 'forward')
  }

  function handleBack() {
    if (isFirst) return
    go(current - 1, 'back')
  }

  const slideStyle: React.CSSProperties = {
    transform: animating
      ? direction === 'forward' ? 'translateX(-32px)' : 'translateX(32px)'
      : 'translateX(0)',
    opacity: animating ? 0 : 1,
    transition: 'transform 220ms ease, opacity 220ms ease',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 text-sm transition-colors z-10"
        >
          Skip
        </button>

        {/* Slide content */}
        <div className="flex-1 px-8 pt-10 pb-6" style={slideStyle}>
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6 text-zinc-300">
            {slide.icon}
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-zinc-100 mb-1">
            {slide.title}
          </h2>

          {/* Subtitle */}
          {slide.subtitle && (
            <p className="text-sm text-zinc-400 mb-5 whitespace-pre-line">{slide.subtitle}</p>
          )}

          {/* Bullets */}
          <ul className="space-y-3">
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0" />
                <span className="text-sm text-zinc-300 leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          {/* Sign-off */}
          {slide.signoff && (
            <p className="mt-6 text-sm text-zinc-500 leading-relaxed whitespace-pre-line">
              {slide.signoff}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-zinc-800 flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > current ? 'forward' : 'back')}
                className="focus:outline-none"
                aria-label={`Go to slide ${i + 1}`}
              >
                <div
                  className={`rounded-full transition-all duration-200 ${
                    i === current
                      ? 'w-4 h-1.5 bg-zinc-300'
                      : i < current
                      ? 'w-1.5 h-1.5 bg-zinc-500'
                      : 'w-1.5 h-1.5 bg-zinc-700'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white transition-colors"
            >
              {isLast ? (slide.finishLabel ?? 'Get Started') : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClapperIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h16a2 2 0 0 1 2 2v4H2V4a2 2 0 0 1 2-2z" />
      <path d="M2 8h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
      <line x1="2" y1="8" x2="22" y2="8" />
      <line x1="7" y1="2" x2="7" y2="8" />
      <line x1="12" y1="2" x2="12" y2="8" />
      <line x1="17" y1="2" x2="17" y2="8" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CirclePlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}


function SpotlightIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function MaskIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7c0 0 1-1 3-1s4 2 6 2 4-2 6-2 3 1 3 1v8c0 0-1 2-3 2-1.5 0-3-1-5-1s-3.5 1-5 1c-2 0-3-2-3-2V7z" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M9.5 15.5c.5.5 1.5 1 2.5 1s2-.5 2.5-1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
