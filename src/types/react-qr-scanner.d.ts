declare module 'react-qr-scanner' {
  import * as React from 'react';

  interface QrScannerProps {
    delay?: number;
    onError?: (error: any) => void;
    onScan?: (data: { text: string } | null) => void;
    style?: React.CSSProperties;
    constraints?: MediaStreamConstraints;
    className?: string;
    facing?: 'user' | 'environment';
    legacyMode?: boolean;
    maxImageSize?: number;
    onLoad?: (data: any) => void;
    showViewFinder?: boolean;
  }

  class QrScanner extends React.Component<QrScannerProps> {}

  export default QrScanner;
}