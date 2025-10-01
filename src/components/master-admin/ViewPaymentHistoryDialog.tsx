import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Church, PaymentRecord } from '../../stores/churchStore';
import { Plus, X, History, DollarSign, Calendar, CheckCircle, Clock, AlertTriangle, Edit, Trash2, Loader2, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos

interface ViewPaymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  church: Church | null;
  onUpdateChurch: (churchId: string, updates: Partial<Church>) => Promise<void>;
  currentUserEmail: string;
}

const ViewPaymentHistoryDialog: React.FC<ViewPaymentHistoryDialogProps> = ({ isOpen, onClose, church, onUpdateChurch, currentUserEmail }) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [isEditPaymentDialogOpen, setIsEditPaymentDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentRecord | null>(null);
  const [newPaymentForm, setNewPaymentForm] = useState({
    data: new Date().toISOString().split('T')[0],
    valor: 0,
    status: 'Pago' as PaymentRecord['status'],
    metodo: 'PIX',
    referencia: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (church) {
      setPaymentHistory(church.historico_pagamentos || []);
    }
  }, [church]);

  const handleAddPayment = async () => {
    if (!church?.id || newPaymentForm.valor <= 0 || !newPaymentForm.data || !newPaymentForm.status || !newPaymentForm.metodo) {
      toast.error('Preencha todos os campos obrigatórios para o pagamento.');
      return;
    }
    setIsLoading(true);
    try {
      const newRecord: PaymentRecord = {
        id: uuidv4(),
        ...newPaymentForm,
        valor: parseFloat(newPaymentForm.valor.toFixed(2)),
        registrado_por: currentUserEmail,
      };
      const updatedHistory = [...paymentHistory, newRecord].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      // Atualizar status do último pagamento e data do próximo pagamento se o novo for o mais recente e pago
      let updatedChurchStatus: Partial<Church> = { historico_pagamentos: updatedHistory };
      if (newRecord.status === 'Pago' && new Date(newRecord.data) >= new Date(church.data_proximo_pagamento || '1970-01-01')) {
        updatedChurchStatus.ultimo_pagamento_status = 'Pago';
        const nextMonth = new Date(newRecord.data);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        updatedChurchStatus.data_proximo_pagamento = nextMonth.toISOString().split('T')[0];
      } else if (newRecord.status === 'Atrasado' || newRecord.status === 'Pendente') {
        updatedChurchStatus.ultimo_pagamento_status = newRecord.status;
      }

      await onUpdateChurch(church.id, updatedChurchStatus);
      toast.success('Pagamento registrado com sucesso!');
      setIsAddPaymentDialogOpen(false);
      setNewPaymentForm({
        data: new Date().toISOString().split('T')[0],
        valor: 0,
        status: 'Pago',
        metodo: 'PIX',
        referencia: '',
      });
    } catch (error) {
      console.error('Failed to add payment:', error);
      toast.error('Erro ao registrar pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPayment = async () => {
    if (!church?.id || !paymentToEdit?.id || newPaymentForm.valor <= 0 || !newPaymentForm.data || !newPaymentForm.status || !newPaymentForm.metodo) {
      toast.error('Preencha todos os campos obrigatórios para editar o pagamento.');
      return;
    }
    setIsLoading(true);
    try {
      const updatedHistory = paymentHistory.map(p =>
        p.id === paymentToEdit.id
          ? {
              ...p,
              ...newPaymentForm,
              valor: parseFloat(newPaymentForm.valor.toFixed(2)),
              registrado_por: currentUserEmail, // Atualiza quem editou
            }
          : p
      ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      // Reavaliar status do último pagamento e data do próximo pagamento
      let updatedChurchStatus: Partial<Church> = { historico_pagamentos: updatedHistory };
      const latestPayment = updatedHistory[0]; // O pagamento mais recente após a ordenação
      if (latestPayment) {
        updatedChurchStatus.ultimo_pagamento_status = latestPayment.status;
        if (latestPayment.status === 'Pago') {
          const nextMonth = new Date(latestPayment.data);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          updatedChurchStatus.data_proximo_pagamento = nextMonth.toISOString().split('T')[0];
        }
      }

      await onUpdateChurch(church.id, updatedChurchStatus);
      toast.success('Pagamento atualizado com sucesso!');
      setIsEditPaymentDialogOpen(false);
      setPaymentToEdit(null);
      setNewPaymentForm({
        data: new Date().toISOString().split('T')[0],
        valor: 0,
        status: 'Pago',
        metodo: 'PIX',
        referencia: '',
      });
    } catch (error) {
      console.error('Failed to edit payment:', error);
      toast.error('Erro ao atualizar pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!church?.id || !confirm('Tem certeza que deseja excluir este registro de pagamento?')) return;
    setIsLoading(true);
    try {
      const updatedHistory = paymentHistory.filter(p => p.id !== paymentId);
      
      // Reavaliar status do último pagamento e data do próximo pagamento
      let updatedChurchStatus: Partial<Church> = { historico_pagamentos: updatedHistory };
      const latestPayment = updatedHistory[0]; // O pagamento mais recente após a exclusão
      if (latestPayment) {
        updatedChurchStatus.ultimo_pagamento_status = latestPayment.status;
        if (latestPayment.status === 'Pago') {
          const nextMonth = new Date(latestPayment.data);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          updatedChurchStatus.data_proximo_pagamento = nextMonth.toISOString().split('T')[0];
        }
      } else {
        updatedChurchStatus.ultimo_pagamento_status = 'N/A';
        updatedChurchStatus.data_proximo_pagamento = undefined;
      }

      await onUpdateChurch(church.id, updatedChurchStatus);
      toast.success('Registro de pagamento excluído!');
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast.error('Erro ao excluir registro de pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'Pago': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Pago</Badge>;
      case 'Pendente': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'Atrasado': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Atrasado</Badge>;
      case 'Cancelado': return <Badge className="bg-gray-100 text-gray-800"><X className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'PIX': return <img src="/placeholder.svg" alt="PIX" className="w-4 h-4 mr-1" />; // Substituir por ícone real
      case 'Cartão': return <img src="/placeholder.svg" alt="Cartão" className="w-4 h-4 mr-1" />; // Substituir por ícone real
      case 'Dinheiro': return <img src="/placeholder.svg" alt="Dinheiro" className="w-4 h-4 mr-1" />; // Substituir por ícone real
      case 'Transferência': return <img src="/placeholder.svg" alt="Transferência" className="w-4 h-4 mr-1" />; // Substituir por ícone real
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Histórico de Pagamentos - {church?.name}
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie os pagamentos de assinatura desta igreja.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddPaymentDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Novo Pagamento
            </Button>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum registro de pagamento encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map(record => (
                <Card key={record.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{new Date(record.data).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="font-bold text-lg">R$ {record.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(record.metodo)}
                        <span className="text-sm text-gray-700">{record.metodo}</span>
                      </div>
                      <div className="md:col-span-3 flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        {record.referencia && <span className="text-xs text-gray-500">Ref: {record.referencia}</span>}
                        <span className="text-xs text-gray-500 ml-auto">Registrado por: {record.registrado_por}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setPaymentToEdit(record);
                          setNewPaymentForm({
                            data: record.data,
                            valor: record.valor,
                            status: record.status,
                            metodo: record.metodo,
                            referencia: record.referencia || '',
                          });
                          setIsEditPaymentDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeletePayment(record.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Novo Pagamento</DialogTitle>
            <DialogDescription>
              Adicione um novo registro de pagamento para {church?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payment-date">Data do Pagamento *</Label>
              <Input
                id="payment-date"
                type="date"
                value={newPaymentForm.data}
                onChange={(e) => setNewPaymentForm({...newPaymentForm, data: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-value">Valor (R$) *</Label>
              <Input
                id="payment-value"
                type="number"
                step="0.01"
                value={newPaymentForm.valor || ''}
                onChange={(e) => setNewPaymentForm({...newPaymentForm, valor: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-status">Status *</Label>
              <Select
                value={newPaymentForm.status}
                onValueChange={(value) => setNewPaymentForm({...newPaymentForm, status: value as PaymentRecord['status']})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de Pagamento *</Label>
              <Select
                value={newPaymentForm.metodo}
                onValueChange={(value) => setNewPaymentForm({...newPaymentForm, metodo: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-reference">Referência (Opcional)</Label>
              <Input
                id="payment-reference"
                value={newPaymentForm.referencia}
                onChange={(e) => setNewPaymentForm({...newPaymentForm, referencia: e.target.value})}
                placeholder="Número da transação, etc."
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAddPayment} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditPaymentDialogOpen} onOpenChange={setIsEditPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
            <DialogDescription>
              Edite os detalhes do registro de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-payment-date">Data do Pagamento *</Label>
              <Input
                id="edit-payment-date"
                type="date"
                value={newPaymentForm.data}
                onChange={(e) => setNewPaymentForm({...newPaymentForm, data: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-value">Valor (R$) *</Label>
              <Input
                id="edit-payment-value"
                type="number"
                step="0.01"
                value={newPaymentForm.valor || ''}
                onChange={(e) => setNewPaymentForm({...newPaymentForm, valor: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-status">Status *</Label>
              <Select
                value={newPaymentForm.status}
                onValueChange={(value) => setNewPaymentForm({...newPaymentForm, status: value as PaymentRecord['status']})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-method">Método de Pagamento *</Label>
              <Select
                value={newPaymentForm.metodo}
                onValueChange={(value) => setNewPaymentForm({...newPaymentForm, metodo: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-reference">Referência (Opcional)</Label>
              <Input
                id="edit-payment-reference"
                value={newPaymentForm.referencia}
                onChange={(e) => setNewPaymentForm({...newPaymentForm, referencia: e.target.value})}
                placeholder="Número da transação, etc."
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditPaymentDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleEditPayment} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ViewPaymentHistoryDialog;