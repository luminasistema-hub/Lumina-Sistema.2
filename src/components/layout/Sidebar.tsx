import { useState, useEffect } from "react";
import { useAuthStore, UserRole } from "../../stores/authStore";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Users, Calendar, DollarSign, Settings, Church, BookOpen, Heart,
  Baby, GraduationCap, User, Shield, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Home, Activity, ClipboardList, Link2, MessageSquareText,
  ClipboardSignature
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// 🔹 Tipos de módulos
interface ModuleItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  roles: UserRole[];
  status: "complete" | "development" | "basic";
}

interface ModuleCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  modules: ModuleItem[];
  defaultOpen?: boolean;
}

// 🔹 Definição das categorias
const moduleCategories: ModuleCategory[] = [
  {
    id: "personal",
    title: "Área Pessoal",
    icon: <User className="w-5 h-5" />,
    defaultOpen: true,
    modules: [
      { id: "personal-info", title: "Informações Pessoais", icon: <User className="w-4 h-4" />, roles: ["membro","lider_ministerio","pastor","admin","financeiro","voluntario","midia_tecnologia","integra"], status: "complete" },
      { id: "member-journey", title: "Jornada do Membro", icon: <GraduationCap className="w-4 h-4" />, roles: ["membro","lider_ministerio","pastor","admin","financeiro","voluntario","midia_tecnologia","integra"], status: "complete" },
      { id: "vocational-test", title: "Teste Vocacional", icon: <Heart className="w-4 h-4" />, roles: ["membro","lider_ministerio","pastor","admin","financeiro","voluntario","midia_tecnologia","integra"], status: "complete" },
      { id: "my-ministry", title: "Meu Ministério", icon: <ClipboardList className="w-4 h-4" />, roles: ["lider_ministerio","voluntario"], status: "complete" },
      { id: "my-gc", title: "Meu GC", icon: <Users className="w-4 h-4" />, roles: ["membro","lider_ministerio","pastor","admin","financeiro","voluntario","midia_tecnologia","integra","gestao_kids"], status: "complete" }
    ]
  },
  {
    id: "spiritual",
    title: "Crescimento Espiritual",
    icon: <BookOpen className="w-5 h-5" />,
    defaultOpen: true,
    modules: [
      { id: "events", title: "Eventos", icon: <Calendar className="w-4 h-4" />, roles: ["membro","lider_ministerio","pastor","admin","financeiro","voluntario","midia_tecnologia","integra"], status: "complete" },
      { id: "devotionals", title: "Devocionais", icon: <BookOpen className="w-4 h-4" />, roles: ["membro","lider_ministerio","pastor","admin","financeiro","voluntario","midia_tecnologia","integra"], status: "complete" }
    ]
  },
  {
    id: "contributions",
    title: "Contribuições",
    icon: <DollarSign className="w-5 h-5" />,
    modules: [
      { id: "offerings", title: "Ofertas e Doações", icon: <DollarSign className="w-4 h-4" />, roles: ["membro","lider_ministerio","pastor","admin","financeiro","voluntario","midia_tecnologia","integra"], status: "complete" }
    ]
  },
  {
    id: "management",
    title: "Gestão",
    icon: <Users className="w-5 h-5" />,
    defaultOpen: true,
    modules: [
      { id: "pastor-area", title: "Área do Pastor", icon: <ClipboardSignature className="w-4 h-4" />, roles: ["pastor", "admin"], status: "complete" },
      { id: "order-of-service", title: "Ordem de Culto/Eventos", icon: <ClipboardList className="w-4 h-4" />, roles: ["lider_ministerio","pastor","admin"], status: "complete" },
      { id: "member-management", title: "Gestão de Membros", icon: <Users className="w-4 h-4" />, roles: ["lider_ministerio","pastor","admin","integra"], status: "complete" },
      { id: "ministries", title: "Gestão de Ministério", icon: <Church className="w-4 h-4" />, roles: ["pastor","admin"], status: "complete" },
      { id: "growth-groups", title: "Grupos de Crescimento (GC)", icon: <Users className="w-4 h-4" />, roles: ["pastor","admin","lider_ministerio","gc_lider"], status: "complete" },
      { id: "financial-panel", title: "Painel Financeiro", icon: <DollarSign className="w-4 h-4" />, roles: ["pastor","admin","financeiro"], status: "complete" },
      { id: "journey-config", title: "Config. da Jornada", icon: <ClipboardList className="w-4 h-4" />, roles: ["admin","pastor", "integra"], status: "complete" },
      { id: "kids-management", title: "Gestão Kids", icon: <Baby className="w-4 h-4" />, roles: ["admin","pastor","lider_ministerio","gestao_kids"], status: "complete" },
      { id: "events-management", title: "Gestão de Eventos", icon: <Calendar className="w-4 h-4" />, roles: ["pastor","admin"], status: "complete" },
      { id: "devotionals-management", title: "Gestão de Devocionais", icon: <BookOpen className="w-4 h-4" />, roles: ["pastor","admin","lider_ministerio"], status: "complete" }
    ]
  },
  {
    id: "administration",
    title: "Administração",
    icon: <Settings className="w-5 h-5" />,
    modules: [
      { id: "notification-management", title: "Gestão de Notificações", icon: <MessageSquareText className="w-4 h-4" />, roles: ["admin", "pastor"], status: "basic" },
      { id: "system-settings", title: "Configurações", icon: <Settings className="w-4 h-4" />, roles: ["admin"], status: "basic" },
    ]
  }
];

