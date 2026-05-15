'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { uploadPendingAnchors, type PendingAnchor } from '@/lib/storageClient';
import { Sidebar } from '@/components/Sidebar';
import { Canvas } from '@/components/Canvas';
import { ManifestModal } from '@/components/ManifestModal';
import { Drawer } from '@/components/Drawer';
import { WalletButton } from '@/components/WalletButton';
import { compileManifest, Manifest } from '@/lib/manifestCompiler';
import { ExecutionLog } from '@/lib/executionLogger';
import { registerWorkflow, recordExecution } from '@/lib/registry';
import { getNetwork } from '@/lib/networks';
import { WORKFLOW_TEMPLATES } from '@/lib/templates';

export default function Home() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

function LandingPage() {
  const [replayKey, setReplayKey] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const edge1Ref = useRef<SVGPathElement>(null);
  const edge2Ref = useRef<SVGPathElement>(null);
  const hIoutRef = useRef<SVGGElement>(null);
  const hLinRef = useRef<SVGGElement>(null);
  const hLoutRef = useRef<SVGGElement>(null);
  const hAinRef = useRef<SVGGElement>(null);
  const inputNodeRef = useRef<HTMLDivElement>(null);
  const logicNodeRef = useRef<HTMLDivElement>(null);
  const anchorNodeRef = useRef<HTMLDivElement>(null);

  // Nav scroll border
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('lp-scrolled', window.scrollY > 8);
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => document.removeEventListener('scroll', onScroll);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }
    }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.lp-reveal, .lp-reveal-stagger').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Canvas demo edge drawing + reveal
  useEffect(() => {
    const demo = canvasRef.current;
    if (!demo) return;

    const drawEdges = () => {
      const cv = demo.getBoundingClientRect();
      const getEnds = (el: HTMLDivElement | null) => {
        if (!el) return { right: { x: 0, y: 0 }, left: { x: 0, y: 0 } };
        const r = el.getBoundingClientRect();
        return {
          right: { x: r.right - cv.left, y: r.top + r.height / 2 - cv.top },
          left:  { x: r.left  - cv.left, y: r.top + r.height / 2 - cv.top },
        };
      };
      const setEdge = (ref: React.RefObject<SVGPathElement | null>, a: {x:number,y:number}, b: {x:number,y:number}) => {
        if (!ref.current) return;
        const dx = b.x - a.x;
        const cx1 = a.x + dx * 0.55, cx2 = b.x - dx * 0.55;
        ref.current.setAttribute('d', `M ${a.x} ${a.y} C ${cx1} ${a.y}, ${cx2} ${b.y}, ${b.x} ${b.y}`);
      };
      const placeHandle = (ref: React.RefObject<SVGGElement | null>, p: {x:number,y:number}) => {
        if (!ref.current) return;
        ref.current.setAttribute('transform', `translate(${p.x} ${p.y})`);
      };
      const I = getEnds(inputNodeRef.current);
      const L = getEnds(logicNodeRef.current);
      const A = getEnds(anchorNodeRef.current);
      setEdge(edge1Ref, I.right, L.left);
      setEdge(edge2Ref, L.right, A.left);
      placeHandle(hIoutRef, I.right);
      placeHandle(hLinRef,  L.left);
      placeHandle(hLoutRef, L.right);
      placeHandle(hAinRef,  A.left);
    };

    drawEdges();
    window.addEventListener('resize', drawEdges, { passive: true });
    const ro = new ResizeObserver(drawEdges);
    ro.observe(demo);

    const demoIO = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        drawEdges();
        const nodes = demo.querySelectorAll('.lp-demo-node');
        nodes.forEach((n, i) => setTimeout(() => n.classList.add('in'), 200 + i * 260));
        setTimeout(() => demo.classList.add('in'), 900);
        demoIO.unobserve(demo);
      }
    }, { threshold: 0.35 });
    demoIO.observe(demo);

    return () => {
      window.removeEventListener('resize', drawEdges);
      ro.disconnect();
      demoIO.disconnect();
    };
  }, []);

  return (
    <div style={{ background: 'var(--bg-0)', color: 'var(--fg-1)', fontFamily: 'var(--font-inter-tight, sans-serif)', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        /* NAV */
        .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); background: rgba(7,9,12,0.50); border-bottom: 1px solid transparent; transition: border-color 250ms, background 250ms; }
        .lp-nav.lp-scrolled { border-bottom-color: var(--line-2); background: rgba(7,9,12,0.82); }
        .lp-nav-mark img { height: 26px; display: block; }
        .lp-nav-links { display: flex; gap: 28px; }
        .lp-nav-links a { font-size: 13px; color: var(--fg-3); text-decoration: none; transition: color 150ms; }
        .lp-nav-links a:hover { color: var(--fg-1); }
        /* Custom wallet button for nav */
        .lp-wallet-btn { font-family: var(--font-inter-tight, sans-serif); font-size: 13px; font-weight: 500; height: 34px; padding: 0 14px; display: inline-flex; align-items: center; gap: 7px; border-radius: 8px; cursor: pointer; background: var(--bg-2); color: var(--fg-2); border: 1px solid var(--line-2); transition: background 150ms, border-color 150ms, color 150ms; white-space: nowrap; }
        .lp-wallet-btn:hover { background: var(--bg-3); border-color: var(--line-3); color: var(--fg-1); }
        .lp-wallet-btn.connected { color: var(--fg-1); }
        .lp-wallet-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ok-500); box-shadow: 0 0 8px var(--ok-glow); flex-shrink: 0; }
        /* LAYOUT */
        main.lp-main { padding-top: 64px; }
        .lp-section { padding: 120px 32px; max-width: 1200px; margin: 0 auto; position: relative; }
        .lp-eyebrow { font-family: var(--font-jetbrains-mono, monospace); font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-3); }
        .lp-h1 { font-size: clamp(40px, 4.5vw, 64px); font-weight: 500; line-height: 1.02; letter-spacing: -0.025em; margin: 0; font-family: var(--font-display, 'Fraunces', serif); }
        .lp-h2 { font-size: clamp(28px, 3vw, 40px); font-weight: 500; line-height: 1.1; letter-spacing: -0.02em; margin: 0; font-family: var(--font-display, 'Fraunces', serif); }
        .lp-lede { font-size: clamp(15px, 1.3vw, 17px); line-height: 1.6; color: var(--fg-2); max-width: 520px; margin: 0; }
        .lp-grad { background: var(--brand-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
        /* HERO — editorial 2-column */
        .lp-hero { min-height: calc(100vh - 64px); display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 72px; padding: 80px 64px 72px; position: relative; overflow: hidden; max-width: 1280px; margin: 0 auto; }
        @media (max-width: 900px) { .lp-hero { grid-template-columns: 1fr; gap: 48px; padding: 60px 28px 60px; } }
        .lp-hero-l { display: flex; flex-direction: column; gap: 24px; position: relative; z-index: 1; }
        .lp-hero-r { position: relative; z-index: 1; }
        .lp-hero-grid { position: absolute; inset: 0; background-color: var(--bg-0); background-image: radial-gradient(circle at 1px 1px, var(--grid-dot) 1px, transparent 0); background-size: 22px 22px; mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent 80%); -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent 80%); pointer-events: none; }
        .lp-hero-glow { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 60% 80% at 100% 50%, rgba(232,74,152,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 0% 50%, rgba(240,193,58,0.06) 0%, transparent 50%); }
        .lp-hero-inner { text-align: center; max-width: 860px; position: relative; display: flex; flex-direction: column; align-items: center; gap: 0; }
        .lp-hero-sub { color: var(--fg-3); margin: 24px auto 0; max-width: 480px; font-size: 17px; line-height: 1.6; }
        /* Hero verb strip */
        .lp-verbs { display: flex; align-items: center; gap: 10px; font-family: var(--font-jetbrains-mono, monospace); font-size: 11px; font-weight: 500; letter-spacing: 0.12em; }
        .lp-verb-sep { color: var(--fg-4); }
        .lp-verb--in  { color: var(--input-300); }
        .lp-verb--lo  { color: var(--logic-300); }
        .lp-verb--an  { color: var(--anchor-300); }
        /* Hero CTA */
        .lp-hero-cta { display: flex; gap: 10px; flex-wrap: wrap; }
        .lp-btn--lg { height: 40px; padding: 0 20px; font-size: 12px; border-radius: 8px; }
        .lp-btn--primary { background: var(--input-500); color: #fff; font-family: var(--font-jetbrains-mono, monospace); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; height: 36px; padding: 0 18px; border-radius: 7px; border: 0; cursor: pointer; transition: filter 120ms; }
        .lp-btn--primary:hover { filter: brightness(1.1); }
        .lp-btn--ghost { background: var(--bg-2); color: var(--fg-2); font-family: var(--font-jetbrains-mono, monospace); font-size: 11px; font-weight: 500; letter-spacing: 0.04em; height: 36px; padding: 0 16px; border-radius: 7px; border: 1px solid var(--line-2); cursor: pointer; transition: background 120ms, color 120ms; }
        .lp-btn--ghost:hover { background: var(--bg-3); color: var(--fg-1); }
        /* Hero meta */
        .lp-hero-meta { display: flex; align-items: center; gap: 8px; font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; color: var(--fg-4); letter-spacing: 0.08em; }
        /* HERO TERMINAL */
        .lp-hero-terminal { margin-top: 40px; width: 100%; max-width: 560px; background: var(--bg-1); border: 1px solid var(--line-2); border-radius: 10px; overflow: hidden; box-shadow: 0 24px 60px -12px rgba(0,0,0,0.5), 0 0 40px -16px rgba(42,123,255,0.15); text-align: left; }
        .lp-ht-bar { display: flex; align-items: center; gap: 6px; padding: 10px 14px; border-bottom: 1px solid var(--line-2); background: var(--bg-2); }
        .lp-ht-dot { width: 10px; height: 10px; border-radius: 50%; }
        .lp-ht-label { margin-left: auto; font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-4); }
        .lp-ht-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; }
        .lp-ht-line { display: flex; align-items: baseline; gap: 10px; font-family: var(--font-jetbrains-mono, monospace); font-size: 12px; color: var(--fg-2); opacity: 0; }
        .lp-ht-ts { color: var(--fg-4); font-size: 10.5px; min-width: 72px; flex-shrink: 0; }
        .lp-ht-info { color: var(--input-300); font-size: 10px; flex-shrink: 0; }
        .lp-ht-success { color: var(--anchor-300); font-size: 10px; flex-shrink: 0; }
        .lp-ht-ok { color: var(--anchor-300); }
        .lp-ht-tx { color: var(--input-300); }
        .lp-ht-l1 { animation: lp-ht-fade 0.3s ease forwards 0.4s; }
        .lp-ht-l2 { animation: lp-ht-fade 0.3s ease forwards 0.8s; }
        .lp-ht-l3 { animation: lp-ht-fade 0.3s ease forwards 1.1s; }
        .lp-ht-l4 { animation: lp-ht-fade 0.3s ease forwards 1.9s; }
        .lp-ht-l5 { animation: lp-ht-fade 0.3s ease forwards 2.1s; }
        .lp-ht-l6 { animation: lp-ht-fade 0.3s ease forwards 2.6s; }
        .lp-ht-l7 { animation: lp-ht-fade 0.3s ease forwards 2.9s; }
        @keyframes lp-ht-fade { to { opacity: 1; } }
        .lp-scroll-arrow { margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--fg-4); cursor: pointer; background: none; border: none; padding: 0; animation: lp-bounce 2.2s ease-in-out infinite; }
        .lp-scroll-arrow svg { width: 20px; height: 20px; }
        @keyframes lp-bounce { 0%, 100% { transform: translateY(0); } 55% { transform: translateY(8px); } }
        /* REVEALS */
        .lp-reveal { opacity: 0; transform: translateY(20px); transition: opacity 650ms cubic-bezier(0.2,0.8,0.2,1), transform 650ms cubic-bezier(0.2,0.8,0.2,1); }
        .lp-reveal.in { opacity: 1; transform: none; }
        .lp-reveal-stagger > * { opacity: 0; transform: translateY(18px); transition: opacity 600ms cubic-bezier(0.2,0.8,0.2,1), transform 600ms cubic-bezier(0.2,0.8,0.2,1); }
        .lp-reveal-stagger.in > *:nth-child(1) { opacity: 1; transform: none; transition-delay: 0ms; }
        .lp-reveal-stagger.in > *:nth-child(2) { opacity: 1; transform: none; transition-delay: 120ms; }
        .lp-reveal-stagger.in > *:nth-child(3) { opacity: 1; transform: none; transition-delay: 240ms; }
        /* SECTION HEADS */
        .lp-sect-head { display: flex; flex-direction: column; gap: 18px; max-width: 680px; margin-bottom: 64px; }
        /* ARCHETYPE CARDS — 2×2 grid */
        .lp-nodes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 700px) { .lp-nodes-grid { grid-template-columns: 1fr; } }
        .lp-archetype { background: var(--bg-2); border: 1px solid var(--line-2); border-radius: 14px; padding: 28px; position: relative; overflow: hidden; transition: transform 350ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 350ms; }
        .lp-archetype::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, var(--n-300, var(--fg-4)) 0%, transparent 100%); }
        .lp-archetype:hover { transform: translateY(-4px); }
        .lp-archetype.lp-input  { --n-300: var(--input-300); }
        .lp-archetype.lp-logic  { --n-300: var(--logic-300); }
        .lp-archetype.lp-anchor { --n-300: var(--anchor-300); }
        .lp-archetype.lp-memory { --n-300: var(--memory-300); }
        .lp-archetype::after { content: ""; position: absolute; inset: -1px; border-radius: 14px; pointer-events: none; opacity: 0; transition: opacity 300ms; }
        .lp-archetype.lp-input::after  { box-shadow: var(--glow-input); }
        .lp-archetype.lp-logic::after  { box-shadow: var(--glow-logic); }
        .lp-archetype.lp-anchor::after { box-shadow: var(--glow-anchor); }
        .lp-archetype.lp-memory::after { box-shadow: var(--glow-memory); }
        .lp-archetype:hover::after { opacity: 1; }
        .lp-a-icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px; margin-bottom: 16px; }
        .lp-a-icon svg { width: 18px; height: 18px; }
        .lp-archetype.lp-input  .lp-a-icon { background: var(--input-bg);  color: var(--input-300); }
        .lp-archetype.lp-logic  .lp-a-icon { background: var(--logic-bg);  color: var(--logic-300); }
        .lp-archetype.lp-anchor .lp-a-icon { background: var(--anchor-bg); color: var(--anchor-300); }
        .lp-archetype.lp-memory .lp-a-icon { background: var(--memory-bg); color: var(--memory-300); }
        .lp-a-eyebrow { font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px; }
        .lp-archetype.lp-input  .lp-a-eyebrow { color: var(--input-300); }
        .lp-archetype.lp-logic  .lp-a-eyebrow { color: var(--logic-300); }
        .lp-archetype.lp-anchor .lp-a-eyebrow { color: var(--anchor-300); }
        .lp-archetype.lp-memory .lp-a-eyebrow { color: var(--memory-300); }
        .lp-archetype h3 { font-family: var(--font-display, serif); font-size: 22px; font-weight: 500; line-height: 1.15; letter-spacing: -0.01em; margin: 0 0 8px; color: var(--fg-1); }
        .lp-archetype p { font-size: 13px; line-height: 1.6; color: var(--fg-2); margin: 0 0 16px; }
        .lp-a-meta { display: flex; gap: 5px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--line-1); }
        .lp-tag { font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.10em; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; background: var(--bg-1); border: 1px solid var(--line-2); color: var(--fg-3); white-space: nowrap; }
        /* CANVAS DEMO */
        .lp-canvas-demo { position: relative; height: 420px; background-color: var(--bg-1); background-image: radial-gradient(circle at 1px 1px, var(--grid-dot) 1px, transparent 0); background-size: 24px 24px; border: 1px solid var(--line-2); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-3); }
        .lp-demo-node { position: absolute; width: 200px; background: var(--bg-2); border: 1px solid var(--line-2); border-radius: 10px; padding: 12px; transition: 600ms cubic-bezier(0.2,0.8,0.2,1); opacity: 0; }
        .lp-demo-node.in { opacity: 1; }
        .lp-demo-node .lp-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .lp-demo-node .lp-ic { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 5px; }
        .lp-demo-node .lp-ic svg { width: 14px; height: 14px; }
        .lp-demo-node .lp-nm { font-size: 13px; font-weight: 600; color: var(--fg-1); flex: 1; }
        .lp-demo-node .lp-st { width: 6px; height: 6px; border-radius: 50%; }
        .lp-demo-node .lp-body { font-family: var(--font-jetbrains-mono, monospace); font-size: 10.5px; font-weight: 500; letter-spacing: 0.10em; text-transform: uppercase; color: var(--fg-3); padding: 6px 8px; background: var(--bg-1); border: 1px solid var(--line-1); border-radius: 4px; }
        .lp-demo-node.lp-input  { left: 6%;  top: 35%; box-shadow: var(--glow-input);  transform: translateX(-12px); }
        .lp-demo-node.lp-logic  { left: 39%; top: 35%; box-shadow: var(--glow-logic);  transform: translateY(12px); }
        .lp-demo-node.lp-anchor { left: 72%; top: 35%; box-shadow: var(--glow-anchor); transform: translateX(12px); }
        .lp-demo-node.in.lp-input, .lp-demo-node.in.lp-logic, .lp-demo-node.in.lp-anchor { transform: none; }
        .lp-demo-node.lp-input  .lp-ic { background: rgba(42,123,255,0.12); color: var(--input-300); }
        .lp-demo-node.lp-logic  .lp-ic { background: rgba(124,92,255,0.14); color: var(--logic-300); }
        .lp-demo-node.lp-anchor .lp-ic { background: rgba(16,185,129,0.14); color: var(--anchor-300); }
        .lp-demo-node.lp-input  .lp-st { background: var(--ok-500); box-shadow: 0 0 8px var(--ok-glow); }
        .lp-demo-node.lp-logic  .lp-st { background: var(--logic-300); box-shadow: 0 0 10px var(--logic-glow); animation: lp-pulse-logic 1.4s ease-in-out infinite; }
        .lp-demo-node.lp-anchor .lp-st { background: var(--ok-500); box-shadow: 0 0 8px var(--ok-glow); }
        @keyframes lp-pulse-logic { 0%, 100% { opacity: 0.5; box-shadow: 0 0 4px var(--logic-glow); } 50% { opacity: 1; box-shadow: 0 0 14px var(--logic-glow); } }
        .lp-demo-edges { position: absolute; inset: 0; pointer-events: none; width: 100%; height: 100%; overflow: visible; }
        .lp-demo-edge { fill: none; stroke-width: 1.75; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: 100; transition: stroke-dashoffset 1100ms cubic-bezier(0.2,0.8,0.2,1); }
        .lp-canvas-demo.in .lp-demo-edge { stroke-dashoffset: 0; }
        .lp-canvas-demo.in .lp-demo-edge.lp-flow { stroke-dasharray: 2 3; animation: lp-ed 0.9s linear infinite 1.3s; }
        @keyframes lp-ed { to { stroke-dashoffset: -10; } }
        .lp-demo-handle { opacity: 0; transition: opacity 400ms ease 800ms; }
        .lp-canvas-demo.in .lp-demo-handle { opacity: 1; }
        .lp-demo-handle .lp-ring { fill: var(--bg-1); }
        .lp-demo-meta { position: absolute; left: 24px; bottom: 20px; display: flex; gap: 16px; align-items: center; font-family: var(--font-jetbrains-mono, monospace); font-size: 10.5px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-3); }
        .lp-demo-meta .lp-pill { padding: 4px 10px; border-radius: 999px; background: rgba(52,211,153,0.10); border: 1px solid rgba(52,211,153,0.30); color: var(--ok-500); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
        .lp-demo-meta .lp-pill .lp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ok-500); box-shadow: 0 0 8px var(--ok-glow); }
        .lp-demo-tx { position: absolute; right: 24px; bottom: 20px; font-family: var(--font-jetbrains-mono, monospace); font-size: 13px; color: var(--input-300); white-space: nowrap; }
        /* RECEIPT */
        .lp-receipt-row { display: grid; grid-template-columns: 1.1fr 1fr; gap: 56px; align-items: center; }
        .lp-receipt { width: 100%; max-width: 340px; font-family: var(--font-jetbrains-mono, monospace); background: var(--bg-1); border: 1px solid var(--line-2); border-radius: 4px; box-shadow: var(--shadow-3), 0 0 60px -20px rgba(93,227,165,0.12); overflow: hidden; position: relative; }
        .lp-receipt::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--brand-grad); }
        .lp-receipt-header { padding: 20px 20px 16px; text-align: center; border-bottom: 1px dashed var(--line-3); }
        .lp-receipt-store { font-size: 14px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--fg-1); }
        .lp-receipt-sub { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-4); margin-top: 3px; }
        .lp-receipt-body { padding: 14px 20px; display: flex; flex-direction: column; gap: 0; }
        .lp-receipt-row-item { display: flex; justify-content: space-between; align-items: baseline; padding: 7px 0; border-bottom: 1px solid var(--line-1); }
        .lp-receipt-row-item:last-child { border-bottom: none; }
        .lp-receipt-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-3); }
        .lp-receipt-value { font-size: 12px; color: var(--fg-1); text-align: right; }
        .lp-receipt-value.tx { color: var(--input-300); }
        .lp-receipt-value.em { color: var(--anchor-300); }
        .lp-receipt-divider { border: none; border-top: 1px dashed var(--line-3); margin: 4px 0; }
        .lp-receipt-footer { padding: 12px 20px 18px; text-align: center; }
        .lp-receipt-status { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ok-500); background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.22); border-radius: 999px; padding: 5px 12px; animation: lp-receipt-glow 2.5s ease-in-out infinite; }
        .lp-receipt-status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ok-500); box-shadow: 0 0 6px var(--ok-glow); }
        @keyframes lp-receipt-glow { 0%, 100% { box-shadow: 0 0 0 rgba(52,211,153,0); } 50% { box-shadow: 0 0 16px rgba(52,211,153,0.18); } }
        /* STATEMENT */
        .lp-statement { text-align: center; padding: 160px 32px; max-width: 1200px; margin: 0 auto; }
        .lp-statement .lp-h2-stmt { font-size: clamp(36px, 5.5vw, 76px); font-weight: 600; line-height: 1.05; letter-spacing: -0.025em; font-family: var(--font-inter-tight, sans-serif); }
        .lp-verbs { display: inline-flex; gap: 20px; margin-top: 40px; flex-wrap: wrap; justify-content: center; font-family: var(--font-jetbrains-mono, monospace); font-size: 10.5px; font-weight: 500; letter-spacing: 0.20em; text-transform: uppercase; color: var(--fg-3); }
        .lp-verbs span:nth-child(1) { color: var(--input-300); }
        .lp-verbs span:nth-child(3) { color: var(--logic-300); }
        .lp-verbs span:nth-child(5) { color: var(--anchor-300); }
        .lp-dot-sep { color: var(--fg-4) !important; }
        /* FINAL CTA */
        .lp-final { background: var(--bg-1); border-top: 1px solid var(--line-2); padding: 100px 32px; text-align: center; }
        .lp-final-inner { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 24px; }
        /* FOOTER */
        .lp-footer { padding: 32px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line-1); color: var(--fg-3); font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; }
        .lp-footer img { height: 20px; }
        .lp-footer-links { display: flex; gap: 20px; }
        .lp-footer-links a { color: inherit; text-decoration: none; transition: color 150ms; }
        .lp-footer-links a:hover { color: var(--fg-1); }
        @media (max-width: 820px) {
          .lp-nodes-grid { grid-template-columns: 1fr; }
          .lp-receipt-row { grid-template-columns: 1fr; gap: 32px; }
          .lp-canvas-demo { height: 540px; }
          .lp-demo-node.lp-input  { left: 8%; top: 12%; }
          .lp-demo-node.lp-logic  { left: 8%; top: 40%; }
          .lp-demo-node.lp-anchor { left: 8%; top: 68%; }
          .lp-nav-links { display: none; }
          .lp-receipt { max-width: 100%; }
        }
      `}</style>

      {/* NAV */}
      <nav className="lp-nav" ref={navRef}>
        <a href="#" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/flow-wordmark.svg" alt="0G Flow" style={{ height: 26 }} />
        </a>
        <div className="lp-nav-links">
          <a href="#lp-compose">Build</a>
          <a href="#lp-deploy">Run</a>
          <a href="#lp-anchor">Verify</a>
        </div>
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
            if (!mounted) return null;
            if (!account) return (
              <button className="lp-wallet-btn" onClick={openConnectModal}>Connect wallet</button>
            );
            return (
              <button className="lp-wallet-btn connected" onClick={openAccountModal}>
                <span className="lp-wallet-dot" />
                {account.displayName}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </nav>

      <main className="lp-main">

        {/* HERO — editorial 2-col */}
        <section className="lp-hero">
          <div className="lp-hero-grid" />
          <div className="lp-hero-glow" />

          {/* Left: text */}
          <div className="lp-hero-l lp-reveal">
            <span className="lp-eyebrow">01 · A visual IDE for verifiable AI</span>
            <h1 className="lp-h1">Compose AI pipelines<br />you can <span className="lp-grad">prove ran</span>.</h1>
            <p className="lp-lede">Drag four primitives onto a canvas. Every workflow compiles to a portable manifest, executes through 0G Compute with TEE attestation, settles to 0G Storage, and anchors provenance on 0G Chain.</p>
            <div className="lp-verbs">
              <span className="lp-verb--in">Compose</span>
              <span className="lp-verb-sep">·</span>
              <span className="lp-verb--lo">Execute</span>
              <span className="lp-verb-sep">·</span>
              <span className="lp-verb--an">Verify</span>
            </div>
            <div className="lp-hero-cta">
              <ConnectButton.Custom>
                {({ account, openConnectModal, openAccountModal, mounted }) => {
                  if (!mounted) return null;
                  if (!account) return (
                    <button className="lp-btn--primary lp-btn--lg" onClick={openConnectModal}>launch canvas →</button>
                  );
                  return (
                    <button className="lp-btn--primary lp-btn--lg" onClick={openAccountModal}>{account.displayName}</button>
                  );
                }}
              </ConnectButton.Custom>
              <a href="#lp-compose" className="lp-btn--ghost lp-btn--lg" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>read the manifest spec</a>
            </div>
            <div className="lp-hero-meta">
              <span>4 primitives</span><span>·</span>
              <span>0G mainnet · 16661</span><span>·</span>
              <span>3 templates ready</span>
            </div>
          </div>

          {/* Right: terminal */}
          <div className="lp-hero-r lp-reveal">
            <div className="lp-hero-terminal" key={replayKey}>
              <div className="lp-ht-bar">
                <span className="lp-ht-dot" style={{background:'#FF5F57'}} />
                <span className="lp-ht-dot" style={{background:'#FFBD2E'}} />
                <span className="lp-ht-dot" style={{background:'#28C840'}} />
                <span className="lp-ht-label">$ 0g flow execute defi-signal-analyzer</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 9, color: 'var(--ok-500)', letterSpacing: '0.08em' }}>live · galileo</span>
              </div>
              <div className="lp-ht-body">
                <div className="lp-ht-line lp-ht-l1"><span className="lp-ht-ts">00:00.000</span><span className="lp-ht-info">◦</span><span>manifest compiled · workflow_id=wf-7k2m-9xab</span></div>
                <div className="lp-ht-line lp-ht-l2"><span className="lp-ht-ts">00:00.041</span><span className="lp-ht-info">◦</span><span>registerWorkflow → 0G Chain · 0x4f3a…b27c ↗</span></div>
                <div className="lp-ht-line lp-ht-l3"><span className="lp-ht-info" style={{ color: 'var(--input-300)' }}>◆</span><span style={{ color: 'var(--input-300)', marginLeft: 10 }}>data_input · ETH/USDC market feed</span></div>
                <div className="lp-ht-line lp-ht-l4"><span className="lp-ht-info" style={{ color: 'var(--logic-300)' }}>◆</span><span style={{ color: 'var(--logic-300)', marginLeft: 10 }}>ai_compute · router-api.0g.ai · sealed=true</span></div>
                <div className="lp-ht-line lp-ht-l5"><span className="lp-ht-info" style={{ color: 'var(--logic-300)' }}>◆</span><span style={{ marginLeft: 10 }}>inference complete · 142 tok</span></div>
                <div className="lp-ht-line lp-ht-l6"><span className="lp-ht-success">✓</span><span style={{ color: 'var(--ok-500)', marginLeft: 10 }}>TEE ✓ · tee_verified · provider 0x4f3a…</span></div>
                <div className="lp-ht-line lp-ht-l7"><span className="lp-ht-info" style={{ color: 'var(--anchor-300)' }}>◆</span><span style={{ color: 'var(--anchor-300)', marginLeft: 10 }}>storage_anchor · 0G Storage · 0x8fa2…e31d</span></div>
                <div className="lp-ht-line" style={{ animation: 'lp-ht-fade 0.3s ease forwards 2.4s', opacity: 0 }}><span className="lp-ht-success">✓</span><span style={{ color: 'var(--ok-500)', marginLeft: 10 }}>recordExecution · permanently verifiable</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* PRIMITIVES — 2×2 grid */}
        <section id="lp-compose" className="lp-section">
          <div className="lp-sect-head lp-reveal">
            <span className="lp-eyebrow">02 · Four primitives. Infinite workflows.</span>
            <h2 className="lp-h2">Every node is real work on a real layer.</h2>
          </div>
          <div className="lp-nodes-grid lp-reveal-stagger">
            <div className="lp-archetype lp-input">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
              </div>
              <div className="lp-a-eyebrow">Input</div>
              <h3>Trigger your pipelines.</h3>
              <p>Manual payload, API call, or schedule. Every input becomes a portable, signed event that drives the workflow.</p>
              <div className="lp-a-meta"><span className="lp-tag">JSON</span><span className="lp-tag">API</span><span className="lp-tag">CRON</span></div>
            </div>
            <div className="lp-archetype lp-logic">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>
              </div>
              <div className="lp-a-eyebrow">Compute</div>
              <h3>Sealed AI, on demand.</h3>
              <p>Route inference through 0G Compute with verify_tee. Outputs ship with attestation, not promises.</p>
              <div className="lp-a-meta"><span className="lp-tag">0G ROUTER</span><span className="lp-tag">TEE ✓</span><span className="lp-tag">STREAM</span></div>
            </div>
            <div className="lp-archetype lp-memory">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M20 12c0 1.4-3.6 2.5-8 2.5S4 13.4 4 12"/><path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/></svg>
              </div>
              <div className="lp-a-eyebrow">Memory</div>
              <h3>Stateful agent memory.</h3>
              <p>Read and write persistent context across runs. Every key is a root hash on 0G Storage — portable and auditable.</p>
              <div className="lp-a-meta"><span className="lp-tag">READ / WRITE</span><span className="lp-tag">ROOT HASH</span><span className="lp-tag">PORTABLE</span></div>
            </div>
            <div className="lp-archetype lp-anchor">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M5 14c0 4 3 7 7 7s7-3 7-7M3 14h4M17 14h4"/></svg>
              </div>
              <div className="lp-a-eyebrow">Anchor</div>
              <h3>Receipts, not promises.</h3>
              <p>Outputs settle to 0G Storage and provenance lives on 0G Chain. Anyone can audit by workflow ID — no account needed.</p>
              <div className="lp-a-meta"><span className="lp-tag">0G STORAGE</span><span className="lp-tag">REGISTRY</span><span className="lp-tag">ON-CHAIN</span></div>
            </div>
          </div>
        </section>

        {/* DEPLOY */}
        <section id="lp-deploy" className="lp-section">
          <div className="lp-sect-head lp-reveal">
            <span className="lp-eyebrow">02 · Run</span>
            <h2 className="lp-h2">Hit deploy. <span className="lp-grad">Watch it execute.</span></h2>
            <p className="lp-lede">Your graph compiles to a portable manifest. The execution terminal streams live logs as each node runs — inference, then on-chain storage.</p>
          </div>
          <div className="lp-canvas-demo lp-reveal" ref={canvasRef}>
            <svg className="lp-demo-edges">
              <defs>
                <linearGradient id="lp-e1" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#6FB1FF" /><stop offset="1" stopColor="#B49AFF" />
                </linearGradient>
                <linearGradient id="lp-e2" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#B49AFF" /><stop offset="1" stopColor="#5DE3A5" />
                </linearGradient>
              </defs>
              <path className="lp-demo-edge lp-flow" pathLength={100} ref={edge1Ref} stroke="url(#lp-e1)" />
              <path className="lp-demo-edge lp-flow" pathLength={100} ref={edge2Ref} stroke="url(#lp-e2)" />
              <g className="lp-demo-handle" ref={hIoutRef}><circle className="lp-ring" r={4.5} stroke="#6FB1FF" strokeWidth={1.5} /><circle r={1.75} fill="#6FB1FF" /></g>
              <g className="lp-demo-handle" ref={hLinRef}><circle className="lp-ring" r={4.5} stroke="#B49AFF" strokeWidth={1.5} /><circle r={1.75} fill="#B49AFF" /></g>
              <g className="lp-demo-handle" ref={hLoutRef}><circle className="lp-ring" r={4.5} stroke="#B49AFF" strokeWidth={1.5} /><circle r={1.75} fill="#B49AFF" /></g>
              <g className="lp-demo-handle" ref={hAinRef}><circle className="lp-ring" r={4.5} stroke="#5DE3A5" strokeWidth={1.5} /><circle r={1.75} fill="#5DE3A5" /></g>
            </svg>
            <div className="lp-demo-node lp-input" ref={inputNodeRef}>
              <div className="lp-row">
                <div className="lp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="6" width="14" height="12" rx="2" /><path d="M17 12h4" /></svg></div>
                <span className="lp-nm">Input</span><span className="lp-st" />
              </div>
              <div className="lp-body">IN·01 · MANUAL · 18B</div>
            </div>
            <div className="lp-demo-node lp-logic" ref={logicNodeRef}>
              <div className="lp-row">
                <div className="lp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M3 12h3M18 12h3" /></svg></div>
                <span className="lp-nm">0G Compute</span><span className="lp-st" />
              </div>
              <div className="lp-body">LX·07 · QWEN 2.5 · SEALED</div>
            </div>
            <div className="lp-demo-node lp-anchor" ref={anchorNodeRef}>
              <div className="lp-row">
                <div className="lp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 4v16" /><circle cx="12" cy="6" r="2" /><path d="M5 13c0 4 3 7 7 7s7-3 7-7" /></svg></div>
                <span className="lp-nm">0G Storage</span><span className="lp-st" />
              </div>
              <div className="lp-body">AN·02 · ANCHORED · 3/3</div>
            </div>
            <div className="lp-demo-meta">
              <span className="lp-pill"><span className="lp-dot" />RUN COMPLETE</span>
              <span style={{ color: 'var(--fg-3)' }}>2.40s · 1,240 GAS</span>
            </div>
            <div className="lp-demo-tx">tx · 0x4f3a…b27c</div>
          </div>
        </section>

        {/* ANCHOR */}
        <section id="lp-anchor" className="lp-section">
          <div className="lp-receipt-row">
            <div className="lp-reveal">
              <div className="lp-sect-head" style={{ marginBottom: 0 }}>
                <span className="lp-eyebrow">03 · Verify</span>
                <h2 className="lp-h2">Every run has <span className="lp-grad">a receipt.</span></h2>
                <p className="lp-lede">Each execution produces a real transaction hash. Paste it into the 0G explorer — the result, timestamp, and storage root are permanently on-chain.</p>
              </div>
            </div>
            <div className="lp-receipt lp-reveal">
              <div className="lp-receipt-header">
                <div className="lp-receipt-store">0G Flow</div>
                <div className="lp-receipt-sub">Galileo Testnet · Execution Receipt</div>
              </div>
              <div className="lp-receipt-body">
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Run ID</span>
                  <span className="lp-receipt-value">run-2k4f</span>
                </div>
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Manifest</span>
                  <span className="lp-receipt-value">galileo · v0.4.2</span>
                </div>
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Block</span>
                  <span className="lp-receipt-value">2,481,902</span>
                </div>
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Duration</span>
                  <span className="lp-receipt-value">2.40 s</span>
                </div>
                <hr className="lp-receipt-divider" />
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Tx hash</span>
                  <span className="lp-receipt-value tx">0x4f3a…b27c</span>
                </div>
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Sealed</span>
                  <span className="lp-receipt-value em">✓ TEE attested</span>
                </div>
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Replicas</span>
                  <span className="lp-receipt-value em">3 / 3</span>
                </div>
              </div>
              <div className="lp-receipt-footer">
                <span className="lp-receipt-status">
                  <span className="lp-receipt-status-dot" />ANCHORED
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* STATEMENT */}
        <section className="lp-statement lp-reveal">
          <h2 className="lp-h2-stmt">Your AI doesn't just run —<br />it leaves <span className="lp-grad" style={{ fontStyle: 'italic' }}>proof.</span></h2>
          <div className="lp-verbs">
            <span>BUILD</span><span className="lp-dot-sep">·</span><span>RUN</span><span className="lp-dot-sep">·</span><span>VERIFY</span>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-final">
          <div className="lp-final-inner lp-reveal">
            <h2 className="lp-h2">Ready to ship something <span className="lp-grad">real?</span></h2>
            <WalletButton />
          </div>
        </section>

        <footer className="lp-footer">
          <img src="/flow-wordmark.svg" alt="0G Flow" />
          <div className="lp-footer-links">
            <a href="#">DOCS</a>
            <a href="#">EXPLORER</a>
            <a href="#">GITHUB</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Dashboard() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const handleDeploy = useCallback(() => {
    if (nodes.length === 0) {
      alert('Please add nodes to the workflow before deploying');
      return;
    }

    const compiled = compileManifest(nodes, edges, address || '0x0');
    setManifest(compiled);
    setIsModalOpen(true);
  }, [nodes, edges, address]);

  const handleExecuteManifest = useCallback(async (manifestToExecute: Manifest) => {
    setIsExecuting(true);
    setLogs([]);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest: manifestToExecute }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      setLogs(result.logs || []);

      if (!result.success) {
        alert(`Workflow failed: ${result.error}`);
        return;
      }

      const pendingAnchors: PendingAnchor[] = result.pendingAnchors || [];
      if (pendingAnchors.length > 0) {
        if (!walletClient) {
          throw new Error('Wallet not connected — cannot sign storage uploads');
        }

        setLogs((prev) => [
          ...prev,
          {
            id: `log_storage_start_${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'info' as const,
            message: `Signing ${pendingAnchors.length} storage upload(s) with your wallet…`,
          },
        ]);

        const anchorResults = await uploadPendingAnchors(pendingAnchors, walletClient);

        setLogs((prev) => [
          ...prev,
          ...anchorResults.map((r) => ({
            id: `log_anchor_${r.nodeId}_${Date.now()}`,
            timestamp: r.timestamp,
            level: 'success' as const,
            nodeId: r.nodeId,
            nodeType: 'storage_anchor',
            message: `Anchored to 0G Storage — ${r.explorer}`,
            transactionHash: r.transactionHash,
            data: { rootHash: r.rootHash, key: r.key },
          })),
        ]);
      }
      setShowReceipt(true);
    } catch (error: any) {
      setLogs((prevLogs) => [
        ...prevLogs,
        {
          id: `log_error_${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'error' as const,
          message: `Execution error: ${error.message}`,
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  }, [walletClient]);

  const chainId = useChainId();
  const network = getNetwork(chainId);
  const networkLabel = network?.name || 'Galileo · 16602';

  return (
    <div className="flex h-screen w-screen bg-bg-0">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar — 3-column: brand | chips | actions */}
        <header style={{ height: 48, flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 16px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line-2)', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--brand-grad)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 12, fontWeight: 500, color: 'var(--fg-1)', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>0G Flow</span>
            <span style={{ color: 'var(--fg-4)', fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11 }}>/</span>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>untitled-workflow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="cv-chip"><span className="cv-pulse" />{networkLabel}</span>
            <span className="cv-chip">{nodes.length} nodes · {edges.length} edges</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => logs.length > 0 && setShowReceipt(true)} style={{ display: logs.length > 0 ? 'inline-flex' : 'none' }}>receipt</button>
            <WalletButton />
            <button
              onClick={handleDeploy}
              disabled={isExecuting}
              className={`btn-deploy ${isExecuting ? 'is-running' : 'is-pulsing'}`}
            >
              {isExecuting && <span className="shimmer" />}
              {isExecuting ? 'Running…' : '▸ execute'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas onNodesChange={setNodes} onEdgesChange={setEdges} isRunning={isExecuting} />
          <Drawer logs={logs} manifest={manifest} isRunning={isExecuting} />
        </div>

        <ManifestModal
          manifest={manifest}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onExecute={handleExecuteManifest}
        />

        {showReceipt && (
          <ReceiptModal
            manifest={manifest}
            logs={logs}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </div>
    </div>
  );
}

function ReceiptModal({ manifest, logs, onClose }: { manifest: Manifest | null; logs: ExecutionLog[]; onClose: () => void }) {
  const successCount = logs.filter(l => l.level === 'success').length;
  const errorCount = logs.filter(l => l.level === 'error').length;
  const anchors = logs.filter(l => l.transactionHash);
  const ts = new Date().toLocaleString('en-US', { hour12: false });

  const handlePrint = () => window.print();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <style>{`
        @media print {
          body > *:not(.receipt-print-root) { display: none !important; }
          .receipt-print-root { position: fixed !important; inset: 0 !important; background: white !important; color: black !important; padding: 32px !important; font-family: monospace !important; }
          .receipt-no-print { display: none !important; }
        }
      `}</style>
      <div className="receipt-print-root" style={{ background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 12, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        {/* Terminal header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg-2)', borderRadius: '12px 12px 0 0' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
          <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.10em', marginLeft: 6 }}>execution receipt · {manifest?.workflow_id || 'unknown'}</span>
          <button className="receipt-no-print" onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--fg-4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>

        {/* Receipt body */}
        <div style={{ padding: '20px 20px 16px' }}>
          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: errorCount > 0 ? 'rgba(244,113,116,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${errorCount > 0 ? 'rgba(244,113,116,0.25)' : 'rgba(52,211,153,0.25)'}`, borderRadius: 8 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 18 }}>{errorCount > 0 ? '✗' : '✓'}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 12, fontWeight: 600, color: errorCount > 0 ? 'var(--err-500)' : 'var(--ok-500)' }}>{errorCount > 0 ? 'EXECUTION FAILED' : 'EXECUTION COMPLETE'}</div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, color: 'var(--fg-4)', marginTop: 2 }}>{ts}</div>
            </div>
          </div>

          {/* KV rows */}
          {[
            { k: 'Workflow ID', v: manifest?.workflow_id || '—' },
            { k: 'Nodes', v: String(manifest?.nodes.length ?? '—') },
            { k: 'Edges', v: String(manifest?.edges.length ?? '—') },
            { k: 'Log events', v: String(logs.length) },
            { k: 'Successful', v: String(successCount), hi: !errorCount },
            { k: 'Errors', v: String(errorCount), hi: errorCount > 0 },
          ].map(row => (
            <div key={row.k} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line-1)', fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11 }}>
              <span style={{ color: 'var(--fg-4)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'center' }}>{row.k}</span>
              <span style={{ color: (row as any).hi ? 'var(--ok-500)' : 'var(--fg-1)' }}>{row.v}</span>
            </div>
          ))}

          {anchors.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 6 }}>Anchor Transactions</div>
              {anchors.map(l => (
                <div key={l.id} style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, color: 'var(--anchor-300)', padding: '2px 0' }}>
                  ✓ {l.transactionHash?.slice(0, 18)}…
                  {l.transactionHash && (
                    <a href={`https://explorer.0g.ai/tx/${l.transactionHash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--input-300)', marginLeft: 8 }}>↗ explorer</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="receipt-no-print" style={{ display: 'flex', gap: 8, padding: '12px 20px 16px', borderTop: '1px solid var(--line-1)' }}>
          <button onClick={handlePrint} style={{ flex: 1, fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', height: 32, border: '1px solid var(--line-2)', borderRadius: 6, background: 'var(--bg-2)', color: 'var(--fg-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>⎙ print / save pdf</button>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', height: 32, padding: '0 16px', border: '1px solid var(--line-2)', borderRadius: 6, background: 'transparent', color: 'var(--fg-3)', cursor: 'pointer' }}>close</button>
        </div>
      </div>
    </div>
  );
}
