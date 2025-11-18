interface Window {
  appkit?: any;
  appkitDebug?: {
    checkAppkit: () => boolean;
    openSendView: () => void;
    openAccountView: () => void;
    openSendWithRecipient: (address?: string, amount?: string) => void;
    enableSendFunctionality: () => void;
    getAppkitVersion: () => string;
  };
}
