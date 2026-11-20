import React from 'react';
import DesktopHeader from './desktop/header/Header';
import MobileHeader from './mobile/header/Header';
import { useDeviceType } from '../hooks/useDeviceType';

export { DesktopHeader, MobileHeader };

/**
 * Adaptive Header:
 * Renders DesktopHeader for desktop / tablet and MobileHeader for mobile screens.
 */
export function Header({ mode = 'auto', ...props }) {
  const { isMobile } = useDeviceType();
  const showMobile = mode === 'mobile' || (mode === 'auto' && isMobile);

  return showMobile ? <MobileHeader {...props} /> : <DesktopHeader {...props} />;
}

export default Header;
