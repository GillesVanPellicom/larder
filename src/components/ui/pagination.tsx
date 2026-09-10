import * as React from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"button">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      size={size}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "h-10 w-10 sm:h-8.5 sm:w-8.5 rounded-lg text-sm sm:text-xs font-semibold cursor-pointer transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-xs"
          : "border-border hover:bg-muted text-foreground",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Previous page"
      title="Previous"
      className={cn(
        "h-10 w-10 sm:h-8.5 sm:w-8.5 rounded-lg border-border cursor-pointer hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
    </Button>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Next page"
      title="Next"
      className={cn(
        "h-10 w-10 sm:h-8.5 sm:w-8.5 rounded-lg border-border cursor-pointer hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <ChevronRight className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
    </Button>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex h-8.5 w-6 items-center justify-center text-muted-foreground select-none",
        className
      )}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export interface PaginationControlProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  className?: string
}

function getPaginationRange(current: number, total: number): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', total]
  }

  if (current >= total - 3) {
    return [1, 'ellipsis-start', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, 'ellipsis-start', current - 1, current, current + 1, 'ellipsis-end', total]
}

export function PaginationControl({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [6, 12, 24, 48, 96],
  onPageChange,
  onPageSizeChange,
  className = '',
}: PaginationControlProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  const range = getPaginationRange(currentPage, totalPages)

  return (
    <div
      className={cn(
        "relative flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border mt-2 select-none",
        className
      )}
    >
      {/* Left: Rows per page & range summary (Text hidden on mobile) */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground self-center sm:self-auto">
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value))
              onPageChange(1)
            }}
            aria-label="Rows per page"
            title="Rows per page"
            className="h-8 rounded-lg border border-border bg-card px-2 py-0.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer shadow-2xs hover:bg-muted/30 transition-colors"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {totalItems > 0 && (
          <span className="text-muted-foreground/80 font-medium">
            {startItem}–{endItem} of {totalItems}
          </span>
        )}
      </div>

      {/* Center: Horizontally Centered Page Navigation (Numbers & Chevrons) */}
      <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex justify-center w-full sm:w-auto">
        <Pagination className="mx-auto w-auto justify-center">
          <PaginationContent>
            {/* Previous Chevron Only */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              />
            </PaginationItem>

            {/* Page numbers & Ellipsis */}
            {range.map((item, idx) => {
              if (item === 'ellipsis-start' || item === 'ellipsis-end') {
                return (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              return (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={currentPage === item}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            {/* Next Chevron Only */}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}

