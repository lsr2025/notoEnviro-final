import type { Metadata } from 'next'
import './globals.css'
import Sidebar from './components/Sidebar'

export const metadata: Metadata = {
title: 'NotoEnviro | SEF Eco-Worker Tracking',
description: 'Environmental field data tracking for Social Employment Fund',
}

export default function RootLayout({
children,
}: {
children: React.ReactNode
}) {
return (
<html lang="en">
<body className="bg-[#0B0F19] text-white">
