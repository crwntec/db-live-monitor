"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { Spinner } from "flowbite-react";

export default function Navbar({ title, referring }: { 
  title: string; 
  referring: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      {/* Full-Screen Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Spinner size="xl" />
        </div>
      )}

      <nav className="flex items-center justify-between px-4 py-3 h-16 bg-blue-500 sticky top-0 z-50">
        <h1
          className="text-2xl font-bold text-white cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => startTransition(() => router.push(referring))}
        >
          {title}
        </h1>

        {/* Refresh Button with Loading State */}
        <button
          onClick={() => startTransition(() => router.refresh())}
          className="relative p-2 rounded-full hover:bg-blue-600 transition"
          disabled={isPending}
        >
          <RefreshCw className={`w-6 h-6 text-white transition-transform ${isPending ? "animate-spin" : ""}`} />
        </button>
      </nav>
    </>
  );
}
