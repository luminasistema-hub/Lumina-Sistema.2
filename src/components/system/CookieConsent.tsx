"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

type ConsentPrefs = {
  essential: true;
  analytics: boolean;
  updatedAt: string;
  version: string;
};

const CONSENT_KEY = "lumina_cookie_consent";
const POLICY_VERSION = "2025-10-07";

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const storedConsent: ConsentPrefs | null = useMemo(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Exibir banner se não houver consentimento ou versão mudou
    if (!storedConsent || storedConsent.version !== POLICY_VERSION) {
      setShowBanner(true);
    } else {
      setAnalyticsEnabled(storedConsent.analytics);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveConsent = (analytics: boolean) => {
    const consent: ConsentPrefs = {
      essential: true,
      analytics,
      updatedAt: new Date().toISOString(),
      version: POLICY_VERSION,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setAnalyticsEnabled(analytics);
    setShowBanner(false);
    setPrefsOpen(false);
  };

  const acceptAll = () => saveConsent(true);
  const rejectAnalytics = () => saveConsent(false);

  return (
    <>
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-2 md:p-3">
          <Card className="mx-auto max-w-xl p-2 md:p-3 shadow-lg border bg-background">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-sm md:text-base font-semibold">
                  Política de Privacidade e Cookies – Lumina Sistema de Gestão
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Usamos cookies essenciais e, com seu consentimento, cookies de desempenho e análise para melhorar sua
                  experiência. Ao continuar, você concorda com nossa Política. Última atualização: 07 de outubro de 2025.
                </p>
                <div>
                  <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setPolicyOpen(true)}>
                    Ler a Política completa
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Button variant="outline" onClick={() => setPrefsOpen(true)}>Gerenciar preferências</Button>
                <Button variant="secondary" onClick={rejectAnalytics}>Continuar sem análise</Button>
                <Button onClick={acceptAll}>Aceitar todos</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Preferências de cookies */}
      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preferências de Cookies</DialogTitle>
            <DialogDescription>Você pode ajustar quais cookies não essenciais deseja permitir.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Cookies Essenciais</p>
                <p className="text-xs text-muted-foreground">
                  Necessários para o funcionamento da plataforma (login, segurança e navegação). Sempre ativos.
                </p>
              </div>
              <Switch checked disabled aria-readonly />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Cookies de Desempenho e Análise</p>
                <p className="text-xs text-muted-foreground">
                  Ajudam a entender o uso da plataforma e melhorar a experiência.
                </p>
              </div>
              <Switch checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPrefsOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveConsent(analyticsEnabled)}>Salvar preferências</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Política de Privacidade e Cookies */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Política de Privacidade e Cookies – Lumina Sistema de Gestão</DialogTitle>
            <DialogDescription>Data da última atualização: 07 de outubro de 2025</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-2">
            <div className="space-y-4 text-sm">
              <p>
                A sua privacidade é fundamental para nós. Esta Política de Privacidade e Cookies descreve como a Lumina
                Sistema de Gestão, desenvolvida pela empresa 49.023.921 INOVA SIMPLES (I.S.), coleta, usa, armazena e
                protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº
                13.709/2018).
              </p>
              <p>Ao utilizar nossa plataforma, você concorda com as práticas descritas neste documento.</p>

              <h3 className="font-semibold">1. Controlador dos Dados</h3>
              <div className="space-y-1">
                <p>O responsável pelo tratamento dos seus dados pessoais é:</p>
                <p>Empresa: 49.023.921 INOVA SIMPLES (I.S.)</p>
                <p>CNPJ: 49.023.921/0001-69</p>
                <p>Endereço: RUA TOMAS BATISTA, S/N QD45 LT06, LOTEAMENTO MANOEL GOMES DA CUNHA, ARAGUAINA, TO, CEP 77818-030</p>
                <p>E-mail para contato sobre privacidade: Luminasistema@gmail.com.br</p>
              </div>

              <h3 className="font-semibold">2. Dados que Coletamos</h3>
              <div className="space-y-2">
                <p>Coletamos os seguintes tipos de informações:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Dados de Cadastro do Usuário: Nome, e-mail, telefone e informações da igreja que você representa,
                    fornecidos durante a criação da sua conta.
                  </li>
                  <li>
                    Dados Inseridos na Plataforma: Informações que sua igreja insere no sistema, como dados cadastrais de
                    membros, registros financeiros, agendamentos de eventos e outros dados necessários para a gestão
                    eclesiástica. A sua igreja é a controladora desses dados, e a Lumina atua como operadora.
                  </li>
                  <li>
                    Dados de Navegação (Cookies): Endereço IP, tipo de navegador, páginas visitadas, tempo de permanência e
                    outros dados técnicos coletados automaticamente para melhorar sua experiência.
                  </li>
                </ul>
              </div>

              <h3 className="font-semibold">3. Finalidade do Tratamento de Dados</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Prestar, manter e melhorar os serviços da plataforma.</li>
                <li>Processar pagamentos e realizar a gestão de contas.</li>
                <li>Oferecer suporte técnico e nos comunicarmos com você.</li>
                <li>Garantir a segurança da plataforma e prevenir fraudes.</li>
                <li>Analisar o uso do sistema para desenvolver novos recursos e funcionalidades.</li>
                <li>Cumprir obrigações legais e regulatórias.</li>
              </ul>

              <h3 className="font-semibold">4. Sobre Cookies</h3>
              <div className="space-y-2">
                <p>
                  O que são cookies? Cookies são pequenos arquivos de texto que os sites armazenam no seu computador ou
                  dispositivo móvel quando você os visita. Eles servem para "lembrar" de você e de suas preferências,
                  melhorando sua experiência de navegação.
                </p>
                <p>Como usamos os cookies?</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Cookies Essenciais: Necessários para o funcionamento da plataforma, como manter sua sessão de login
                    ativa.
                  </li>
                  <li>
                    Cookies de Desempenho e Análise: Nos ajudam a entender como os usuários interagem com a plataforma,
                    quais páginas são mais visitadas e identificar possíveis erros.
                  </li>
                  <li>
                    Cookies de Funcionalidade: Permitem lembrar de suas preferências, como idioma ou outras configurações
                    personalizadas.
                  </li>
                </ul>
                <p className="text-muted-foreground">
                  Você pode gerenciar ou desativar os cookies através das configurações do seu navegador. No entanto, a
                  desativação de cookies essenciais pode afetar a funcionalidade da plataforma.
                </p>
              </div>

              <h3 className="font-semibold">5. Compartilhamento de Dados</h3>
              <p>
                Não compartilhamos seus dados pessoais com terceiros, exceto nas seguintes situações:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Com provedores de serviços essenciais para nossa operação (ex: servidores de hospedagem em nuvem, gateways
                  de pagamento), que estão contratualmente obrigados a proteger seus dados.
                </li>
                <li>Para cumprir uma obrigação legal ou uma ordem judicial.</li>
                <li>Com sua autorização expressa.</li>
              </ul>

              <h3 className="font-semibold">6. Seus Direitos como Titular dos Dados (LGPD)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Confirmar a existência de tratamento dos seus dados.</li>
                <li>Acessar seus dados.</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                <li>
                  Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com
                  a LGPD.
                </li>
                <li>Solicitar a portabilidade dos seus dados a outro fornecedor de serviço.</li>
                <li>Obter informação sobre as entidades com as quais o controlador realizou uso compartilhado de dados.</li>
                <li>Revogar o consentimento, quando o tratamento de dados se basear nele.</li>
              </ul>
              <p className="text-muted-foreground">
                Para exercer seus direitos, entre em contato através do e-mail: Luminasistema@gmail.com.br.
              </p>

              <h3 className="font-semibold">7. Segurança dos Dados</h3>
              <p>
                Adotamos medidas de segurança técnicas e administrativas para proteger seus dados pessoais contra acessos não
                autorizados, perda, alteração ou destruição.
              </p>

              <h3 className="font-semibold">8. Alterações nesta Política</h3>
              <p>
                Podemos atualizar esta Política de Privacidade e Cookies periodicamente. Recomendamos que você a revise com
                frequência para se manter informado sobre como estamos protegendo seus dados.
              </p>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPolicyOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;