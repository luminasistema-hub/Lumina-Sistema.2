import { Card } from "@/components/ui/card";
import { User, Crown, Clock } from "lucide-react";

export interface Voluntario {
  id: string;
  email: string;
  papel: "lider" | "voluntario" | "pendente";
  status: string; // espelha papel
}

interface Props {
  voluntario: Voluntario;
  onClick: () => void;
}

export const VoluntarioCard = ({ voluntario, onClick }: Props) => {
  return (
    <Card
      className="p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <User className="h-5 w-5 text-primary" />
        <div>
          <p className="font-medium text-foreground">{voluntario.email}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {voluntario.papel === "lider" && (
              <span className="flex items-center gap-1 text-yellow-600">
                <Crown className="h-3 w-3" /> Líder
              </span>
            )}
            {voluntario.papel === "voluntario" && "Voluntário"}
            {voluntario.papel === "pendente" && (
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="h-3 w-3" /> Pendente
              </span>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
};
