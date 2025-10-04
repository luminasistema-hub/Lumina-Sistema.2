import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Zap,
  ArrowRight,
  Sparkles,
  PhoneCall,
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
  <Card className="h-full transition-transform hover:translate-y-[-2px] hover:shadow-lg">
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

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-2xl md:text-3xl font-bold">{value}</div>
    <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
  </div>
);

const LandingPage = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleContatoWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      toast.error("Preencha nome, e-mail e mensagem.");
      return;
    }
    const texto = `Olá! Sou ${nome} (${email}).%0A%0A${mensagem}%0A%0AEnviado pelo site.`;
    const telefone = "5563984861923";
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    toast.success("Abrindo WhatsApp...");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background decor */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[300px] w-[300px] rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="container mx-auto px-4 pt-14 md:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-background/60 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Novo • Integração WhatsApp com fila por igreja</span>
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight">
              Organize sua igreja em um só lugar
            </h1>
            <p className="mt-4 text-muted-foreground text-base md:text-lg">
              Ministérios, escalas, Kids check-in/out, devocionais, cursos EAD, doações com recibo e WhatsApp — tudo com segurança e RLS por igreja.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="shadow-md hover:shadow-lg">
                <Link to="/login">
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="backdrop-blur">
                <Link to="/register">Criar conta</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="sm:ml-2" >
                <a href="#contato">
                  Contato
                  <PhoneCall className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-3 max-w-xl mx-auto gap-4">
              <Stat value="100%" label="RLS por igreja" />
              <Stat value="60s" label="Fila WhatsApp" />
              <Stat value="24/7" label="Online" />
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
            desc="Templates por igreja e fila automática para escala, kids e recibos."
          />
          <Feature
            icon={LayoutDashboard}
            title="Dashboard por Função"
            desc="Painéis para admin/pastor e membros com métricas e atalhos."
          />
          <Feature
            icon={ShieldCheck}
            title="Segurança por Igreja"
            desc="Supabase Auth + RLS: cada igreja vê apenas seus dados."
          />
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background/70">
              <CardContent className="p-6">
                <Badge variant="secondary">1</Badge>
                <h3 className="mt-3 font-semibold">Configure sua igreja</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cadastre ministérios, eventos e preferências. Defina líderes e papéis.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/70">
              <CardContent className="p-6">
                <Badge variant="secondary">2</Badge>
                <h3 className="mt-3 font-semibold">Convide membros</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Voluntários ajustam dados pessoais e recebem atribuições pelas escalas.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/70">
              <CardContent className="p-6">
                <Badge variant="secondary">3</Badge>
                <h3 className="mt-3 font-semibold">Automatize notificações</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fila de envio a cada 60s para escala, kids e recibos — com templates por igreja.
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

      {/* Contato */}
      <section id="contato" className="border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Fale conosco
            </h2>
            <p className="mt-2 text-muted-foreground">
              Envie sua mensagem e fale direto no nosso WhatsApp. Responderemos o quanto antes.
            </p>
          </div>
          <div className="mt-6">
            <Card className="bg-background/70">
              <CardContent className="p-6">
                <form className="grid md:grid-cols-2 gap-4" onSubmit={handleContatoWhatsApp}>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="mensagem">Mensagem</Label>
                    <Textarea id="mensagem" placeholder="Como podemos ajudar?" value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="min-h-[120px]" />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full md:w-auto">
                      Falar no WhatsApp
                      <MessageSquare className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enviaremos sua mensagem para o WhatsApp +55 63 98486-1923 automaticamente.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimento breve */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="max-w-3xl">
            <blockquote className="text-lg md:text-xl leading-relaxed">
              "Conseguimos reduzir a bagunça em escalas e comunicação com voluntários. O check-in das crianças ficou muito mais seguro e prático."
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