import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-slate-50 p-12 text-center animate-in fade-in zoom-in duration-500",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-8 ring-slate-100/50">
          <Icon className="h-10 w-10 text-slate-300" />
        </div>
      )}
      <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-800">{title}</h3>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="rounded-full shadow-lg">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
