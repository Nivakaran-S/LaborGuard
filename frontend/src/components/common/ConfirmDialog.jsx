import * as React from "react"
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalTitle, 
  ModalDescription 
} from "./Modal"
import { Button } from "./Button"
import { AlertTriangle, Info, CheckCircle2, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive", // default, destructive, info, success
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="h-6 w-6 text-destructive" />
      case "info":
        return <Info className="h-6 w-6 text-blue-500" />
      case "success":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />
      default:
        return <HelpCircle className="h-6 w-6 text-primary" />
    }
  }

  const getBgColor = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive/10"
      case "info":
        return "bg-blue-50"
      case "success":
        return "bg-green-50"
      default:
        return "bg-primary/10"
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <ModalContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-6 pt-8 text-center flex flex-col items-center">
            <div className={cn("p-4 rounded-full mb-6 ring-8 ring-slate-50", getBgColor())}>
                {getIcon()}
            </div>
            
            <ModalHeader className="text-center sm:text-center space-y-3 mb-6">
                <ModalTitle className="text-2xl font-black text-slate-800">{title}</ModalTitle>
                <ModalDescription className="text-base text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                    {description}
                </ModalDescription>
            </ModalHeader>
        </div>

        <ModalFooter className="bg-slate-50 p-4 sm:p-6 sm:flex-row-reverse sm:justify-start gap-3 border-t">
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            loading={isLoading}
            className="rounded-full px-8 font-bold shadow-md"
          >
            {confirmLabel}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full px-8 font-bold text-slate-500"
          >
            {cancelLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export { ConfirmDialog }
