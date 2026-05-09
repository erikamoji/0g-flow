'use client';

import { Manifest } from '@/lib/manifestCompiler';

interface ManifestModalProps {
  manifest: Manifest | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute?: (manifest: Manifest) => void;
}

export function ManifestModal({ manifest, isOpen, onClose, onExecute }: ManifestModalProps) {
  if (!isOpen || !manifest) return null;

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    element.download = `manifest-${manifest.workflow_id}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
  };

  const handleExecute = () => {
    if (onExecute && manifest) {
      onExecute(manifest);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-0/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-bg-2 border border-line-2 rounded-2xl shadow-[var(--shadow-3)] max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="bg-bg-2 border-b border-line-2 px-6 py-4 flex items-center justify-between">
          <h2 className="text-fg-1 text-base font-semibold tracking-tight">Generated Manifest</h2>
          <button
            onClick={onClose}
            className="text-fg-3 hover:text-fg-1 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1">
          <pre className="bg-bg-1 border border-line-1 rounded-md p-4 text-xs text-fg-2 overflow-x-auto font-mono">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </div>

        <div className="bg-bg-2 border-t border-line-2 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={handleCopy}
            className="bg-bg-3 hover:bg-bg-4 text-fg-1 px-4 py-2 rounded-md text-sm transition-colors"
          >
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="bg-bg-3 hover:bg-bg-4 text-fg-1 px-4 py-2 rounded-md text-sm transition-colors"
          >
            Download
          </button>
          {onExecute && (
            <button
              onClick={handleExecute}
              className="btn-deploy text-sm"
            >
              Execute Now
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-bg-3 hover:bg-bg-4 text-fg-1 px-4 py-2 rounded-md text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

