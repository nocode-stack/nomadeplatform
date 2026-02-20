
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const getProgressColor = (value: number = 0) => {
  if (value >= 90) return 'bg-green-500'; // Verde para 90-100%
  if (value >= 70) return 'bg-lime-500';  // Verde lima para 70-89%
  if (value >= 50) return 'bg-yellow-500'; // Amarillo para 50-69%
  if (value >= 30) return 'bg-orange-500'; // Naranja para 30-49%
  return 'bg-red-500'; // Rojo para 0-29%
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all",
        getProgressColor(value)
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
