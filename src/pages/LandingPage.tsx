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
// Removido visual com gradientes para aderir ao visual sólido da marca

type FeatureProps = { icon: any; title: string; desc: string; color?: string };
const Feature = ({ icon: Icon, title, desc, color = "bg-primary" }: FeatureProps) => (
  <Card className="h-full border bg-card text-card-foreground shadow-sm hover:shadow-md transition-transform hover:-translate-y-0.5">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground ${color} shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </CardContent>
  </Card>
);

const StatCard = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <Card className="border bg-card text-card-foreground">
    <CardContent className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium">{label}</span>
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
    <div className="relative min-h-screen transition-colors">
      {/* Header fixo com navegação (fundo branco) */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container mx-auto responsive-section py-3 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3">
            {/* Corrige distorção da logo: altura fixa, largura automática */}
            <img src="/lumina-logo.png" alt="Lumina" className="h-8 w-auto" />
            <span className="font-semibold tracking-tight">Lumina Sistema de Gestão</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-primary">Funcionalidades</a>
            <a href="#about" className="text-muted-foreground hover:text-primary">Sobre Nós</a>
            <a href="#plans" className="text-muted-foreground hover:text-primary">Planos</a>
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

      {/* HERO sólido com a cor primária da marca */}
      <section id="hero" className="relative z-10 overflow-hidden bg-primary text-primary-foreground">
        <div className="container mx-auto responsive-section pt-12 md:pt-16 pb-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-primary-foreground/10 border-primary-foreground/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Nova Identidade • Lumina Sistema de Gestão</span>
            </div>

            <h1 className="mt-5 text-[2rem] md:text-6xl font-extrabold leading-tight tracking-tight">
              Lumina Sistema de Gestão
            </h1>

            <p className="mt-5 text-primary-foreground/90 text-base md:text-lg">
              Tecnologia para iluminar e simplificar a gestão da sua igreja —
              com segurança por igreja (RLS), WhatsApp integrado e ferramentas completas para líderes e membros.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full px-6 shadow-md">
                <Link to="/login">
                  Entrar na Plataforma
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
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
          <Card className="border">
            <CardContent className="p-5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Segurança por Igreja (RLS)</h3>
                <p className="text-xs text-muted-foreground">
                  Cada igreja acessa apenas seus dados com políticas robustas no banco.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-5 flex items-start gap-3">
              <LockKeyhole className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Auth Supabase</h3>
                <p className="text-xs text-muted-foreground">
                  Autenticação moderna, monitoramento de sessão e redirecionamentos automáticos.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-5 flex items-start gap-3">
              <ServerCog className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Infraestrutura Confiável</h3>
                <p className="text-xs text-muted-foreground">
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
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Tudo o que sua igreja precisa
          </h2>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <Feature icon={Users} title="Gestão de Ministérios" desc="Cadastre ministérios, líderes e voluntários; gerencie funções e demandas." color="bg-primary" />
          <Feature icon={CalendarCheck2} title="Escalas de Serviço" desc="Crie escalas por evento e ministério; confirme presença e visualize atribuições." color="bg-emerald-600" />
          <Feature icon={Baby} title="Kids Check-in/Out" desc="Check-in com código de segurança e histórico de presença por criança." color="bg-rose-600" />
          <Feature icon={BookOpen} title="Devocionais e Cursos" desc="Publique devocionais e organize trilhas/cursos com módulos e aulas." color="bg-violet-600" />
          <Feature icon={HandCoins} title="Doações e Recibos" desc="Registre ofertas e emita recibos; acompanhe transações e relatórios." color="bg-amber-600" />
          <Feature icon={MessageSquare} title="WhatsApp Integrado" desc="Templates por igreja e fila automática para escala, kids e recibos." color="bg-green-600" />
          <Feature icon={LayoutDashboard} title="Dashboard por Função" desc="Painéis para admin/pastor e membros com métricas e atalhos." color="bg-indigo-600" />
          <Feature icon={ShieldCheck} title="Segurança por Igreja" desc="Supabase Auth + RLS: cada igreja vê apenas seus dados." color="bg-fuchsia-600" />
        </div>
      </section>

      {/* REMOVIDO: Vitrine de Telas */}

      {/* SOBRE / MISSÃO / VISÃO — fundo branco */}
      <section id="about" className="container mx-auto responsive-section py-10 md:py-14">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="border">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Sobre Nós</h2>
              <p className="text-sm text-muted-foreground">
                A plataforma criada para iluminar e simplificar a administração da sua igreja.
                Ferramentas completas e intuitivas para que líderes e equipes foquem no que importa:
                o cuidado com as pessoas e a expansão do ministério.
              </p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Nossa Missão</h2>
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Empoderar igrejas com tecnologia acessível, simplificando a gestão para dedicar mais tempo
                  à missão espiritual e ao cuidado dos membros.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-6">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Nossa Visão</h2>
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
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
          <p className="mt-2 text-muted-foreground">
            O que nos guia no dia a dia para servir melhor as igrejas.
          </p>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="border shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Fé e Propósito</h3>
                  <p className="text-sm text-muted-foreground">Trabalhamos para fortalecer o trabalho das igrejas.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Inovação a Serviço</h3>
                  <p className="text-sm text-muted-foreground">Tecnologia aplicada às necessidades do contexto eclesiástico.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Parceria e Suporte</h3>
                  <p className="text-sm text-muted-foreground">Suporte dedicado e relacionamento de confiança.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Integridade</h3>
                  <p className="text-sm text-muted-foreground">Transparência e honestidade em todas as interações.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Simplicidade</h3>
                  <p className="text-sm text-muted-foreground">Ferramentas poderosas e fáceis de usar.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* PLANOS — fundo branco */}
      <section id="plans" className="container mx-auto responsive-section py-10 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-background border-border">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Planos Flexíveis</span>
          </div>
          <h2 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight">Planos de Assinatura</h2>
          <p className="mt-2 text-muted-foreground">Escolha um plano para começar o cadastro da sua igreja.</p>
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
                  className={`relative border shadow-sm transition-all ${
                    isPopular
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-1 shadow">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-primary opacity-90" />
                        <h3 className="font-semibold">{plan.nome}</h3>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">
                        {formatBRL(price)}/mês
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{plan.descricao}</p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>Até {plan.limite_membros} membros</li>
                      <li>{plan.limite_quizes_por_etapa} quizzes por etapa</li>
                      <li>{plan.limite_armazenamento_mb} MB de armazenamento</li>
                    </ul>
                    <Button asChild className="w-full shadow-md">
                      <Link to={`/cadastrar-igreja?plano=${plan.id}`}>Escolher este plano</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* FOOTER — sólido na cor da marca */}
      <footer className="border-t bg-primary text-primary-foreground">
        <div className="container mx-auto responsive-section py-10 grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <img src="/lumina-logo.png" alt="Lumina" className="h-6 w-auto" />
              </div>
              <h3 className="text-lg font-semibold">Lumina Sistema de Gestão</h3>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Tecnologia para iluminar e simplificar a gestão da sua igreja.
            </p>
            <p className="text-xs text-primary-foreground/70">
              © {new Date().getFullYear()} Lumina. Todos os direitos reservados.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Contato</h4>
            <div className="flex items-center gap-3">
              <PhoneCall className="h-4 w-4 text-primary-foreground/80" />
              <a href="https://wa.me/5563984861923" target="_blank" rel="noreferrer" className="text-sm hover:text-primary-foreground">+55 63 98486-1923</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary-foreground/80" />
              <a href="mailto:Luminasistema@gmail.com.br" className="text-sm hover:text-primary-foreground">Luminasistema@gmail.com.br</a>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-primary-foreground/80" />
              <a href="https://www.luminasistema.com.br" target="_blank" rel="noreferrer" className="text-sm hover:text-primary-foreground">www.luminasistema.com.br</a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Dados Empresariais</h4>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-primary-foreground/80" />
              <div className="text-sm">
                <div className="text-primary-foreground/80">Nome Empresarial</div>
                <div className="font-medium">49.023.921 INOVA SIMPLES (I.S.)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary-foreground/80" />
              <div className="text-sm">
                <div className="text-primary-foreground/80">CNPJ</div>
                <div className="font-medium">49.023.921/0001-69</div>
              </div>
            </div>
            <div className="pt-1">
              <Button onClick={handleContatoWhatsApp} className="rounded-full">
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