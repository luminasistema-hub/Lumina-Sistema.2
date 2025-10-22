import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Church } from '@/stores/churchStore';
import ContractViewDialog from './ContractViewDialog';
import { FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ContractManagementTabProps {
  churches: Church[];
  onUpdateChurch: (churchId: string, updates: Partial<Church>) => Promise<void>;
}

const ContractManagementTab: React.FC<ContractManagementTabProps> = ({ churches, onUpdateChurch }) => {
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);

  const handleOpenContract = (church: Church) => {
    setSelectedChurch(church);
    setIsContractDialogOpen(true);
  };

  const handleIssueContract = async (church: Church) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await onUpdateChurch(church.id, { data_emissao_contrato: today });
      toast.success(`Contrato para ${church.name} emitido com data de hoje.`);
      // Abre o diálogo com a informação atualizada
      handleOpenContract({ ...church, data_emissao_contrato: today });
    } catch (error) {
      toast.error('Falha ao emitir o contrato.');
      console.error(error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Contratos</CardTitle>
          <CardDescription>
            Gere e visualize o contrato de serviço para cada igreja cadastrada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {churches.length > 0 ? (
              churches.map((church) => (
                <div key={church.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{church.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {church.data_emissao_contrato
                        ? `Contrato emitido em: ${new Date(church.data_emissao_contrato + 'T00:00:00').toLocaleDateString('pt-BR')}`
                        : 'Contrato pendente de emissão'}
                    </p>
                  </div>
                  {church.data_emissao_contrato ? (
                    <Button variant="outline" onClick={() => handleOpenContract(church)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Contrato
                    </Button>
                  ) : (
                    <Button variant="default" onClick={() => handleIssueContract(church)}>
                      <Send className="w-4 h-4 mr-2" />
                      Emitir Contrato
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">Nenhuma igreja encontrada.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <ContractViewDialog
        isOpen={isContractDialogOpen}
        onClose={() => setIsContractDialogOpen(false)}
        church={selectedChurch}
        onUpdateChurch={onUpdateChurch}
      />
    </>
  );
};

export default ContractManagementTab;