import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 *
 * This component scrolls the window to the top whenever the route changes.
 * It should be placed inside the Router component in App.tsx.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when the route changes
    // Using requestAnimationFrame to ensure the scroll happens after the DOM update
    window.requestAnimationFrame(() => {
      // Using smooth scrolling for a better user experience
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Using 'instant' instead of 'smooth' to avoid visible scrolling
      });
    });
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
