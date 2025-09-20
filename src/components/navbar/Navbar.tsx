// components/navbar/Navbar.tsx
'use client';

export default function Navbar() {
  return (
    <nav className="w-full h-17.5 fixed flex items-center justify-between px-6 py-4 shadow bg-[#1F3047] border-b border-gray-100/20 z-30">
      <div className="flex items-center gap-4">
        {/* <div className="w-10 h-10 relative">
          <Image src="/logo.png" alt="Logo" fill priority />
        </div> */}
        <h1 className="text-xl font-bold text-white tracking-wide"></h1>
      </div>
    </nav>
  );
};
