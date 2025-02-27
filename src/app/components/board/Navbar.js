"use client";
import { useRouter } from "next/navigation";

export default function Navbar({ stationName, stationNames }) {
  const router = useRouter();
  return (
    <nav className="flex items-center justify-between px-4 py-3 h-16 bg-blue-500 sticky">
      <h1 className="text-2xl font-bold hover:cursor-pointer" onClick={() => router.refresh()}>{stationName}</h1>
    </nav>
  );
}
