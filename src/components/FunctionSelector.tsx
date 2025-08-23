import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { XqyFunctionSummary } from "@/types/xqy"

interface FunctionSelectorProps {
  functions: XqyFunctionSummary[];
  onSelect: (func: XqyFunctionSummary | null) => void;
  disabled?: boolean;
}

export function FunctionSelector({ functions, onSelect, disabled }: FunctionSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedFunction, setSelectedFunction] = React.useState<XqyFunctionSummary | null>(null);

  const getUniqueFuncId = (func: XqyFunctionSummary) => `${func.module}::${func.name}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedFunction
            ? `${selectedFunction.module}: ${selectedFunction.name}`
            : "Select a function to analyze..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search function..." />
          <CommandList>
            <CommandEmpty>No function found.</CommandEmpty>
            <CommandGroup>
              {functions.map((func) => (
                <CommandItem
                  key={getUniqueFuncId(func)}
                  value={getUniqueFuncId(func)}
                  onSelect={() => {
                    setSelectedFunction(func);
                    onSelect(func);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedFunction && getUniqueFuncId(selectedFunction) === getUniqueFuncId(func)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground mr-2">{func.module}:</span>
                  <span title={func.path}>{func.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}