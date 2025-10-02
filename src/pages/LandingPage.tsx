import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, DollarSign, GraduationCap, Heart, Baby, BarChart3, Shield } from 'lucide-react';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { Skeleton } from '@/components/ui/skeleton';

const LandingPage = () => {
  const { plans, isLoading: isLoadingPlans } = useSubscriptionPlans();

  const features = [
    { icon: <Users className="w-8 h-8 text-blue-500" />, title: 'Gestão de Membros', description: 'Cadastre, gerencie e acompanhe todos os membros da sua igreja de forma centralizada.' },
    { icon: <DollarSign className="w-8 h-8 text-green-500" />, title: 'Controle Financeiro', description: 'Gerencie dízimos, ofertas, orçamentos e gere relatórios financeiros completos.' },
    { icon: <GraduationCap className="w-8 h-8 text-purple-500" />, title: 'Jornada do Membro', description: 'Crie trilhas de crescimento personalizadas para o desenvolvimento espiritual de cada membro.' },
    { icon: <Heart className="w-8 h-8 text-red-500" />, title: 'Gestão de Ministérios', description: 'Organize ministérios, gerencie voluntários e crie escalas de serviço de forma simples.' },
    { icon: <Baby className="w-8 h-8 text-pink-500" />, title: 'Ministério Infantil', description: 'Faça o check-in e check-out seguro das crianças, com controle de alergias e contatos.' },
    { icon: <BarChart3 className="w-8 h-8 text-orange-500" />, title: 'Dashboards e Relatórios', description: 'Tenha uma visão clara do crescimento da sua igreja com dashboards intuitivos.' },
  ];

  const PlanCard = ({ plan }: { plan: SubscriptionPlan }) => (
    <Card className="flex flex-col border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle>{plan.nome}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">R$ {plan.preco_mensal.toFixed(2)}</span>
          <span className="text-muted-foreground">/mês</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 flex flex-col">
        <ul className="space-y-2 text-muted-foreground flex-grow">
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Até {plan.limite_membros} membros</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {plan.limite_quizes_por_etapa} quizzes por etapa</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {plan.limite_armazenamento_mb} MB de armazenamento</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Suporte via email</li>
        </ul>
        <Button asChild className="w-full mt-auto bg-blue-600 hover:bg-blue-700">
          <Link to={`/cadastrar-igreja?plano=${plan.id}`}>Escolher Plano</Link>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center">
          <Link to="/" className="flex items-center gap-2 mr-6">
            <img src="/lumina-logo.png" alt="Lumina Logo" className="h-8" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Funcionalidades</a>
            <a href="#pricing" className="text-muted-foreground transition-colors hover:text-foreground">Planos</a>
          </nav>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/cadastrar-igreja">Cadastre sua Igreja</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container flex flex-col items-center justify-center gap-6 py-20 text-center">
          <Badge variant="outline" className="py-1 px-3 rounded-lg">
            <Shield className="w-4 h-4 mr-2 text-blue-500" />
            A plataforma completa para a gestão da sua igreja
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tighter md:text-6xl">
            Ilumine a gestão da sua igreja com <span className="text-blue-600">Lumina</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Simplifique a administração, conecte seus membros e impulsione o crescimento da sua comunidade com uma ferramenta poderosa e intuitiva.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <a href="#pricing">Ver Planos</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Acessar Sistema</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Tudo que sua igreja precisa em um só lugar</h2>
            <p className="text-lg text-muted-foreground">
              Desde a gestão de membros e finanças até o acompanhamento do crescimento espiritual de cada um.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div key={i} className="flex flex-col items-start gap-4 rounded-lg border p-6">
                {feature.icon}
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container py-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Planos flexíveis para igrejas de todos os tamanhos</h2>
            <p className="text-lg text-muted-foreground">
              Escolha o plano que melhor se adapta à realidade da sua comunidade e comece a transformar sua gestão hoje mesmo.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingPlans ? (
              [1, 2, 3].map(i => (
                <Card key={i} className="flex flex-col">
                  <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-8 w-1/2 mt-2" /></CardHeader>
                  <CardContent className="space-y-4"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-10 w-full mt-4" /></CardContent>
                </Card>
              ))
            ) : (
              plans.map(plan => <PlanCard key={plan.id} plan={plan} />)
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <img src="/favicon.ico" alt="Lumina Icon" className="w-6 h-6" />
            <p className="text-center text-sm leading-loose md:text-left">
              © {new Date().getFullYear()} Lumina. Todos os direitos reservados.
            </p>
          </div>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/login">Termos de Serviço</Link>
            <Link to="/login">Política de Privacidade</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;