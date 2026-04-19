import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, FileText, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

const FileUpload = ({
  onFilesChange,
  maxFiles = 5,
  accept = { "image/*": [".jpg", ".jpeg", ".png"] },
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  supportText = "Support JPG, PNG",
}) => {
  const [files, setFiles] = React.useState([])

  const onDrop = React.useCallback(
    (acceptedFiles) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
      setFiles(newFiles)
      onFilesChange?.(newFiles)
    },
    [files, maxFiles, onFilesChange]
  )

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept,
    maxSize,
  })

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="bg-primary/10 p-3 rounded-full mb-4">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold text-slate-800">
          {isDragActive ? "Drop the files here" : "Drag & drop files here"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {supportText} (Max {maxSize / (1024 * 1024)}MB per file, up to {maxFiles} files)
        </p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-slate-100 p-2 rounded-lg shrink-0">
                  <FileText className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate pr-2">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(i)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { FileUpload }
