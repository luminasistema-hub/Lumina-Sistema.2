import { Button } from "@/components/ui/button"
import { Church, Users, BookOpen, MessageCircle, ShieldCheck, Smartphone } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen flex flex-col">

      {/* Navbar */}
      <header className="w-full fixed top-0 bg-white/70 backdrop-blur-lg z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Lumina</h1>
          <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
            <a href="#features" className="hover:text-indigo-600">Recursos</a>
            <a href="#churches" className="hover:text-indigo-600">Igrejas</a>
            <a href="#contact" className="hover:text-indigo-600">Contato</a>
          </nav>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <a href="/login">Entrar</a>
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" asChild>
              <a href="/register">Criar conta grátis</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center pt-32 pb-20 max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12">
        {/* Texto */}
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold leading-tight text-gray-900">
            Organize sua <span className="text-indigo-600">igreja</span> em um só lugar
          </h1>
          <p className="text-lg text-gray-600 max-w-lg">
            Ministérios, escalas, check-in de crianças, devocionais, cursos EAD, doações e WhatsApp — tudo em uma única plataforma segura.
          </p>
          <div className="flex gap-4">
            <a href="/register" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow hover:bg-indigo-700 transition">
              Criar conta grátis
            </a>
            <a href="/login" className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition">
              Entrar
            </a>
          </div>
        </div>

        {/* Imagem */}
        <div className="relative">
          <img 
            src="/hero-igreja.png" 
            alt="Dashboard Lumina" 
            className="rounded-3xl shadow-2xl"
          />
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-indigo-200 rounded-full blur-2xl opacity-50"></div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-200 rounded-full blur-2xl opacity-50"></div>
        </div>
      </section>

      {/* Igrejas parceiras */}
      <section id="churches" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-8">Igrejas que confiam na Lumina</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 opacity-70">
            <img src="/logo1.png" alt="Igreja 1" className="h-10 mx-auto" />
            <img src="/logo2.png" alt="Igreja 2" className="h-10 mx-auto" />
            <img src="/logo3.png" alt="Igreja 3" className="h-10 mx-auto" />
            <img src="/logo4.png" alt="Igreja 4" className="h-10 mx-auto" />
            <img src="/logo5.png" alt="Igreja 5" className="h-10 mx-auto" />
            <img src="/logo6.png" alt="Igreja 6" className="h-10 mx-auto" />
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Tudo o que sua igreja precisa</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<Church />} title="Gestão de Ministérios" desc="Cadastre ministérios, líderes e voluntários; gerencie funções e demandas." />
            <FeatureCard icon={<Users />} title="Escalas de Serviço" desc="Crie escalas por evento ou ministério; confirme presença e atribuições." />
            <FeatureCard icon={<BookOpen />} title="Cursos e Devocionais" desc="Organize cursos EAD e publique devocionais para membros." />
            <FeatureCard icon={<MessageCircle />} title="WhatsApp Integrado" desc="Fila automática de mensagens por igreja para escalas, kids e recibos." />
            <FeatureCard icon={<Smartphone />} title="Dashboard por Função" desc="Painéis para admin, pastor e membros com métricas e atalhos." />
            <FeatureCard icon={<ShieldCheck />} title="Segurança por Igreja" desc="Supabase Auth + RLS: cada igreja vê apenas seus dados." />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-indigo-600 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Pronto para organizar sua igreja?</h2>
        <p className="mb-8 text-lg">Comece grátis agora mesmo e leve a gestão da sua igreja para o próximo nível.</p>
        <a href="/register" className="px-8 py-4 bg-white text-indigo-700 font-semibold rounded-xl shadow hover:bg-gray-100 transition">
          Criar conta grátis
        </a>
      </section>

      {/* Rodapé */}
      <footer className="py-6 bg-gray-900 text-gray-400 text-center text-sm">
        © {new Date().getFullYear()} Lumina. Todos os direitos reservados.
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: JSX.Element, title: string, desc: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 hover:shadow-lg transition">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  )
}
