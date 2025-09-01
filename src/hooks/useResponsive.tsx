import * as React from "react"

// Enhanced responsive breakpoints
const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  breakpoint: 'mobile' | 'tablet' | 'desktop'
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = React.useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1024,
        breakpoint: 'desktop' as const
      }
    }

    const width = window.innerWidth
    return {
      isMobile: width < MOBILE_BREAKPOINT,
      isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
      isDesktop: width >= TABLET_BREAKPOINT,
      screenWidth: width,
      breakpoint: width < MOBILE_BREAKPOINT ? 'mobile' : 
                 width < TABLET_BREAKPOINT ? 'tablet' : 'desktop'
    }
  })

  React.useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth
      setState({
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= TABLET_BREAKPOINT,
        screenWidth: width,
        breakpoint: width < MOBILE_BREAKPOINT ? 'mobile' : 
                   width < TABLET_BREAKPOINT ? 'tablet' : 'desktop'
      })
    }

    const mediaQueryMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const mediaQueryTablet = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    
    mediaQueryMobile.addEventListener("change", updateState)
    mediaQueryTablet.addEventListener("change", updateState)
    window.addEventListener("resize", updateState)
    
    return () => {
      mediaQueryMobile.removeEventListener("change", updateState)
      mediaQueryTablet.removeEventListener("change", updateState)
      window.removeEventListener("resize", updateState)
    }
  }, [])

  return state
}

// Utility hook for header heights based on responsive state
export function useResponsiveHeaderHeight() {
  const { isMobile, isTablet } = useResponsive()
  
  return React.useMemo(() => {
    if (isMobile) return 'h-12' // 48px
    if (isTablet) return 'h-14' // 56px  
    return 'h-16' // 64px (desktop)
  }, [isMobile, isTablet])
}

// Utility hook for responsive padding
export function useResponsivePadding() {
  const { isMobile, isTablet } = useResponsive()
  
  return React.useMemo(() => {
    if (isMobile) return 'px-3' // 12px
    if (isTablet) return 'px-4' // 16px
    return 'px-6' // 24px (desktop)
  }, [isMobile, isTablet])
}

// Utility hook for responsive text sizing
export function useResponsiveText() {
  const { isMobile, isTablet } = useResponsive()
  
  return React.useMemo(() => ({
    title: isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg',
    body: isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base',
    caption: isMobile ? 'text-xs' : 'text-xs'
  }), [isMobile, isTablet])
}