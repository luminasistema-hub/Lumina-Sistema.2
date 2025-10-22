import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Church } from '@/stores/churchStore';
import { ScrollArea } from '../ui/scroll-area';
import { Printer } from 'lucide-react';

interface ContractViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  church: Church | null;
}

const ContractViewDialog: React.FC<ContractViewDialogProps> = ({ isOpen, onClose, church }) => {
  if (!church) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('contract-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Recarrega para restaurar os scripts e o estado
    }
  };

  const luminaData = {
    razaoSocial: "LUMINA SISTEMA DE GESTÃO INOVA SIMPLES (I.S.)",
    cnpj: "49.023.921/0001-69",
    endereco: "Rua dos Ben-te-vis QD 45 LT 06 Casa 3, JD Europa, Araguaína-TO",
    email: "contato@luminasistema.com.br",
    telefone: "63984861923"
  };

  const isPlanoPago = church.valor_mensal_assinatura > 0;
  const dataAceite = church.created_at ? new Date(church.created_at).toLocaleDateString('pt-BR') : 'Data não disponível';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Contrato de Serviço - {church.name}</DialogTitle>
          <DialogDescription>
            Contrato gerado em {new Date().toLocaleDateString('pt-BR')} para a igreja {church.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6">
          <div id="contract-content" className="prose prose-sm max-w-none">
            <h2 className="text-center">Contrato de Licenciamento de Uso de Software (SaaS) e Termos de Serviço – Plataforma Lumina</h2>
            
            <p><strong>CONTRATANTE (IGREJA):</strong> {church.name}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {church.cnpj || 'Não informado'}, com sede em {church.address || 'Endereço não informado'}.</p>
            <p><strong>CONTRATADA (LUMINA):</strong> {luminaData.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {luminaData.cnpj}, com sede na {luminaData.endereco}, e-mail para contato {luminaData.email} e telefone {luminaData.telefone}.</p>
            
            <p>Ao clicar em "Aceitar" ou ao usar a plataforma, a IGREJA concorda com todos os termos aqui presentes.</p>

            <h3>CLÁUSULA 1ª: DO OBJETO</h3>
            <p>1.1. O objeto deste contrato é a concessão de uma licença de uso de software (SaaS), não exclusiva e intransferível, da PLATAFORMA Lumina, hospedada nos servidores da LUMINA (ou de terceiros por ela contratados), acessada via internet.</p>
            <p>1.2. A PLATAFORMA inclui os módulos descritos no site oficial e, a critério da LUMINA, quaisquer atualizações ou novos módulos (como a futura "Gestão de Projetos Sociais") que venham a ser implementados.</p>

            <h3>CLÁUSULA 2ª: DAS MODALIDADES DE PLANO</h3>
            {!isPlanoPago ? (
                <>
                    <p><strong>2.1. Plano Gratuito (Freemium):</strong></p>
                    <p>a) A LUMINA oferece um plano de acesso gratuito para que a IGREJA possa utilizar a PLATAFORMA.</p>
                    <p>b) Este plano possui limitações claras, incluindo um número máximo de 10 (dez) usuários cadastrados, podendo haver outras limitações de armazenamento ou funcionalidades, conforme descrito na PLATAFORMA.</p>
                    <p>c) A LUMINA se reserva o direito de alterar, limitar ou descontinuar o Plano Gratuito a qualquer momento, mediante aviso prévio de 30 (trinta) dias.</p>
                </>
            ) : (
                <>
                    <p><strong>2.2. Plano Pago (Assinatura):</strong></p>
                    <p>a) Ao optar por um Plano Pago, a IGREJA terá acesso a funcionalidades e limites expandidos, conforme descrito na página de "Planos e Preços" no site oficial da LUMINA no momento da contratação. O plano contratado pela IGREJA é o <strong>"{church.subscriptionPlanName}"</strong>.</p>
                </>
            )}

            <h3>CLÁUSULA 3ª: DO PREÇO E PAGAMENTO</h3>
            <p>3.1. Pelos serviços dos Planos Pagos, a IGREJA pagará à LUMINA o valor correspondente ao plano escolhido ({isPlanoPago ? `R$ ${church.valor_mensal_assinatura.toFixed(2)}/mês` : 'N/A'}), na periodicidade escolhida (mensal ou anual).</p>
            <p>3.2. Os pagamentos serão processados através de Cartão de Crédito, PIX ou Boleto Bancário, via plataforma de pagamento parceira (ASAAS).</p>
            <p>3.3. O não pagamento da fatura até a data de vencimento poderá acarretar a suspensão imediata do acesso aos módulos pagos da PLATAFORMA.</p>
            <p>3.4. Após 30 (trinta) dias de inadimplência, a LUMINA se reserva o direito de suspender totalmente a conta e, após 90 (noventa) dias, excluir permanentemente todos os dados da IGREJA, mediante notificação prévia.</p>
            <p>3.5. Os valores dos planos poderão ser reajustados anualmente pelo IPCA, ou no menor período permitido por lei.</p>

            <h3>CLÁUSULA 4ª: DA VIGÊNCIA E DO CANCELAMENTO (FOCO NA FLEXIBILIDADE)</h3>
            <p>4.1. <strong>Vigência:</strong> Este contrato entra em vigor na data do aceite digital pela IGREJA e tem prazo indeterminado, vigorando enquanto a IGREJA mantiver seu plano (gratuito ou pago) ativo.</p>
            <p>4.2. <strong>POLÍTICA DE NÃO FIDELIDADE:</strong> Este contrato NÃO POSSUI CLÁUSULA DE FIDELIDADE ou multa rescisória por cancelamento.</p>
            <p>4.3. <strong>Cancelamento pela IGREJA:</strong></p>
            <ul>
                <li>a) A IGREJA pode solicitar o cancelamento de sua assinatura paga a QUALQUER MOMENTO, diretamente através do painel administrativo da PLATAFORMA.</li>
                <li>b) O cancelamento não gera direito a reembolso dos valores já pagos no ciclo de faturamento vigente (seja ele mensal ou anual).</li>
                <li>c) Após o cancelamento, a IGREJA continuará com acesso total ao seu plano pago até o último dia do período já faturado. Após essa data, a conta será revertida para o Plano Gratuito (se aplicável) ou suspensa.</li>
            </ul>
            <p>4.4. <strong>Cancelamento pela LUMINA:</strong> A LUMINA poderá rescindir este contrato e suspender o acesso da IGREJA imediatamente em caso de violação de qualquer cláusula destes Termos de Uso.</p>

            <h3>CLÁUSULA 5ª: DAS OBRIGAÇÕES DA LUMINA</h3>
            <p>5.1. Prestar o serviço conforme descrito, mantendo a PLATAFORMA acessível e envidando esforços razoáveis para manter um alto nível de disponibilidade (uptime).</p>
            <p>5.2. Oferecer suporte técnico para dúvidas e problemas relativos ao funcionamento da PLATAFORMA, através dos canais oficiais informados na PLATAFORMA ou pelo e-mail {luminaData.email}.</p>
            <p>5.3. Realizar as correções de bugs e falhas de funcionamento no menor tempo possível, priorizando falhas críticas que impeçam o uso da PLATAFORMA.</p>
            <p>5.4. Manter sigilo sobre as informações e dados inseridos pela IGREJA, em conformidade com a LGPD.</p>

            <h3>CLÁUSULA 6ª: DAS OBRIGAÇÕES DA IGREJA</h3>
            <p>6.1. Pagar pontualmente os valores da assinatura, caso opte por um Plano Pago.</p>
            <p>6.2. Utilizar a PLATAFORMA de forma ética e legal, sendo a única responsável por todo o conteúdo inserido.</p>
            <p>6.3. Manter seus dados cadastrais (Nome da Igreja, CNPJ, e-mail do administrador) atualizados.</p>
            <p>6.4. A IGREJA é a única responsável pela segurança de suas senhas de acesso e por toda atividade realizada em sua conta.</p>

            <h3>CLÁUSULA 7ª: DA PROTEÇÃO DE DADOS (LGPD)</h3>
            <p>7.1. Todos os dados inseridos na PLATAFORMA pela IGREJA (dados de membros, financeiros, devocionais, projetos sociais, etc.) são de propriedade e responsabilidade exclusiva da IGREJA.</p>
            <p>7.2. Para fins da Lei Geral de Proteção de Dados (LGPD), a IGREJA é a Controladora dos dados pessoais de seus membros, e a LUMINA atua estritamente como Operadora desses dados.</p>
            <p>7.3. A LUMINA se compromete a processar os dados apenas para os fins deste contrato (fazer a plataforma funcionar) e não irá vender, compartilhar ou utilizar os dados dos membros da IGREJA para qualquer outra finalidade.</p>
            <p>7.4. Em caso de cancelamento da conta, a IGREJA terá um prazo de 30 (trinta) dias para exportar seus dados. Após esse período, a LUMINA procederá com a exclusão segura e definitiva dos dados dos servidores.</p>

            <h3>CLÁUSULA 8ª: DA PROPRIEDADE INTELECTUAL</h3>
            <p>8.1. A licença de uso aqui concedida não transfere à IGREJA qualquer direito de propriedade intelectual sobre o software, seu código-fonte, marcas, logotipos ou design da PLATAFORMA Lumina, que pertencem exclusivamente à {luminaData.razaoSocial}.</p>

            <h3>CLÁUSULA 9ª: DO FORO</h3>
            <p>9.1. Fica eleito o foro da comarca de Araguaína - TO, para dirimir quaisquer dúvidas ou litígios oriundos deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>

            <p className="text-center mt-8">E, por estarem justos e contratados, a IGREJA manifesta seu aceite digital a estes termos no ato do cadastro na PLATAFORMA.</p>
            <p className="text-center">Araguaína - TO, {dataAceite}.</p>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractViewDialog;