import { useState, useEffect } from 'react'
import { NewEvent } from '@/types/event'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/ui/ImageUploader'

interface EventFormProps {
  onSubmit: (eventData: NewEvent, coverFile: File | null) => void;
  initialData?: Partial<NewEvent>;
  isSubmitting: boolean;
}

export const EventForm = ({ onSubmit, initialData, isSubmitting }: EventFormProps) => {
  const [eventData, setEventData] = useState<Partial<NewEvent>>(initialData || {})
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imagem_capa || null)

  useEffect(() => {
    if (initialData) {
      setEventData(initialData)
      setPreviewUrl(initialData.imagem_capa || null)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(eventData as NewEvent, coverFile)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEventData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Evento *</Label>
        <Input id="nome" name="nome" value={eventData.nome || ''} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" value={eventData.descricao || ''} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_hora">Data e Hora *</Label>
          <Input id="data_hora" name="data_hora" type="datetime-local" value={eventData.data_hora || ''} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="local">Local</Label>
          <Input id="local" name="local" value={eventData.local || ''} onChange={handleChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vagas">Vagas (0 para ilimitado)</Label>
          <Input id="vagas" name="vagas" type="number" value={eventData.vagas || 0} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input id="valor" name="valor" type="number" step="0.01" value={eventData.valor || 0} onChange={handleChange} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="link_externo">Link Externo (opcional)</Label>
        <Input id="link_externo" name="link_externo" value={eventData.link_externo || ''} onChange={handleChange} placeholder="Ex: Link do Zoom, Sympla, etc." />
      </div>
      <div className="space-y-2">
        <Label>Imagem de Capa</Label>
        <ImageUploader onFileSelect={setCoverFile} previewUrl={previewUrl} setPreviewUrl={setPreviewUrl} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Salvando...' : 'Salvar Evento'}
      </Button>
    </form>
  )
}