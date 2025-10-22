import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Church } from '@/stores/churchStore';
import ContractViewDialog from './ContractViewDialog';
import { FileText } from 'lucide-react';

interface ContractManagementTabProps {
  churches: Church[];
}

const ContractManagementTab: React.FC<ContractManagementTabProps> = ({ churches }) => {
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);

  const handleOpenContract = (church: Church) => {
    setSelectedChurch(church);
    setIsContractDialogOpen(true);
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
                    <p className="text-sm text-muted-foreground">Plano: {church.subscriptionPlanName}</p>
                  </div>
                  <Button variant="outline" onClick={() => handleOpenContract(church)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Contrato
                  </Button>
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
      />
    </>
  );
};

export default ContractManagementTab;