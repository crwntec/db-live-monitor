"use client";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function Navbar({ title, referring }) {
  const router = useRouter();
  return (
    <nav className="flex items-center justify-between px-4 py-3 h-16 bg-blue-500 sticky">
      <h1 className="text-2xl font-bold hover:cursor-pointer text-white" onClick={()=>router.push(`${referring}`)}>{title}</h1>
      <RefreshCw onClick={() => router.refresh()} />
    </nav>
  );
}
