import { useState, useEffect } from 'react'

interface CostSummaryProps {
  subtotal: number
}

export function CostSummary({ subtotal }: CostSummaryProps): React.JSX.Element {
  const [taxRates, setTaxRates] = useState({
    provincialRate: 9.975,
    provincialLabel: 'QST',
    federalRate: 5,
    federalLabel: 'GST'
  })

  useEffect(() => {
    window.api.settings
      .getMultiple([
        'tax_provincial_rate',
        'tax_provincial_label',
        'tax_federal_rate',
        'tax_federal_label'
      ])
      .then((settings) => {
        setTaxRates({
          provincialRate: parseFloat(settings['tax_provincial_rate'] || '9.975'),
          provincialLabel: settings['tax_provincial_label'] || 'QST',
          federalRate: parseFloat(settings['tax_federal_rate'] || '5'),
          federalLabel: settings['tax_federal_label'] || 'GST'
        })
      })
  }, [])

  const provincialTax = subtotal * (taxRates.provincialRate / 100)
  const federalTax = subtotal * (taxRates.federalRate / 100)
  const total = subtotal + provincialTax + federalTax

  return (
    <div className="flex flex-col items-end gap-1 text-[13px]">
      <div className="flex items-center gap-6">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium w-24 text-right">${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-muted-foreground">
          {taxRates.provincialLabel} ({taxRates.provincialRate}%)
        </span>
        <span className="w-24 text-right">${provincialTax.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-muted-foreground">
          {taxRates.federalLabel} ({taxRates.federalRate}%)
        </span>
        <span className="w-24 text-right">${federalTax.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-6 pt-1 border-t border-border/50 mt-1">
        <span className="font-semibold">Total</span>
        <span className="font-semibold w-24 text-right text-primary">${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