// 🔹 Props da Sidebar
interface SidebarProps {
  activeModule?: string;
  onModuleSelect?: (moduleId: string) => void;
}

const Sidebar = ({ activeModule = "dashboard", onModuleSelect }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["personal","management","spiritual"]);
  const { user, currentChurchId } = useAuthStore();
  const [hasMyMinistryAccess, setHasMyMinistryAccess] = useState(false);
  const [hasMyGCAccess, setHasMyGCAccess] = useState(false);
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Colapsa a sidebar por padrão em telas pequenas
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
      setIsMasterMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkAccess = async () => {
      if (!user || !currentChurchId) {
        if (mounted) {
          setHasMyMinistryAccess(false);
          setHasMyGCAccess(false);
        }
        return;
      }
      // Se a role já for líder/voluntário, libera diretamente
      const byRole = user.role === "lider_ministerio" || user.role === "voluntario";
      // Verifica se é líder de algum ministério na igreja
      const { count: leaderCount } = await supabase
        .from("ministerios")
        .select("id", { count: "exact", head: true })
        .eq("id_igreja", currentChurchId)
        .eq("lider_id", user.id);
      // Verifica se é voluntário em algum ministério na igreja
      const { count: volunteerCount } = await supabase
        .from("ministerio_voluntarios")
        .select("id", { count: "exact", head: true })
        .eq("id_igreja", currentChurchId)
        .eq("membro_id", user.id);
      const hasAccess = byRole || (leaderCount || 0) > 0 || (volunteerCount || 0) > 0;
      if (mounted) setHasMyMinistryAccess(hasAccess);

      // Verifica participação em GC (membro ou líder) na igreja atual
      const { count: gcMemberCount } = await supabase
        .from("gc_group_members")
        .select("id", { count: "exact", head: true })
        .eq("id_igreja", currentChurchId)
        .eq("membro_id", user.id);
      const { count: gcLeaderCount } = await supabase
        .from("gc_group_leaders")
        .select("id", { count: "exact", head: true })
        .eq("id_igreja", currentChurchId)
        .eq("membro_id", user.id);
      const hasGC = (gcMemberCount || 0) > 0 || (gcLeaderCount || 0) > 0;
      if (mounted) setHasMyGCAccess(hasGC);
    };
    checkAccess();
    return () => { mounted = false; };
  }, [user, currentChurchId]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  // CORREÇÃO: Lógica de clique simplificada para notificar o DashboardPage
  const handleModuleClick = (moduleId: string) => {
    if (moduleId === "master-admin") {
      navigate("/master-admin");
    } else {
      onModuleSelect?.(moduleId);
    }
  };

  const getRoleLabel = (role: UserRole) => ({
    "super_admin": "Super Admin", "admin": "Admin", "pastor": "Pastor", "lider_ministerio": "Líder",
    "financeiro": "Financeiro", "voluntario": "Voluntário", "midia_tecnologia": "Mídia",
    "integra": "Integração", "gestao_kids": "Gestão Kids", "membro": "Membro",
    "gc_membro": "Membro GC", "gc_lider": "Líder GC"
  }[role] || "");

  const getUserModules = (modules: ModuleItem[]) => {
    if (!user) return [];
    return modules.filter(module => {
      if (module.id === "my-ministry") {
        // Mostrar apenas se tiver acesso por role ou vínculo (líder/voluntário) com algum ministério
        return hasMyMinistryAccess;
      }
      if (module.id === "my-gc") {
        // Mostrar apenas se o usuário for integrante (membro/líder) de algum GC da igreja atual
        return hasMyGCAccess;
      }
      const byRole = module.roles.includes(user.role);
      const byExtra = Array.isArray(user.extraPermissions) && user.extraPermissions.includes(module.id);
      return byRole || byExtra;
    });
  };

  const getUserCategories = () => {
    return moduleCategories.filter(category => getUserModules(category.modules).length > 0);
  };

  // Atualiza lista de roles do item 'Meu GC' para incluir os novos papéis
  moduleCategories[0].modules = moduleCategories[0].modules.map(m => 
    m.id === "my-gc" 
      ? { ...m, roles: [...m.roles, "gc_membro", "gc_lider"] as UserRole[] }
      : m
  );

  if (!user) return null;

  return (
    <div className={cn(
      "h-screen bg-white border-r flex flex-col transition-all duration-300 overflow-x-hidden min-w-0",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img src="/favicon.ico" alt="Lumina Logo" className="h-8 w-8" />
            <div className="min-w-0">
              <h1 className="font-bold truncate">Lumina</h1>
              <p className="text-xs text-gray-500 truncate">Sistema de Gestão</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Usuário logado */}
      {!isCollapsed && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name || "Usuário"}</p>
              <Badge className="text-xs">{getRoleLabel(user?.role)}</Badge>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 truncate">📍 {user?.churchName || "Painel Master"}</p>
        </div>
      )}

      {/* Conteúdo da Sidebar */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {/* Dashboard */}
        <div className="px-4 mb-4">
          <Button
            variant={activeModule === "dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleModuleClick("dashboard")}
          >
            <Home className="w-4 h-4" />
            {!isCollapsed && <span className="ml-3 truncate">Dashboard</span>}
          </Button>
        </div>

        {/* Painel Master só para super_admin */}
        {user?.role === "super_admin" && (
          <div className="px-4 mb-2">
            <Button
              variant={activeModule === "master-admin" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigate("/master-admin")}
            >
              <Shield className="w-4 h-4" />
              {!isCollapsed && <span className="ml-3">Painel Master</span>}
            </Button>

            {/* Submenu com módulos do Painel Master */}
            {!isCollapsed && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-between mt-1"
                  onClick={() => setIsMasterMenuOpen((v) => !v)}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Módulos do Painel Master</span>
                  </div>
                  {isMasterMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                {isMasterMenuOpen && (
                  <div className="px-2 ml-6 space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm truncate"
                      onClick={() => navigate("/master-admin?tab=overview")}
                    >
                      <Activity className="w-4 h-4" />
                      <span className="ml-2">Visão Geral</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm truncate"
                      onClick={() => navigate("/master-admin?tab=churches")}
                    >
                      <Church className="w-4 h-4" />
                      <span className="ml-2">Igrejas</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm truncate"
                      onClick={() => navigate("/master-admin?tab=plans")}
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span className="ml-2">Planos</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm truncate"
                      onClick={() => navigate("/master-admin?tab=database")}
                    >
                      <Link2 className="w-4 h-4" />
                      <span className="ml-2">Banco de Dados</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm truncate"
                      onClick={() => navigate("/master-admin?tab=tools")}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="ml-2">Ferramentas Admin</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm truncate"
                      onClick={() => navigate("/master-admin?tab=reports")}
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span className="ml-2">Relatórios SaaS</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Categorias + Módulos */}
        <div className="space-y-2">
          {getUserCategories().map((category) => {
            const userModules = getUserModules(category.modules);
            if (userModules.length === 0) return null;
            const isExpanded = expandedCategories.includes(category.id);

            return (
              <div key={category.id}>
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <span>{category.title}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
                {(isCollapsed || isExpanded) && (
                  <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-4 ml-4")}>
                    {userModules.map((module) => (
                      <Button
                        key={module.id}
                        variant={activeModule === module.id ? "secondary" : "ghost"}
                        className="w-full justify-start text-sm truncate"
                        onClick={() => handleModuleClick(module.id)}
                        title={isCollapsed ? module.title : undefined}
                      >
                        <div className="flex items-center gap-2 w-full min-w-0">
                          {module.icon}
                          {!isCollapsed && <span className="ml-1 flex-1 truncate">{module.title}</span>}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;