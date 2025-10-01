import React, { useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, previewUrl, setPreviewUrl }) => {
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ errors }) => {
        errors.forEach(err => {
          if (err.code === 'file-too-large') {
            toast.error('Arquivo muito grande. O tamanho máximo é 5MB.')
          } else {
            toast.error(err.message)
          }
        })
      })
      return;
    }

    const file = acceptedFiles[0]
    if (file) {
      onFileSelect(file)
      const newPreviewUrl = URL.createObjectURL(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(newPreviewUrl)
    }
  }, [onFileSelect, setPreviewUrl, previewUrl])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  })

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onFileSelect(null);
    setPreviewUrl(null);
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
      ${isDragActive ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <div className="relative inline-block">
          <img src={previewUrl} alt="Preview" className="mx-auto max-h-40 rounded-md" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <UploadCloud className="h-10 w-10" />
          <p className="font-semibold">Clique ou arraste a imagem aqui</p>
          <p className="text-xs">PNG, JPG até 5MB</p>
        </div>
      )}
    </div>
  )
}