import { useState, useEffect } from 'react';

/**
 * Custom hook to detect viewport breakpoints for adaptive component rendering.
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: >= 768px and < 1024px
 * - Desktop: >= 1024px
 */
export function useDeviceType() {
  const [deviceInfo, setDeviceInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return { deviceType: 'desktop', isMobile: false, isTablet: false, isDesktop: true, width: 1200 };
    }
    const width = window.innerWidth;
    return {
      width,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      deviceType: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
    };
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');

    const updateDevice = () => {
      const width = window.innerWidth;
      const isMobile = mobileQuery.matches;
      const isTablet = tabletQuery.matches;
      const isDesktop = !isMobile && !isTablet;

      setDeviceInfo({
        width,
        isMobile,
        isTablet,
        isDesktop,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
      });
    };

    updateDevice();

    mobileQuery.addEventListener('change', updateDevice);
    tabletQuery.addEventListener('change', updateDevice);
    window.addEventListener('resize', updateDevice);

    return () => {
      mobileQuery.removeEventListener('change', updateDevice);
      tabletQuery.removeEventListener('change', updateDevice);
      window.removeEventListener('resize', updateDevice);
    };
  }, []);

  return deviceInfo;
}

export default useDeviceType;

