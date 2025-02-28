"use client";
import { useRouter } from "next/navigation";

export default function Navbar({ title }) {
  const router = useRouter();
  return (
    <nav className="flex items-center justify-between px-4 py-3 h-16 bg-blue-500 sticky">
      <h1 className="text-2xl font-bold hover:cursor-pointer text-white" onClick={() => router.refresh()}>{title}</h1>
    </nav>
  );
}
