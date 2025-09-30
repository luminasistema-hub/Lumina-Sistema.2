import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { User, ArrowRight } from 'lucide-react';

interface ProfileCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
}

const ProfileCompletionDialog: React.FC<ProfileCompletionDialogProps> = ({ isOpen, onClose, onNavigateToProfile }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <User className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold">Complete Seu Perfil!</DialogTitle>
          <DialogDescription className="text-base text-gray-700">
            Parece que seu perfil ainda não está completo. Para aproveitar todas as funcionalidades do sistema,
            por favor, preencha suas informações pessoais.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center pt-4">
          <Button onClick={onNavigateToProfile} className="bg-blue-500 hover:bg-blue-600">
            Preencher Meu Perfil
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionDialog;