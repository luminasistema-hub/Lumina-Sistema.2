import { Link } from "react-router-dom";
import { useMemo as useReactMemo } from "react";
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
  LockKeyhole,
  ServerCog,
  Rocket,
  Shield,
  Clock8,
  Zap,
} from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import FloatingShapes from "@/components/visual/FloatingShapes";

type FeatureProps = { icon: any; title: string; desc: string; accent?: string };
const Feature = ({ icon: Icon, title, desc, accent = "from-sky-500 to-indigo-500" }: FeatureProps) => (
  <Card className="h-full border border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-transform hover:-translate-y-0.5">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-white bg-gradient-to-br ${accent} shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-zinc-900/90 dark:text-zinc-100">{title}</h3>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
    </CardContent>
  </Card>
);

const StatCard = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <Card className="border border-white/60 dark:border-white/5 bg-white/70 dark:bg-white/5 backdrop-blur-md">
    <CardContent className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500/15 to-emerald-500/15 flex items-center justify-center">
          <Icon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </div>
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{label}</span>
      </div>
    </CardContent>
  </Card>
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

  const sortedByPrice = useReactMemo(() => {
    if (!plans?.length) return [];
    return [...plans].sort((a: any, b: any) => Number(a.preco_mensal || 0) - Number(b.preco_mensal || 0));
  }, [plans]);

  const popularPlanId = useReactMemo(() => {
    if (!sortedByPrice.length) return undefined;
    const nonFree = sortedByPrice.filter((p: any) => Number(p.preco_mensal || 0) > 0);
    if (sortedByPrice.length >= 3 && nonFree.length) {
      const middle = nonFree[Math.floor(nonFree.length / 2)];
      return middle?.id;
    }
    return sortedByPrice[0]?.id;
  }, [sortedByPrice]);

  const formatBRL = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  return (
    <div className="relative min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header fixo com navegação (fundo branco) */}
      <header className="sticky top-0 z-30 border-b border-white/20 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-md">
        <div className="container mx-auto responsive-section py-3 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3">
            {/* Corrige distorção da logo: altura fixa, largura automática */}
            <img src="/lumina-logo.png" alt="Lumina" className="h-8 w-auto" />
            <span className="font-semibold tracking-tight">Lumina Sistema de Gestão</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-zinc-700 dark:text-zinc-300 hover:text-sky-600">Funcionalidades</a>
            <a href="#about" className="text-zinc-700 dark:text-zinc-300 hover:text-sky-600">Sobre Nós</a>
            <a href="#plans" className="text-zinc-700 dark:text-zinc-300 hover:text-sky-600">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-sky-600 hover:text-sky-700">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button
              onClick={handleContatoWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4"
            >
              <span className="relative inline-flex items-center">
                <span className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]" />
                WhatsApp
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO com fundo azul (apenas aqui) */}
      <section id="hero" className="relative z-10 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0f172a] via-[#0b2b5a] to-[#1e1b4b]" />
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <FloatingShapes />

        <div className="container mx-auto responsive-section pt-12 md:pt-16 pb-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-white/70 dark:bg-zinc-800/60 border-white/40 dark:border-zinc-700 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Nova Identidade • Lumina Sistema de Gestão</span>
            </div>

            <h1 className="mt-5 text-[2rem] md:text-6xl font-extrabold leading-tight tracking-tight text-white">
              <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Lumina
              </span>{" "}
              Sistema de Gestão
            </h1>

            <p className="mt-5 text-zinc-100/80 text-base md:text-lg">
              Tecnologia para <span className="text-sky-300 font-semibold">iluminar</span> e simplificar a gestão da sua igreja —
              com segurança por igreja (RLS), WhatsApp integrado e ferramentas completas para líderes e membros.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full px-6 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md">
                <Link to="/login">
                  Entrar na Plataforma
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6 border-emerald-500/40 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
                onClick={handleContatoWhatsApp}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Falar no WhatsApp
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <StatCard icon={Shield} label="100% RLS por igreja" />
              <StatCard icon={Clock8} label="24/7 Online" />
              <StatCard icon={Zap} label="Tudo integrado" />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / SEGURANÇA — fundo branco */}
      <section className="container mx-auto responsive-section py-10 md:py-12">
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70">
            <CardContent className="p-5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="font-semibold">Segurança por Igreja (RLS)</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Cada igreja acessa apenas seus dados com políticas robustas no banco.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70">
            <CardContent className="p-5 flex items-start gap-3">
              <LockKeyhole className="h-5 w-5 text-sky-600" />
              <div>
                <h3 className="font-semibold">Auth Supabase</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Autenticação moderna, monitoramento de sessão e redirecionamentos automáticos.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70">
            <CardContent className="p-5 flex items-start gap-3">
              <ServerCog className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="font-semibold">Infraestrutura Confiável</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Caching, Edge Functions e integrações estáveis para alto desempenho.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FEATURES — fundo branco */}
      <section id="features" className="container mx-auto responsive-section py-10 md:py-14">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Tudo o que sua igreja precisa
          </h2>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <Feature icon={Users} title="Gestão de Ministérios" desc="Cadastre ministérios, líderes e voluntários; gerencie funções e demandas." accent="from-sky-500 to-indigo-500" />
          <Feature icon={CalendarCheck2} title="Escalas de Serviço" desc="Crie escalas por evento e ministério; confirme presença e visualize atribuições." accent="from-emerald-500 to-teal-500" />
          <Feature icon={Baby} title="Kids Check-in/Out" desc="Check-in com código de segurança e histórico de presença por criança." accent="from-rose-500 to-pink-500" />
          <Feature icon={BookOpen} title="Devocionais e Cursos" desc="Publique devocionais e organize trilhas/cursos com módulos e aulas." accent="from-violet-500 to-purple-500" />
          <Feature icon={HandCoins} title="Doações e Recibos" desc="Registre ofertas e emita recibos; acompanhe transações e relatórios." accent="from-amber-500 to-orange-500" />
          <Feature icon={MessageSquare} title="WhatsApp Integrado" desc="Templates por igreja e fila automática para escala, kids e recibos." accent="from-emerald-500 to-green-500" />
          <Feature icon={LayoutDashboard} title="Dashboard por Função" desc="Painéis para admin/pastor e membros com métricas e atalhos." accent="from-blue-500 to-indigo-500" />
          <Feature icon={ShieldCheck} title="Segurança por Igreja" desc="Supabase Auth + RLS: cada igreja vê apenas seus dados." accent="from-fuchsia-500 to-pink-500" />
        </div>
      </section>

      {/* REMOVIDO: Vitrine de Telas */}

      {/* SOBRE / MISSÃO / VISÃO — fundo branco */}
      <section id="about" className="container mx-auto responsive-section py-10 md:py-14">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Sobre Nós</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                A plataforma criada para iluminar e simplificar a administração da sua igreja.
                Ferramentas completas e intuitivas para que líderes e equipes foquem no que importa:
                o cuidado com as pessoas e a expansão do ministério.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Nossa Missão</h2>
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Empoderar igrejas com tecnologia acessível, simplificando a gestão para dedicar mais tempo
                  à missão espiritual e ao cuidado dos membros.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Nossa Visão</h2>
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Ser a principal plataforma de gestão para igrejas no Brasil, reconhecida pela excelência,
                  usabilidade e impacto positivo nas comunidades de fé.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* VALORES — fundo branco */}
      <section className="container mx-auto responsive-section py-10 md:py-14">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Nossos Valores</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            O que nos guia no dia a dia para servir melhor as igrejas.
          </p>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70 shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-rose-500/15 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Fé e Propósito</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Trabalhamos para fortalecer o trabalho das igrejas.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70 shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Inovação a Serviço</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Tecnologia aplicada às necessidades do contexto eclesiástico.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70 shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Parceria e Suporte</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Suporte dedicado e relacionamento de confiança.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70 shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-500/15 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Integridade</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Transparência e honestidade em todas as interações.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70 shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-fuchsia-500/15 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-fuchsia-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Simplicidade</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Ferramentas poderosas e fáceis de usar.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* PLANOS — fundo branco */}
      <section id="plans" className="container mx-auto responsive-section py-10 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-white/70 dark:bg-zinc-800/60 border-white/40 dark:border-zinc-700">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span>Planos Flexíveis</span>
          </div>
          <h2 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight">Planos de Assinatura</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Escolha um plano para começar o cadastro da sua igreja.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading ? (
            <Card className="p-6">
              <CardContent className="p-0">Carregando planos...</CardContent>
            </Card>
          ) : (plans?.length ?? 0) === 0 ? (
            <Card className="p-6">
              <CardContent className="p-0">Nenhum plano disponível no momento.</CardContent>
            </Card>
          ) : (
            plans.map((plan: any) => {
              const price = Number(plan.preco_mensal ?? 0);
              const isPopular = plan.id === popularPlanId && price > 0;
              return (
                <Card
                  key={plan.id}
                  className={`relative bg-white dark:bg-zinc-900 border shadow-sm transition-all ${
                    isPopular
                      ? "border-sky-400/60 ring-2 ring-sky-300/40"
                      : "border-zinc-200/70 dark:border-zinc-700/70"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-sky-600 text-white text-[10px] px-2 py-1 shadow">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 opacity-80" />
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{plan.nome}</h3>
                      </div>
                      <Badge className="bg-primary/10 text-primary border border-primary/20">
                        {formatBRL(price)}/mês
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{plan.descricao}</p>
                    <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 mb-4">
                      <li>Até {plan.limite_membros} membros</li>
                      <li>{plan.limite_quizes_por_etapa} quizzes por etapa</li>
                      <li>{plan.limite_armazenamento_mb} MB de armazenamento</li>
                    </ul>
                    <Button asChild className={`w-full ${isPopular ? "bg-sky-600 hover:bg-sky-700" : "bg-indigo-600 hover:bg-indigo-700"} shadow-md`}>
                      <Link to={`/cadastrar-igreja?plano=${plan.id}`}>Escolher este plano</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* FOOTER — mantém estilo próprio escuro */}
      <footer className="border-t border-white/10 bg-[#0b1220] text-zinc-300">
        <div className="container mx-auto responsive-section py-10 grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-sky-500/15 flex items-center justify-center">
                <img src="/lumina-logo.png" alt="Lumina" className="h-6 w-auto" />
              </div>
              <h3 className="text-lg font-semibold text-white">Lumina Sistema de Gestão</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Tecnologia para iluminar e simplificar a gestão da sua igreja.
            </p>
            <p className="text-xs text-zinc-500">
              © {new Date().getFullYear()} Lumina. Todos os direitos reservados.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Contato</h4>
            <div className="flex items-center gap-3">
              <PhoneCall className="h-4 w-4 text-emerald-400" />
              <a href="https://wa.me/5563984861923" target="_blank" rel="noreferrer" className="text-sm hover:text-white">+55 63 98486-1923</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-sky-400" />
              <a href="mailto:Luminasistema@gmail.com.br" className="text-sm hover:text-white">Luminasistema@gmail.com.br</a>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-violet-400" />
              <a href="https://www.luminasistema.com.br" target="_blank" rel="noreferrer" className="text-sm hover:text-white">www.luminasistema.com.br</a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Dados Empresariais</h4>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-zinc-400" />
              <div className="text-sm">
                <div className="text-zinc-400">Nome Empresarial</div>
                <div className="font-medium text-white">49.023.921 INOVA SIMPLES (I.S.)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-zinc-400" />
              <div className="text-sm">
                <div className="text-zinc-400">CNPJ</div>
                <div className="font-medium text-white">49.023.921/0001-69</div>
              </div>
            </div>
            <div className="pt-1">
              <Button onClick={handleContatoWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
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