"use client";
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Toaster from '../toast/Toaster';
import Sidebar from '../sidebar/Sidebar';
import Navbar from '../navbar/Navbar';
import { useResize } from '@/hooks';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    // const [queryClient] = useState(() => new QueryClient({
    //     defaultOptions: {
    //         queries: {
    //             staleTime: 5 * 60 * 1000, // 5 minutes
    //             gcTime: 10 * 60 * 1000,   // 10 minutes
    //             refetchOnWindowFocus: true,
    //             refetchOnMount: true,
    //         },
    //     }
    // }));

    // const { collapsed, setCollapsed } = useResize();

    return (
        <>
            {/* <QueryClientProvider client={queryClient}> */}
            {/* <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} ${collapsed ? 'ml-16.25' : 'md:ml-64'} /> */}
            <Toaster />
            {/* <div className={`flex flex-col transition-all duration-300 h-screen px-4 pt-17.5 bg-red-60 h-full`}> */}
                {/* <Navbar /> */}
                <main className="">{children}</main>
            {/* </div> */}
            {/* </QueryClientProvider> */}
        </>
    )
}
