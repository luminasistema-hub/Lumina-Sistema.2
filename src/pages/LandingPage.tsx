import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Baby,
  BookOpen,
  HandCoins,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Mail,
  Globe,
  Building2,
  FileText,
  CheckCircle,
  Lightbulb,
  Target,
  Heart,
} from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import FloatingShapes from "@/components/visual/FloatingShapes";

const Feature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <Card className="h-full border border-zinc-200 dark:border-zinc-700 backdrop-blur-sm transition-transform hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-church-blue-50/70 to-church-purple-50/70 dark:from-zinc-900/80 dark:to-zinc-800/80">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="inline-flex items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-2">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
    </CardContent>
  </Card>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{value}</div>
    <div className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
  </div>
);

const LandingPage = () => {
  const { plans, isLoading } = useSubscriptionPlans();

  const handleContatoWhatsApp = () => {
    const telefone = "5563984861923";
    const texto = `Olá! Gostaria de falar com a Lumina Sistema de Gestão.`;
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    toast.success("Abrindo WhatsApp...");
  };

  return (
    <div className="relative min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Overlay de gradiente azul/roxo em toda a página */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 opacity-40"></div>
      
      {/* Shapes flutuantes interativos */}
      <FloatingShapes />

      {/* HERO */}
      <header className="relative overflow-hidden bg-sidebar-accent/60 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 pt-14 md:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-white/60 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Nova identidade • Lumina Sistema de Gestão</span>
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight">
              Lumina Sistema de Gestão
            </h1>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-base md:text-lg">
              Tecnologia para iluminar e simplificar a gestão da sua igreja — com segurança por igreja (RLS), WhatsApp integrado e ferramentas completas para líderes e membros.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="shadow-md hover:shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link to="/login">
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="sm:ml-2 text-indigo-600 hover:text-indigo-700" onClick={handleContatoWhatsApp}>
                Falar no WhatsApp
                <PhoneCall className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 justify-items-center max-w-xl mx-auto gap-4">
              <Stat value="100%" label="RLS por igreja" />
              <Stat value="24/7" label="Online" />
            </div>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Tudo o que sua igreja precisa</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Funcionalidades pensadas para líderes, voluntários e membros — simples, seguras e integradas.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <Feature icon={Users} title="Gestão de Ministérios" desc="Cadastre ministérios, líderes e voluntários; gerencie funções e demandas." />
          <Feature icon={CalendarCheck2} title="Escalas de Serviço" desc="Crie escalas por evento e ministério; confirme presença e visualize atribuições." />
          <Feature icon={Baby} title="Kids Check-in/Out" desc="Check-in com código de segurança e histórico de presença por criança." />
          <Feature icon={BookOpen} title="Devocionais e Cursos" desc="Publique devocionais e organize trilhas/cursos com módulos e aulas." />
          <Feature icon={HandCoins} title="Doações e Recibos" desc="Registre ofertas e emita recibos; acompanhe transações e relatórios." />
          <Feature icon={MessageSquare} title="WhatsApp Integrado" desc="Templates por igreja e fila automática para escala, kids e recibos." />
          <Feature icon={LayoutDashboard} title="Dashboard por Função" desc="Painéis para admin/pastor e membros com métricas e atalhos." />
          <Feature icon={ShieldCheck} title="Segurança por Igreja" desc="Supabase Auth + RLS: cada igreja vê apenas seus dados." />
        </div>
      </section>

      {/* SOBRE NÓS / MISSÃO / VISÃO */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Sobre Nós</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Bem-vindo à Lumina Sistema de Gestão, a plataforma criada para iluminar e simplificar a administração da sua igreja.
                Entendemos que a gestão de uma comunidade de fé envolve dedicação, tempo e organização.
                Por isso, desenvolvemos uma ferramenta completa e intuitiva, pensada para que líderes e equipes possam focar no que realmente importa:
                o cuidado com as pessoas e a expansão do ministério.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Nossa Missão</h2>
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-indigo-600" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Empoderar igrejas com tecnologia inovadora e acessível, simplificando a gestão administrativa
                  para que possam dedicar mais tempo e energia à sua missão espiritual e ao cuidado de seus membros.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Nossa Visão</h2>
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Ser a principal plataforma de gestão para igrejas no Brasil, reconhecida pela excelência, usabilidade
                  e pelo impacto positivo na organização e crescimento das comunidades de fé que servimos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* VALORES */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Nossos Valores</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            O que nos guia no dia a dia para servir melhor as igrejas.
          </p>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-pink-600" />
                <div>
                  <h3 className="font-semibold">Fé e Propósito</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Acreditamos no poder da comunidade e trabalhamos para fortalecer o trabalho das igrejas.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-semibold">Inovação a Serviço do Reino</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Buscamos soluções tecnológicas para atender às necessidades do ambiente eclesiástico.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-semibold">Parceria e Suporte</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Somos parceiros de cada igreja, com suporte dedicado e relacionamento de confiança.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-zinc-600" />
                <div>
                  <h3 className="font-semibold">Integridade</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Agimos com transparência e honestidade em todas as nossas interações.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold">Simplicidade</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Ferramentas poderosas e fáceis de usar, para todos os níveis de conhecimento.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* PLANOS */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Planos de Assinatura</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Escolha um plano para começar o cadastro da sua igreja.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading ? (
            <Card className="p-6">
              <CardContent className="p-0">Carregando planos...</CardContent>
            </Card>
          ) : plans.length === 0 ? (
            <Card className="p-6">
              <CardContent className="p-0">Nenhum plano disponível no momento.</CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="bg-gradient-to-br from-white/80 to-church-purple-50/60 dark:from-zinc-900/80 dark:to-zinc-800/80 border border-indigo-200 dark:border-zinc-700 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">{plan.nome}</h3>
                    <Badge className="bg-primary/10 text-primary">
                      R$ {plan.preco_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{plan.descricao}</p>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 mb-4">
                    <li>Até {plan.limite_membros} membros</li>
                    <li>{plan.limite_quizes_por_etapa} quizzes por etapa</li>
                    <li>{plan.limite_armazenamento_mb} MB de armazenamento</li>
                  </ul>
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md">
                    <Link to={`/cadastrar-igreja?plano=${plan.id}`}>Escolher este plano</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-10">
        <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Lumina Sistema de Gestão</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tecnologia para iluminar e simplificar a gestão da sua igreja.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              © {new Date().getFullYear()} Lumina. Todos os direitos reservados.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Contato</h4>
            <div className="flex items-center gap-3">
              <PhoneCall className="h-4 w-4 text-emerald-600" />
              <a href="https://wa.me/5563984861923" target="_blank" rel="noreferrer" className="text-sm">+55 63 98486-1923</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-indigo-600" />
              <a href="mailto:Luminasistema@gmail.com.br" className="text-sm">Luminasistema@gmail.com.br</a>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-blue-600" />
              <a href="https://www.luminasistema.com.br" target="_blank" rel="noreferrer" className="text-sm">www.luminasistema.com.br</a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Dados Empresariais</h4>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-zinc-700" />
              <div className="text-sm">
                <div className="text-zinc-500">Nome Empresarial</div>
                <div className="font-medium">49.023.921 INOVA SIMPLES (I.S.)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-zinc-700" />
              <div className="text-sm">
                <div className="text-zinc-500">CNPJ</div>
                <div className="font-medium">49.023.921/0001-69</div>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleContatoWhatsApp} className="bg-indigo-600 hover:bg-indigo-700">
                Falar no WhatsApp
                <PhoneCall className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;