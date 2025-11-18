import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for handling navigation in the application
 * This provides a consistent way to navigate and helps with debugging
 */
export const useNavigation = () => {
  const navigate = useNavigate();

  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    console.log(`Navigating to: ${path}`);

    // Scroll to top immediately for better UX
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    // Use the navigate function from react-router-dom
    navigate(path, options);
  }, [navigate]);

  return {
    navigateTo
  };
};
