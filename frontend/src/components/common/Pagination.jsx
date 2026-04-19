import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "./Button"

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className,
  ...props
}) => {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Go to previous page"
            className="gap-1 pl-2.5"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </li>
        
        {/* Simple pagination logic for now */}
        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1
          // Only show first, last, and pages near current
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <li key={page}>
                <Button
                    variant={currentPage === page ? "outline" : "ghost"}
                    size="icon"
                    onClick={() => onPageChange?.(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                >
                    {page}
                </Button>
              </li>
            )
          }
          if (page === currentPage - 2 || page === currentPage + 2) {
            return (
              <li key={page}>
                <span className="flex h-9 w-9 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              </li>
            )
          }
          return null
        })}

        <li>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Go to next page"
            className="gap-1 pr-2.5"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </nav>
  )
}

export { Pagination }
