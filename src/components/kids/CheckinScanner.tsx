import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { Loader2, VideoOff } from 'lucide-react';

interface CheckinScannerProps {
  onScan: (data: string) => void;
  isProcessing: boolean;
}

const CheckinScanner: React.FC<CheckinScannerProps> = ({ onScan, isProcessing }) => {
  const [error, setError] = useState<string | null>(null);

  const handleScan = (data: { text: string } | null) => {
    if (data && !isProcessing) {
      onScan(data.text);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setError('A permissão para acessar a câmera foi negada. Por favor, habilite nas configurações do seu navegador.');
    } else {
      setError('Não foi possível acessar a câmera. Verifique se ela não está sendo usada por outro aplicativo.');
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
      {isProcessing && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
          <p className="text-white mt-4">Processando...</p>
        </div>
      )}
      {error ? (
        <div className="p-4 text-center text-red-400">
          <VideoOff className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold">Erro na Câmera</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <QrScanner
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: '100%', height: '100%' }}
          constraints={{ video: { facingMode: 'environment' } }}
        />
      )}
      <div className="absolute inset-0 border-4 border-white/50 rounded-lg pointer-events-none" />
    </div>
  );
};

export default CheckinScanner;