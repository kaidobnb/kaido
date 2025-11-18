// This script prevents conflicts with Ethereum wallet extensions
(function() {
  // Check if ethereum is already defined as a getter
  const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
  
  // If ethereum is not defined or is not a getter, we don't need to do anything
  if (!descriptor || !descriptor.get) return;
  
  // Create a variable to store the ethereum provider
  let ethereumProvider = undefined;
  
  // Override the getter to return our stored provider
  Object.defineProperty(window, 'ethereum', {
    configurable: true,
    enumerable: true,
    get: function() {
      return ethereumProvider;
    },
    // Add a setter that stores the provider instead of trying to set it directly
    set: function(value) {
      ethereumProvider = value;
    }
  });
  
  console.log('Ethereum provider fix applied');
})();
