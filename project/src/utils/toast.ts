// Simple toast utility that doesn't rely on React hooks
// This can be used in non-component contexts

interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

// Create a simple toast function that uses the browser's native alert
// In a real app, you would use a more sophisticated toast library
export const toast = (options: ToastOptions) => {
  const { type, title, message } = options;
  
  // In development, just log to console
  console.log(`[TOAST] ${type.toUpperCase()}: ${title} - ${message}`);
  
  // For a real implementation, you would show a proper toast notification
  // This is just a placeholder that doesn't rely on React hooks
  
  // You could also dispatch a custom event that a React component listens for
  const event = new CustomEvent('show-toast', { 
    detail: options 
  });
  
  document.dispatchEvent(event);
};
