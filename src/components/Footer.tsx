"use client";

import { Github } from "lucide-react";
import { version } from "@/../package.json"


export default function Footer() {
  return (
    <footer className="w-full py-6 mt-12">
      <div className="container mx-auto flex justify-center items-center px-6">
        <div className="flex items-center gap-4">
          <span className="text-sm">Version {version}</span>
          <a
            href={'https://github.com/crwntec/db-live-monitor'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white transition"
          >
            <Github size={16} />
            <span className="text-sm text-blue-500">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
