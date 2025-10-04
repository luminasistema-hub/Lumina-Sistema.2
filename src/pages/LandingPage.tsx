import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Users, CalendarCheck2, Baby, BookOpen, HandCoins, MessageSquare, ShieldCheck, Zap, ArrowRight
} from "lucide-react";

const Feature = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) => (
  <Card className="h-full">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="inline-flex items-center justify-center rounded-md bg-primary/10 text-primary p-2">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </CardContent>
  </Card>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 pt-16 pb-10 md:pt-24 md:pb-20">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-primary/15 text-primary hover:bg-primary/15">
              Sistema de Gestão para Igrejas
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Organize sua igreja em um só lugar
            </h1>
            <p className="mt-4 text-muted-foreground text-base md:text-lg">
              Ministérios, escalas, Kids check-in/out, devocionais, cursos EAD, doações com recibo e integração WhatsApp — tudo com segurança e controle por igreja.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/login">
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/register">Criar conta</Link>
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                RLS com Supabase
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Realtime e filas de mensagens
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Tudo o que sua igreja precisa
          </h2>
          <p className="mt-2 text-muted-foreground">
            Funcionalidades pensadas para líderes, voluntários e membros — simples, seguras e integradas.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Feature
            icon={Users}
            title="Gestão de Ministérios"
            desc="Cadastre ministérios, líderes e voluntários; gerencie funções e demandas."
          />
          <Feature
            icon={CalendarCheck2}
            title="Escalas de Serviço"
            desc="Crie escalas por evento e ministério; confirme presença e visualize atribuições."
          />
          <Feature
            icon={Baby}
            title="Kids Check-in/Out"
            desc="Check-in com código de segurança e histórico de presença por criança."
          />
          <Feature
            icon={BookOpen}
            title="Devocionais e Cursos"
            desc="Publique devocionais e organize trilhas/cursos com módulos e aulas."
          />
          <Feature
            icon={HandCoins}
            title="Doações e Recibos"
            desc="Registre ofertas e emita recibos; acompanhe transações e relatórios."
          />
          <Feature
            icon={MessageSquare}
            title="WhatsApp Integrado"
            desc="Templates por igreja e fila de envio automático para escala, kids e recibos."
          />
          <Feature
            icon={LayoutDashboard}
            title="Dashboard por Função"
            desc="Painéis para admin/pastor e membros com métricas, atalhos e status."
          />
          <Feature
            icon={ShieldCheck}
            title="Segurança por Igreja"
            desc="Autenticação Supabase e RLS: cada igreja vê apenas seus próprios dados."
          />
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <Badge variant="secondary">1</Badge>
                <h3 className="mt-3 font-semibold">Configure sua igreja</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cadastre ministérios, eventos e preferências. Defina líderes e papéis.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Badge variant="secondary">2</Badge>
                <h3 className="mt-3 font-semibold">Convide membros</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Voluntários ajustam dados pessoais e recebem atribuições pelas escalas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Badge variant="secondary">3</Badge>
                <h3 className="mt-3 font-semibold">Automatize notificações</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enfileire mensagens de escala, kids e recibos — com templates por igreja.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link to="/login">
                Acessar painel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Depoimento breve */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="max-w-3xl">
            <blockquote className="text-lg md:text-xl leading-relaxed">
              “Conseguimos reduzir a bagunça em escalas e comunicação com voluntários. O check-in das crianças ficou muito mais seguro e prático.”
            </blockquote>
            <p className="mt-3 text-sm text-muted-foreground">— Equipe de liderança</p>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Connect Vida. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="text-primary hover:underline">Entrar</Link>
            <Link to="/register" className="text-primary hover:underline">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;