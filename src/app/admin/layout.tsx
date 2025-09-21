"use client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toaster from "@/components/toast/Toaster";
import Sidebar from "@/components/sidebar/Sidebar";
import Navbar from "@/components/navbar/Navbar";
import { useResize } from "@/hooks";

export default function AdminLayout({ children, }: { children: React.ReactNode; }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,
                        gcTime: 10 * 60 * 1000,
                        refetchOnWindowFocus: true,
                        refetchOnMount: true,
                    },
                },
            })
    );

    const { collapsed, setCollapsed } = useResize();

    return (
        <QueryClientProvider client={queryClient}>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Toaster />
            <div
                className={`flex flex-col transition-all duration-300 h-screen ${collapsed ? "ml-16.25" : "md:ml-64"
                    }`}
            >
                <Navbar />
                <main className="px-4 pt-17.5 bg-red-60 h-full">{children}</main>
            </div>
        </QueryClientProvider>
    );
}
