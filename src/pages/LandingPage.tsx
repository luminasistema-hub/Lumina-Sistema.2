import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Baby,
  BookOpen,
  HandCoins,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Mail,
  Building2,
  FileText,
  CheckCircle,
  Lightbulb,
  Target,
  Heart,
  Rocket,
  MessageSquare,
  Church,
  GraduationCap,
  BarChart3,
  QrCode,
  GitMerge,
} from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FeatureCardProps = {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
};

const FeatureCard = ({ icon: Icon, title, description, color }: FeatureCardProps) => (
  <Card className="flex flex-col text-left border-border/80 hover:border-primary/50 hover:shadow-lg transition-all duration-300 rounded-xl">
    <CardHeader className="flex-row items-center gap-4 pb-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-white ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

const LandingPage = () => {
  const { plans, isLoading } = useSubscriptionPlans();

  const handleContatoWhatsApp = () => {
    const telefone = "5563920007673";
    const texto = "Olá! Gostaria de saber mais sobre a plataforma Lumina.";
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const sortedPlans = useMemo(() => {
    if (!plans?.length) return [];
    return [...plans].sort((a: any, b: any) => Number(a.preco_mensal || 0) - Number(b.preco_mensal || 0));
  }, [plans]);

  const formatBRL = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const features: FeatureCardProps[] = [
    {
      icon: Users,
      title: "Gestão de Membros",
      description: "Centralize dados, acompanhe o desenvolvimento e gerencie informações de todos os membros de forma segura e integrada.",
      color: "bg-blue-500",
    },
    {
      icon: GraduationCap,
      title: "Jornada de Crescimento",
      description: "Crie trilhas de discipulado, cursos e escolas com etapas, vídeos, materiais e quizzes para capacitar seus membros.",
      color: "bg-violet-500",
    },
    {
      icon: Church,
      title: "Ministérios e Voluntários",
      description: "Organize ministérios, gerencie voluntários, crie escalas de serviço e ajude membros a encontrarem seu chamado.",
      color: "bg-teal-500",
    },
    {
      icon: Heart,
      title: "Grupos de Crescimento (GCs)",
      description: "Administre pequenos grupos, controle a participação e facilite a comunicação entre líderes e membros.",
      color: "bg-rose-500",
    },
    {
      icon: CalendarCheck2,
      title: "Gestão de Eventos",
      description: "Crie e divulgue eventos, gerencie inscrições, programe a ordem do culto e comunique-se com os participantes.",
      color: "bg-sky-500",
    },
    {
      icon: Baby,
      title: "Check-in Kids Seguro",
      description: "Garanta a segurança das crianças com um sistema de check-in e check-out com etiquetas e código de segurança.",
      color: "bg-pink-500",
    },
    {
      icon: HandCoins,
      title: "Financeiro Integrado",
      description: "Gerencie dízimos, ofertas e despesas. Emita recibos, acompanhe o fluxo de caixa e gere relatórios detalhados.",
      color: "bg-amber-500",
    },
    {
      icon: BookOpen,
      title: "Conteúdo e Devocionais",
      description: "Publique devocionais, estudos bíblicos e outros materiais para a edificação contínua de sua comunidade.",
      color: "bg-indigo-500",
    },
    {
      icon: GitMerge,
      title: "Gestão Multi-Campus",
      description: "Administre igrejas filhas (campus) de forma centralizada, compartilhando recursos e visualizando dados consolidados.",
      color: "bg-slate-500",
    },
  ];

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/lumina-symbol.png" alt="Lumina" className="h-8 w-auto" />
            <span className="font-semibold text-lg">Lumina</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground transition-colors hover:text-primary">Funcionalidades</a>
            <a href="#plans" className="text-muted-foreground transition-colors hover:text-primary">Planos</a>
            <a href="#faq" className="text-muted-foreground transition-colors hover:text-primary">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button onClick={handleContatoWhatsApp} className="hidden sm:flex">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contato
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section id="hero" className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
              <Sparkles className="mr-2 h-3 w-3" />
              A plataforma completa para gestão de igrejas
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tighter md:text-6xl">
              Ilumine a gestão da sua igreja
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Simplifique a administração, conecte seus membros e impulsione o crescimento do seu ministério com ferramentas inteligentes e seguras.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href="#plans">
                  Ver Planos e Começar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={handleContatoWhatsApp}>
                Falar com um especialista
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Tudo o que você precisa em um só lugar</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Do cuidado com os membros ao financeiro, a Lumina integra todas as áreas da sua igreja.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* For You Section */}
        <section id="for-you" className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Uma plataforma para cada papel na igreja</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Ferramentas personalizadas que empoderam pastores, líderes e membros em suas jornadas.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Pastores e Admins</h3>
                <p className="mt-2 text-muted-foreground">Tenha uma visão 360° da igreja com dashboards, relatórios gerenciais, e controle total sobre membros, finanças e configurações do sistema.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Líderes de Ministério</h3>
                <p className="mt-2 text-muted-foreground">Gerencie seus voluntários, crie escalas de serviço, comunique-se com sua equipe e acompanhe o engajamento do seu ministério ou GC.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Membros</h3>
                <p className="mt-2 text-muted-foreground">Acesse sua jornada de crescimento, inscreva-se em eventos, leia devocionais, contribua online e conecte-se com seus grupos e ministérios.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section id="plans" className="py-20 md:py-28 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Planos flexíveis para sua igreja</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Escolha o plano que melhor se adapta à sua realidade e comece a transformar sua gestão hoje mesmo.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading && <p>Carregando planos...</p>}
              {!isLoading && sortedPlans.length === 0 && <p>Nenhum plano disponível no momento.</p>}
              {sortedPlans.map((plan: any) => (
                <Card key={plan.id} className="flex flex-col rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{plan.nome}</span>
                      {plan.nome === 'Essencial' && <Badge variant="default">Mais Popular</Badge>}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm pt-1">{plan.descricao}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{formatBRL(Number(plan.preco_mensal))}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <ul className="flex-1 space-y-3 text-muted-foreground">
                      {[
                        `Até ${plan.limite_membros} membros`,
                        `${plan.limite_igrejas_filhas > 0 ? plan.limite_igrejas_filhas : 'Sem'} campus ministerial`,
                        `${plan.limite_escolas} escolas`,
                        `${plan.limite_armazenamento_mb} MB de armazenamento`,
                      ].map(item => (
                        <li key={item} className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-6 w-full">
                      <Link to={`/cadastrar-igreja?plano=${plan.id}`}>Escolher Plano</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Dúvidas Frequentes</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Respostas para as perguntas mais comuns sobre a Lumina.
              </p>
            </div>
            <Accordion type="single" collapsible className="mt-12 w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Os dados da minha igreja estão seguros?</AccordionTrigger>
                <AccordionContent>
                  Sim. A segurança é nossa maior prioridade. Utilizamos a tecnologia Row Level Security (RLS) do Supabase, que garante que cada igreja acesse exclusivamente seus próprios dados, criando uma barreira de isolamento total no nível do banco de dados.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>A plataforma funciona em celulares?</AccordionTrigger>
                <AccordionContent>
                  Com certeza! A Lumina foi projetada para ser totalmente responsiva, oferecendo uma experiência de uso excelente em computadores, tablets e celulares. Gerencie sua igreja de onde estiver.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Vocês oferecem suporte técnico?</AccordionTrigger>
                <AccordionContent>
                  Sim, oferecemos suporte dedicado para todos os nossos planos. Nossa equipe está disponível para ajudar com dúvidas, configurações e qualquer dificuldade que você possa encontrar, garantindo que você aproveite ao máximo a plataforma.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Posso mudar de plano no futuro?</AccordionTrigger>
                <AccordionContent>
                  Sim. Você pode solicitar o upgrade ou downgrade do seu plano a qualquer momento diretamente pelo painel administrativo. A mudança é simples e se ajusta ao crescimento e às novas necessidades da sua igreja.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-secondary/50">
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src="/lumina-symbol.png" alt="Lumina" className="h-8 w-auto" />
              <h3 className="text-lg font-semibold">Lumina Sistema de Gestão</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tecnologia para iluminar e simplificar a gestão da sua igreja.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Lumina. Todos os direitos reservados.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium">Contato</h4>
            <div className="flex items-center gap-3">
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
              <a href="https://wa.me/5563920007673" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-primary">+55 63 92000-7673</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href="mailto:contato@luminasistema.com.br" className="text-sm text-muted-foreground hover:text-primary">contato@luminasistema.com.br</a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium">Dados Empresariais</h4>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lumina Sistema de Gestão</span>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">49.023.921/0001-69</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;