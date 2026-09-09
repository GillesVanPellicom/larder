"use client"

import * as React from "react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { cn } from "cn"

export interface MultiComboboxProps {
  options: string[]
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSelected?: number
  ariaLabel?: string
  emptyMessage?: string
  id?: string
}

export function MultiCombobox({
  options,
  values,
  onValuesChange,
  placeholder = "Select...",
  className,
  disabled = false,
  maxSelected,
  ariaLabel,
  emptyMessage = "No items found.",
  id,
}: MultiComboboxProps) {
  const anchor = useComboboxAnchor()

  const handleValueChange = (nextValues: string[]) => {
    let resolved = nextValues
    if (maxSelected === 1 && nextValues.length > 1) {
      resolved = [nextValues[nextValues.length - 1]]
    } else if (maxSelected !== undefined && nextValues.length > maxSelected) {
      return
    }
    if (JSON.stringify(resolved) !== JSON.stringify(values)) {
      onValuesChange(resolved)
    }
  }

  const isAtLimit = maxSelected !== undefined && values.length >= maxSelected

  return (
    <Combobox
      multiple
      autoHighlight
      items={options}
      value={values}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <ComboboxChips
        ref={anchor}
        className={cn(
          "w-full cursor-text",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <ComboboxValue>
          {(currentValues: string[]) => (
            <React.Fragment>
              {(currentValues || []).map((value: string) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={id}
                placeholder={currentValues?.length ? "" : placeholder}
                aria-label={ariaLabel || placeholder}
                disabled={disabled || (isAtLimit && maxSelected !== 1)}
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor} className="w-[var(--anchor-width)] min-w-[200px]">
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => {
            const isSelected = values.includes(item)
            const disabledItem = !isSelected && isAtLimit && maxSelected !== 1
            return (
              <ComboboxItem
                key={item}
                value={item}
                disabled={disabledItem}
                className={cn(
                  "text-xs cursor-pointer",
                  disabledItem && "opacity-40 cursor-not-allowed"
                )}
              >
                {item}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
