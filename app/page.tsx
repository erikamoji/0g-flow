'use client';

import React, { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { useAccount } from 'wagmi';
import { Sidebar } from '@/components/Sidebar';
import { Canvas } from '@/components/Canvas';
import { ManifestModal } from '@/components/ManifestModal';
import { ExecutionTerminal } from '@/components/ExecutionTerminal';
import { WalletButton } from '@/components/WalletButton';
import { compileManifest, Manifest } from '@/lib/manifestCompiler';
import { ExecutionLog } from '@/lib/executionLogger';

export default function Home() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

function LandingPage() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-white mb-4">0G Flow</h1>
        <p className="text-gray-400 text-lg mb-8">
          Build decentralized AI workflows on 0G infrastructure
        </p>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-8">
          <p className="text-gray-300 mb-6">
            Connect your wallet to get started with the visual agent builder.
          </p>
          <WalletButton />
        </div>
        <p className="text-gray-500 text-sm">
          Supports MetaMask, WalletConnect, and other Web3 wallets
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const { address } = useAccount();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleDeploy = useCallback(() => {
    if (nodes.length === 0) {
      alert('Please add nodes to the workflow before deploying');
      return;
    }

    const compiled = compileManifest(nodes, edges, 'VM0048 Verification Swarm', address || '0x0');
    setManifest(compiled);
    setIsModalOpen(true);
  }, [nodes, edges, address]);

  const handleExecuteManifest = useCallback(async (manifestToExecute: Manifest) => {
    setIsExecuting(true);
    setLogs([]);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ manifest: manifestToExecute }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      setLogs(result.logs || []);

      if (!result.success) {
        alert(`Workflow failed: ${result.error}`);
      }
    } catch (error: any) {
      setLogs((prevLogs) => [
        ...prevLogs,
        {
          id: `log_error_${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Execution error: ${error.message}`,
        },
      ]);
      alert(`Error executing workflow: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">Workflow Designer</h2>
            <p className="text-gray-400 text-sm">
              {nodes.length} nodes {nodes.length > 0 && `• ${edges.length} connections`}
              {address && (
                <>
                  {' '}
                  • {address.slice(0, 6)}...{address.slice(-4)}
                </>
              )}
            </p>
          </div>
          <button
            onClick={handleDeploy}
            disabled={isExecuting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isExecuting ? 'Executing...' : 'Deploy'}
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas onNodesChange={setNodes} onEdgesChange={setEdges} />
          <ExecutionTerminal logs={logs} isRunning={isExecuting} />
        </div>

        <ManifestModal
          manifest={manifest}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onExecute={handleExecuteManifest}
        />
      </div>
    </div>
  );
}
