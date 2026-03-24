"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  History,
  User,
  Map,
  Menu,
  LogOut,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Log Activity", href: "/log/new", icon: ClipboardList },
  { label: "History", href: "/history", icon: History },
  { label: "Sites", href: "/site", icon: Map },
  { label: "Profile", href: "/profile", icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Don't show sidebar on login page
  if (pathname === "/") return null

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-yami-navy flex items-center px-4 z-40 border-b border-white/10">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 text-white/70 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 ml-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
             <span className="text-yami-navy font-bold text-xs">NE</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide">NOTOENVIRO</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 h-screen w-[260px] z-50 flex flex-col transition-transform duration-300 ease-out bg-yami-navy border-r border-white/5",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo Area */}
        <div className="px-6 pt-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-yami-navy font-black text-xl">NE</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight tracking-wide">NOTOENVIRO</h1>
              <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase">Solutions</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden ml-auto p-2 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-yami-blue text-white shadow-lg shadow-yami-blue/20" 
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-white/30 group-hover:text-white/60"
                  )} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-yami-blue flex items-center justify-center text-white text-sm font-bold shrink-0">
              N
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">NotoEnviro</p>
              <p className="text-white/30 text-[11px] truncate">Admin Dashboard</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
