import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '../../stores/toast.store'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
}

const colors = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-primary'
}

function ToastItem({ toast }: { toast: Toast }): React.JSX.Element {
  const { removeToast } = useToastStore()
  const Icon = icons[toast.type]

  return (
    <div
      className="animate-toast-slide-in surface-elevated flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm cursor-pointer"
      onClick={() => removeToast(toast.id)}
    >
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colors[toast.type]}`} />
      <p className="text-[13px] text-foreground leading-snug flex-1">{toast.message}</p>
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeToast(toast.id)
        }}
        className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ToastContainer(): React.JSX.Element | null {
  const { toasts } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
