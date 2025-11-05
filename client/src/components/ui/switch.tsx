import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "./utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-[25px] w-[44px] shrink-0 cursor-pointer items-center rounded-[30px] border transition-all duration-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=unchecked]:bg-[#2d2d2d] data-[state=unchecked]:border-[#555]",
      "data-[state=checked]:bg-red-600 data-[state=checked]:border-transparent",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[20px] w-[20px] rounded-[16px] bg-white shadow-[0_2px_5px_rgba(0,0,0,0.3)] transition-transform duration-400",
        "data-[state=unchecked]:translate-x-[2px]",
        "data-[state=checked]:translate-x-[22px]"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };

