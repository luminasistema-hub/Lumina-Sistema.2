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
      { id: "my-ministry", title: "Meu Ministério", icon: <ClipboardList className="w-4 h-4" />, roles: ["lider_ministerio","voluntario"], status: "complete" }
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
      { id: "financial-panel", title: "Painel Financeiro", icon: <DollarSign className="w-4 h-4" />, roles: ["pastor","admin","financeiro"], status: "complete" },
      { id: "journey-config", title: "Config. da Jornada", icon: <ClipboardList className="w-4 h-4" />, roles: ["admin","pastor", "integra"], status: "complete" },
      { id: "kids-management", title: "Gestão Kids", icon: <Baby className="w-4 h-4" />, roles: ["admin","pastor","lider_ministerio"], status: "complete" },
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
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const checkAccess = async () => {
      if (!user || !currentChurchId) {
        if (mounted) setHasMyMinistryAccess(false);
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
    "integra": "Integração", "membro": "Membro"
  }[role] || "");

  const getUserModules = (modules: ModuleItem[]) => {
    if (!user) return [];
    return modules.filter(module => {
      if (module.id === "my-ministry") {
        // Mostrar apenas se tiver acesso por role ou vínculo (líder/voluntário) com algum ministério
        return hasMyMinistryAccess;
      }
      return module.roles.includes(user.role);
    });
  };

  const getUserCategories = () => {
    return moduleCategories.filter(category => getUserModules(category.modules).length > 0);
  };

  if (!user) return null;

  return (
    <div className={cn(
      "h-screen bg-white border-r flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img src="/favicon.ico" alt="Lumina Logo" className="h-8 w-8" />
            <div>
              <h1 className="font-bold">Lumina</h1>
              <p className="text-xs text-gray-500">Sistema de Gestão</p>
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
      <div className="flex-1 overflow-y-auto py-4">
        {/* Dashboard */}
        <div className="px-4 mb-4">
          <Button
            variant={activeModule === "dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleModuleClick("dashboard")}
          >
            <Home className="w-4 h-4" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </Button>
        </div>

        {/* Painel Master só para super_admin */}
        {user?.role === "super_admin" && (
          <div className="px-4 mb-4">
            <Button
              variant={activeModule === "master-admin" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleModuleClick("master-admin")}
            >
              <Shield className="w-4 h-4" />
              {!isCollapsed && <span className="ml-3">Painel Master</span>}
            </Button>
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
                        className="w-full justify-start text-sm"
                        onClick={() => handleModuleClick(module.id)}
                        title={isCollapsed ? module.title : undefined}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {module.icon}
                          {!isCollapsed && <span className="ml-1 flex-1">{module.title}</span>}
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