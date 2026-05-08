'use client';

import { Sidebar } from '@/components/Sidebar';
import { Canvas } from '@/components/Canvas';

export default function Home() {
  return (
    <div className="flex h-screen w-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">Workflow Designer</h2>
            <p className="text-gray-400 text-sm">VM0048 Verification Swarm</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Deploy
          </button>
        </div>
        <Canvas />
      </div>
    </div>
  );
}
