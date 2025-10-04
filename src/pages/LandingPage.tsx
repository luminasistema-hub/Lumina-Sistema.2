// src/pages/LandingPage.tsx
import { Link } from "react-router-dom"
import { Church, Users, BookOpen, MessageCircle, ShieldCheck, Smartphone } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen flex flex-col">

      {/* Hero */}
      <section className="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-20">
        {/* Texto */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <span className="inline-block text-indigo-600 font-semibold text-sm bg-indigo-100 px-3 py-1 rounded-full">
            Plataforma integrada
          </span>
          <h1 className="text-5xl font-extrabold leading-tight text-gray-900">
            Solução moderna para <span className="text-indigo-600">igrejas</span> em expansão
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
            Ministérios, escalas, check-in de crianças, devocionais, cursos EAD, doações e WhatsApp — 
            tudo em uma única plataforma segura e simples de usar.
          </p>
          <div className="flex gap-4 justify-center lg:justify-start">
            <Link
              to="/contato"
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow hover:bg-indigo-700 transition"
            >
              Quero conhecer
            </Link>
            <Link
              to="/demo"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition"
            >
              Agendar demonstração
            </Link>
          </div>
        </div>

        {/* Imagem */}
        <div className="flex-1 relative mt-10 lg:mt-0">
          <img
            src="/hero-igreja.png"
            alt="Painel Lumina"
            className="rounded-3xl shadow-2xl"
          />
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-indigo-200 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-60"></div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 text-center gap-8">
          <Stat number="100%" text="RLS por igreja" />
          <Stat number="60s" text="Fila WhatsApp" />
          <Stat number="24/7" text="Disponibilidade" />
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Tudo o que sua igreja precisa</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Church className="w-8 h-8" />}
              title="Gestão de Ministérios"
              desc="Cadastre ministérios, líderes e voluntários; gerencie funções e demandas."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Escalas de Serviço"
              desc="Crie escalas por evento ou ministério; confirme presença e atribuições."
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Cursos e Devocionais"
              desc="Organize cursos EAD e publique devocionais para membros."
            />
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8" />}
              title="WhatsApp Integrado"
              desc="Fila automática de mensagens por igreja para escalas, kids e recibos."
            />
            <FeatureCard
              icon={<Smartphone className="w-8 h-8" />}
              title="Dashboard por Função"
              desc="Painéis para admin, pastor e membros com métricas e atalhos."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              title="Segurança por Igreja"
              desc="Supabase Auth + RLS: cada igreja vê apenas seus dados."
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-indigo-600 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Pronto para modernizar sua gestão?</h2>
        <p className="mb-8 text-lg">Entre em contato e veja como transformar a organização da sua igreja.</p>
        <Link
          to="/contato"
          className="px-8 py-4 bg-white text-indigo-700 font-semibold rounded-xl shadow hover:bg-gray-100 transition"
        >
          Quero conhecer
        </Link>
      </section>

      {/* Rodapé */}
      <footer className="py-6 bg-gray-900 text-gray-400 text-center text-sm">
        © {new Date().getFullYear()} Lumina. Todos os direitos reservados.
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: JSX.Element; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  )
}

function Stat({ number, text }: { number: string; text: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-indigo-600">{number}</p>
      <p className="text-gray-600">{text}</p>
    </div>
  )
}
