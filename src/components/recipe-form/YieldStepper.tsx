import { HybridStepper, type HybridStepperProps } from '@/components/ui/hybrid-stepper'

export interface YieldStepperProps extends Omit<HybridStepperProps, 'defaultUnit'> {
  defaultUnit?: string
}

export function YieldStepper(props: YieldStepperProps) {
  return (
    <HybridStepper
      quantityPlaceholder="4"
      unitPlaceholder="servings"
      defaultUnit="servings"
      quantityAriaLabel="Yield quantity"
      unitAriaLabel="Yield unit"
      {...props}
    />
  )
}

export { HybridStepper }
