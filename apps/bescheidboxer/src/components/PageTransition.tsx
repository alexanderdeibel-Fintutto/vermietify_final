import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionState, setTransitionState] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionState('exit')
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionState('enter')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [location, displayLocation])

  return (
    <div
      className={`transition-all duration-150 ease-in-out ${
        transitionState === 'enter'
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-1'
      }`}
    >
      {children}
    </div>
  )
}
