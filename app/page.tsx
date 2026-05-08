'use client';

import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { Sidebar } from '@/components/Sidebar';
import { Canvas } from '@/components/Canvas';
import { ManifestModal } from '@/components/ManifestModal';
import { compileManifest, Manifest } from '@/lib/manifestCompiler';

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeploy = useCallback(() => {
    if (nodes.length === 0) {
      alert('Please add nodes to the workflow before deploying');
      return;
    }
    const compiled = compileManifest(nodes, edges);
    setManifest(compiled);
    setIsModalOpen(true);
  }, [nodes, edges]);

  return (
    <div className="flex h-screen w-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">Workflow Designer</h2>
            <p className="text-gray-400 text-sm">
              {nodes.length} nodes {nodes.length > 0 && `• ${edges.length} connections`}
            </p>
          </div>
          <button
            onClick={handleDeploy}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Deploy
          </button>
        </div>
        <Canvas onNodesChange={setNodes} onEdgesChange={setEdges} />
        <ManifestModal
          manifest={manifest}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
