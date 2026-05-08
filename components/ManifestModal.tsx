'use client';

import { Manifest } from '@/lib/manifestCompiler';

interface ManifestModalProps {
  manifest: Manifest | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ManifestModal({ manifest, isOpen, onClose }: ManifestModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-auto border border-gray-700">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Generated Manifest</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-100 overflow-x-auto font-mono">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </div>

        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={handleCopy}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Download
          </button>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
