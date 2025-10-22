import { Lock } from 'lucide-react';

interface LockedEtapaOverlayProps {
  reason: string | null;
}

const LockedEtapaOverlay = ({ reason }: LockedEtapaOverlayProps) => {
  return (
    <div className="absolute inset-0 bg-gray-300 bg-opacity-60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-lg z-10">
      <Lock className="w-10 h-10 text-gray-600 mb-3" />
      <h4 className="font-bold text-gray-800 text-lg">Etapa Bloqueada</h4>
      <p className="text-gray-600 text-sm">{reason || 'Complete os pré-requisitos para continuar.'}</p>
    </div>
  );
};

export default LockedEtapaOverlay;