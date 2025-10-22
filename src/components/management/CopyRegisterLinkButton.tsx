import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link as LinkIcon } from 'lucide-react';

interface Props {
  churchId: string;
  label?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
}

const CopyRegisterLinkButton: React.FC<Props> = ({
  churchId,
  label = 'Copiar link de cadastro',
  size = 'sm',
  variant = 'outline',
}) => {
  const handleCopy = async () => {
    const url = `${window.location.origin}/register/${churchId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link de cadastro copiado!');
  };

  return (
    <Button size={size} variant={variant} onClick={handleCopy}>
      <LinkIcon className="w-4 h-4 mr-1" />
      {label}
    </Button>
  );
};

export default CopyRegisterLinkButton;