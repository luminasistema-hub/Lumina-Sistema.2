import MainLayout from "@/components/layout/MainLayout"
import ListaEscalas from "@/components/escalas/ListaEscalas"

export default function EscalasPage() {
  return (
    <MainLayout activeModule="escalas">
      <ListaEscalas />
    </MainLayout>
  )
}
