import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: "emerald" | "amber" | "blue" | "purple" | "rose" | "teal"
}

const colorMap = {
  emerald: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-500",
    text: "text-emerald-600",
    ring: "ring-emerald-500/10",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-500",
    text: "text-amber-600",
    ring: "ring-amber-500/10",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-500",
    text: "text-blue-600",
    ring: "ring-blue-500/10",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-500",
    text: "text-purple-600",
    ring: "ring-purple-500/10",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "bg-rose-500",
    text: "text-rose-600",
    ring: "ring-rose-500/10",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "bg-teal-500",
    text: "text-teal-600",
    ring: "ring-teal-500/10",
  },
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = "emerald" 
}: StatCardProps) {
  const styles = colorMap[color]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100 flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
        styles.bg
      )}>
        <Icon className={cn("w-6 h-6", styles.text)} />
      </div>
    </div>
  )
}
