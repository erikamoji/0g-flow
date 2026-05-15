'use client';

import type { ReactNode } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

export function GradientEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, source } = props;

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const gradientId = `${id}-grad`;
  let gradientDef: ReactNode;

  if (source.startsWith('data_input')) {
    // orange → pink
    gradientDef = (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFB36F" />
        <stop offset="100%" stopColor="#FF95C8" />
      </linearGradient>
    );
  } else if (source.startsWith('ai_compute')) {
    // pink → yellow
    gradientDef = (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FF95C8" />
        <stop offset="100%" stopColor="#FFE066" />
      </linearGradient>
    );
  } else if (source.startsWith('memory_store')) {
    // lime → orange
    gradientDef = (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#B6FF8F" />
        <stop offset="100%" stopColor="#FFB36F" />
      </linearGradient>
    );
  } else if (source.startsWith('storage_anchor')) {
    // yellow → lime
    gradientDef = (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="100%" stopColor="#B6FF8F" />
      </linearGradient>
    );
  } else {
    // fallback: orange → pink
    gradientDef = (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFB36F" />
        <stop offset="100%" stopColor="#FF95C8" />
      </linearGradient>
    );
  }

  return (
    <g>
      <defs>{gradientDef}</defs>
      <path
        d={path}
        className={`edge-path ${data?.isRunning ? 'flowing' : ''}`}
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        fill="none"
      />
    </g>
  );
}
