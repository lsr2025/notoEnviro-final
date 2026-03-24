"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
LayoutDashboard,
ClipboardList,
History,
User,
Map
} from "lucide-react"

const navItems = [
{
label: "Dashboard",
href: "/dashboard",
icon: LayoutDashboard,
},
{
label: "Log Activity",
href: "/log/new",
icon: ClipboardList,
},
{
label: "History",
href: "/history",
icon: History,
},
{
label: "Sites",
href: "/site",
icon: Map,
},
{
label: "Profile",
href: "/profile",
icon: User,
},
]

export default function Sidebar() {
const pathname = usePathname()

return (
<div className="w-64 bg-[#0F172A] border-r border-gray-800 flex flex-col p-4">
