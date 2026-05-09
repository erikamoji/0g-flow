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

  let gradientId = `${id}-grad`;
  let gradientDef: ReactNode;

  if (data?.kind === 'in-lo' || source.startsWith('data_input')) {
    gradientDef = (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6FB1FF" />
        <stop offset="100%" stopColor="#B49AFF" />
      </linearGradient>
    );
  } else if (data?.kind === 'lo-an' || source.startsWith('ai_compute')) {
    gradientDef = (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#B49AFF" />
        <stop offset="100%" stopColor="#5DE3A5" />
      </linearGradient>
    );
  } else {
    gradientDef = (
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6B7585" />
        <stop offset="100%" stopColor="#6B7585" />
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
