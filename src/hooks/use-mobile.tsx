import * as React from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const orientationMql = window.matchMedia('(orientation: portrait)')
    const update = () => {
      const isPortrait = orientationMql.matches
      const breakpoint = isPortrait ? 1024 : 768
      setIsMobile(window.innerWidth < breakpoint)
    }
    window.addEventListener('resize', update)
    orientationMql.addEventListener('change', update)
    update()
    return () => {
      window.removeEventListener('resize', update)
      orientationMql.removeEventListener('change', update)
    }
  }, [])

  return !!isMobile
}