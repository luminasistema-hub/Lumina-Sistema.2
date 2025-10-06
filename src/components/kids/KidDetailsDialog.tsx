import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone, Shield, Heart, AlertTriangle, Clock, QrCode, MapPin, Baby } from 'lucide-react';
import type { Kid } from '@/hooks/useKidsData';

interface KidDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  kid: Kid;
}

const KidDetailsDialog: React.FC<KidDetailsDialogProps> = ({ open, onClose, kid }) => {
  const getAgeGroup = (idade: number) => {
    if (idade <= 3) return 'Berçário';
    if (idade <= 6) return 'Infantil';
    if (idade <= 10) return 'Juniores';
    return 'Pré-adolescentes';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-pink-500" />
            {kid.nome_crianca}
          </DialogTitle>
          <DialogDescription>
            Detalhes e informações de segurança da criança.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{getAgeGroup(kid.idade)} • {kid.idade} anos</Badge>
            {kid.status_checkin === 'Presente' && (
              <Badge className="bg-green-100 text-green-800">Presente</Badge>
            )}
            {kid.codigo_seguranca && (
              <Badge variant="outline" className="flex items-center gap-1">
                <QrCode className="w-3 h-3" /> {kid.codigo_seguranca}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{kid.responsavel_nome || 'Responsável desconhecido'}</span>
            </div>
            {kid.email_responsavel && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{kid.email_responsavel}</span>
              </div>
            )}
            {kid.contato_emergencia?.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{kid.contato_emergencia.telefone}</span>
              </div>
            )}
            {kid.ultimo_checkin && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Último check-in: {new Date(kid.ultimo_checkin).toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>

          {(kid.alergias || kid.medicamentos || kid.informacoes_especiais) && (
            <div className="space-y-2">
              {kid.alergias && (
                <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-red-800">Alergias:</span>
                    <span className="text-sm text-red-700 ml-1">{kid.alergias}</span>
                  </div>
                </div>
              )}
              {kid.medicamentos && (
                <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                  <Shield className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-yellow-800">Medicamentos:</span>
                    <span className="text-sm text-yellow-700 ml-1">{kid.medicamentos}</span>
                  </div>
                </div>
              )}
              {kid.informacoes_especiais && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                  <Heart className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-blue-800">Informações especiais:</span>
                    <span className="text-sm text-blue-700 ml-1">{kid.informacoes_especiais}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {kid.contato_emergencia && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Contato de emergência</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{kid.contato_emergencia.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{kid.contato_emergencia.telefone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{kid.contato_emergencia.parentesco || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KidDetailsDialog;