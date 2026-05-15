'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { useAccount, useWalletClient, useChainId, useDisconnect, useSwitchChain } from 'wagmi';
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
import { WorkflowTemplate, WORKFLOW_TEMPLATES } from '@/lib/templates';

const OG_CHAINS = [
  {
    chainId: '0x40da', // 16602
    chainName: '0G Galileo Testnet',
    nativeCurrency: { name: '0G Token', symbol: 'A0G', decimals: 18 },
    rpcUrls: ['https://evmrpc-testnet.0g.ai'],
    blockExplorerUrls: ['https://explorer.0g.ai'],
  },
  {
    chainId: '0x4115', // 16661
    chainName: '0G Aristotle Mainnet',
    nativeCurrency: { name: '0G Token', symbol: 'A0G', decimals: 18 },
    rpcUrls: ['https://evmrpc.0g.ai'],
    blockExplorerUrls: ['https://explorer.0g.ai'],
  },
];

export default function Home() {
  const { isConnected } = useAccount();

  // Pre-register 0G chains in MetaMask on app load so chain-switch never fails
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    for (const chain of OG_CHAINS) {
      (window as any).ethereum.request({ method: 'wallet_addEthereumChain', params: [chain] })
        .catch(() => {});
    }
  }, []);

  if (!isConnected) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const edge1Ref = useRef<SVGPathElement>(null);
  const edge2Ref = useRef<SVGPathElement>(null);
  const hIoutRef = useRef<SVGGElement>(null);
  const hLinRef = useRef<SVGGElement>(null);
  const hLoutRef = useRef<SVGGElement>(null);
  const hAinRef = useRef<SVGGElement>(null);
  const p1aRef = useRef<SVGCircleElement>(null);
  const p1bRef = useRef<SVGCircleElement>(null);
  const p2aRef = useRef<SVGCircleElement>(null);
  const p2bRef = useRef<SVGCircleElement>(null);
  const inputNodeRef = useRef<HTMLDivElement>(null);
  const logicNodeRef = useRef<HTMLDivElement>(null);
  const anchorNodeRef = useRef<HTMLDivElement>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [block, setBlock] = useState(2481902);
  const [copied, setCopied] = useState<string | null>(null);

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
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    document.querySelectorAll('.lp-reveal, .lp-reveal-stagger').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Terminal auto-replay
  useEffect(() => {
    const t = setTimeout(() => setReplayKey(k => k + 1), 6500);
    return () => clearTimeout(t);
  }, [replayKey]);

  // Live block counter
  useEffect(() => {
    const id = setInterval(() => setBlock(b => b + 1), 4200);
    return () => clearInterval(id);
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

  const copyTx = (id: string) => {
    navigator.clipboard.writeText('0x4f3a8e91b2c7d4f3a8e91b2c7d4b27c').catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div style={{ background: 'var(--bg-0)', color: 'var(--fg-1)', fontFamily: 'var(--font-inter-tight, sans-serif)', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        /* NAV */
        .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); background: rgba(7,9,12,0.50); border-bottom: 1px solid transparent; transition: border-color 250ms, background 250ms; gap: 16px; }
        .lp-nav.lp-scrolled { border-bottom-color: var(--line-2); background: rgba(7,9,12,0.82); }
        .lp-nav-mark img { height: 26px; display: block; }
        .lp-nav-links { display: flex; gap: 28px; }
        .lp-nav-links a { font-size: 13px; color: var(--fg-3); text-decoration: none; transition: color 150ms; }
        .lp-nav-links a:hover { color: var(--fg-1); }
        /* Live block pill */
        .lp-block-pill { font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.18); border-radius: 999px; padding: 4px 10px; color: var(--fg-3); white-space: nowrap; margin-left: auto; }
        .lp-block-pill .lp-live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ok-500); box-shadow: 0 0 6px var(--ok-glow); animation: lp-live-pulse 2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes lp-live-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; box-shadow: 0 0 10px var(--ok-glow); } }
        .lp-block-num { color: var(--ok-500); font-variant-numeric: tabular-nums; }
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
        /* TYPEWRITER */
        .lp-typewriter { display: inline-block; overflow: hidden; white-space: nowrap; max-width: 0; border-right: 2px solid var(--anchor-300); vertical-align: bottom; animation: lp-type 1.1s steps(22, end) 0.5s forwards, lp-cursor 0.7s step-end 0.5s 4; }
        @keyframes lp-type { to { max-width: 680px; } }
        @keyframes lp-cursor { 0%, 100% { border-color: transparent; } 50% { border-color: var(--anchor-300); } }
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
        .lp-ht-tx { color: var(--input-300); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; text-decoration-style: dotted; }
        .lp-ht-tx:hover { color: var(--input-50); }
        .lp-ht-l1 { animation: lp-ht-fade 0.3s ease forwards 0.4s; }
        .lp-ht-l2 { animation: lp-ht-fade 0.3s ease forwards 0.8s; }
        .lp-ht-l3 { animation: lp-ht-fade 0.3s ease forwards 1.1s; }
        .lp-ht-l4 { animation: lp-ht-fade 0.3s ease forwards 1.9s; }
        .lp-ht-l5 { animation: lp-ht-fade 0.3s ease forwards 2.1s; }
        .lp-ht-l6 { animation: lp-ht-fade 0.3s ease forwards 2.6s; }
        .lp-ht-l7 { animation: lp-ht-fade 0.3s ease forwards 2.9s; }
        @keyframes lp-ht-fade { to { opacity: 1; } }
        /* COPY TOAST */
        .lp-copy-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ok-500); background: var(--bg-2); border: 1px solid rgba(52,211,153,0.3); border-radius: 999px; padding: 6px 16px; z-index: 100; animation: lp-toast-in 0.2s ease; pointer-events: none; display: flex; align-items: center; gap: 6px; }
        .lp-copy-toast::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--ok-500); box-shadow: 0 0 6px var(--ok-glow); display: inline-block; }
        @keyframes lp-toast-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .lp-scroll-arrow { margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--fg-4); cursor: pointer; background: none; border: none; padding: 0; animation: lp-bounce 2.2s ease-in-out infinite; }
        .lp-scroll-arrow svg { width: 20px; height: 20px; }
        @keyframes lp-bounce { 0%, 100% { transform: translateY(0); } 55% { transform: translateY(8px); } }
        /* REVEALS */
        .lp-reveal { opacity: 0; transform: translateY(20px); transition: opacity 650ms cubic-bezier(0.2,0.8,0.2,1), transform 650ms cubic-bezier(0.2,0.8,0.2,1); will-change: opacity, transform; }
        .lp-reveal.in { opacity: 1; transform: none; will-change: auto; }
        .lp-reveal-stagger > * { opacity: 0; transform: translateY(18px); transition: opacity 600ms cubic-bezier(0.2,0.8,0.2,1), transform 600ms cubic-bezier(0.2,0.8,0.2,1); will-change: opacity, transform; }
        .lp-reveal-stagger.in > * { will-change: auto; }
        .lp-reveal-stagger.in > *:nth-child(1) { opacity: 1; transform: none; transition-delay: 0ms; }
        .lp-reveal-stagger.in > *:nth-child(2) { opacity: 1; transform: none; transition-delay: 120ms; }
        .lp-reveal-stagger.in > *:nth-child(3) { opacity: 1; transform: none; transition-delay: 240ms; }
        .lp-reveal-stagger.in > *:nth-child(4) { opacity: 1; transform: none; transition-delay: 360ms; }
        .lp-reveal-stagger.in > *:nth-child(5) { opacity: 1; transform: none; transition-delay: 480ms; }
        .lp-reveal-stagger.in > *:nth-child(6) { opacity: 1; transform: none; transition-delay: 600ms; }
        /* SECTION HEADS */
        .lp-sect-head { display: flex; flex-direction: column; gap: 18px; max-width: 680px; margin-bottom: 64px; }
        /* ARCHETYPE CARDS */
        .lp-nodes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .lp-archetype { background: var(--bg-2); border: 1px solid var(--line-2); border-radius: 14px; padding: 24px; position: relative; overflow: hidden; transition: transform 350ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 350ms; animation: lp-float var(--float-dur, 6s) ease-in-out infinite var(--float-delay, 0s); }
        .lp-archetype:hover { transform: translateY(-6px) !important; animation-play-state: paused; }
        @keyframes lp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .lp-archetype.lp-input  { --float-dur: 6.2s; --float-delay: 0s; }
        .lp-archetype.lp-logic  { --float-dur: 7.1s; --float-delay: 0.8s; }
        .lp-archetype.lp-anchor { --float-dur: 6.6s; --float-delay: 1.6s; }
        .lp-archetype::after { content: ""; position: absolute; inset: -1px; border-radius: 14px; pointer-events: none; opacity: 0; transition: opacity 300ms; }
        .lp-archetype.lp-input::after  { box-shadow: var(--glow-input); }
        .lp-archetype.lp-logic::after  { box-shadow: var(--glow-logic); }
        .lp-archetype.lp-anchor::after { box-shadow: var(--glow-anchor); }
        .lp-archetype:hover::after { opacity: 1; }
        .lp-a-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 10px; margin-bottom: 18px; }
        .lp-a-icon svg { width: 20px; height: 20px; }
        .lp-archetype.lp-input  .lp-a-icon { background: rgba(42,123,255,0.12); color: var(--input-300); }
        .lp-archetype.lp-logic  .lp-a-icon { background: rgba(124,92,255,0.14); color: var(--logic-300); }
        .lp-archetype.lp-anchor .lp-a-icon { background: rgba(16,185,129,0.14); color: var(--anchor-300); }
        .lp-a-eyebrow { font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px; }
        .lp-archetype.lp-input  .lp-a-eyebrow { color: var(--input-300); }
        .lp-archetype.lp-logic  .lp-a-eyebrow { color: var(--logic-300); }
        .lp-archetype.lp-anchor .lp-a-eyebrow { color: var(--anchor-300); }
        .lp-archetype h3 { font-size: 20px; font-weight: 600; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 8px; color: var(--fg-1); }
        .lp-archetype p { font-size: 13.5px; line-height: 1.55; color: var(--fg-2); margin: 0 0 16px; }
        .lp-a-meta { display: flex; gap: 6px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--line-1); }
        .lp-tag { font-family: var(--font-jetbrains-mono, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 7px; border-radius: 4px; background: var(--bg-1); border: 1px solid var(--line-2); color: var(--fg-3); white-space: nowrap; }
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
        .lp-canvas-demo.in .lp-demo-edge.lp-flow { stroke-dasharray: 3 5; stroke-opacity: 0.35; animation: lp-ed 1.1s linear infinite 1.3s; }
        @keyframes lp-ed { to { stroke-dashoffset: -16; } }
        /* Particles */
        .lp-particle { opacity: 0; filter: url(#lp-glow-filter); transition: opacity 400ms ease 1.1s; }
        .lp-canvas-demo.in .lp-particle { opacity: 1; }
        .lp-demo-handle { opacity: 0; transition: opacity 400ms ease 800ms; }
        .lp-canvas-demo.in .lp-demo-handle { opacity: 1; }
        .lp-demo-handle .lp-ring { fill: var(--bg-1); }
        .lp-demo-meta { position: absolute; left: 24px; bottom: 20px; display: flex; gap: 16px; align-items: center; font-family: var(--font-jetbrains-mono, monospace); font-size: 10.5px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-3); }
        .lp-demo-meta .lp-pill { padding: 4px 10px; border-radius: 999px; background: rgba(52,211,153,0.10); border: 1px solid rgba(52,211,153,0.30); color: var(--ok-500); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
        .lp-demo-meta .lp-pill .lp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ok-500); box-shadow: 0 0 8px var(--ok-glow); }
        .lp-demo-tx { position: absolute; right: 24px; bottom: 20px; font-family: var(--font-jetbrains-mono, monospace); font-size: 13px; color: var(--input-300); white-space: nowrap; cursor: pointer; }
        .lp-demo-tx:hover { color: var(--input-50); }
        /* RECEIPT */
        .lp-receipt-row { display: grid; grid-template-columns: 1.1fr 1fr; gap: 56px; align-items: center; }
        .lp-receipt { width: 100%; max-width: 340px; font-family: var(--font-jetbrains-mono, monospace); background: var(--bg-1); border: 1px solid var(--line-2); border-radius: 4px; box-shadow: var(--shadow-3), 0 0 60px -20px rgba(93,227,165,0.12); overflow: hidden; position: relative; }
        .lp-receipt::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--brand-grad); }
        .lp-receipt-header { padding: 20px 20px 16px; text-align: center; border-bottom: 1px dashed var(--line-3); }
        .lp-receipt-store { font-size: 14px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--fg-1); }
        .lp-receipt-sub { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-4); margin-top: 3px; }
        .lp-receipt-body { padding: 14px 20px; display: flex; flex-direction: column; gap: 0; }
        .lp-receipt-row-item { display: flex; justify-content: space-between; align-items: baseline; padding: 7px 0; border-bottom: 1px solid var(--line-1); opacity: 0; transform: translateX(-6px); transition: opacity 0.25s ease, transform 0.25s ease; }
        .lp-receipt.in .lp-receipt-row-item { opacity: 1; transform: none; }
        .lp-receipt.in .lp-receipt-row-item:nth-child(1) { transition-delay: 80ms; }
        .lp-receipt.in .lp-receipt-row-item:nth-child(2) { transition-delay: 160ms; }
        .lp-receipt.in .lp-receipt-row-item:nth-child(3) { transition-delay: 240ms; }
        .lp-receipt.in .lp-receipt-row-item:nth-child(4) { transition-delay: 320ms; }
        .lp-receipt.in .lp-receipt-row-item:nth-child(5) { transition-delay: 400ms; }
        .lp-receipt.in .lp-receipt-row-item:nth-child(6) { transition-delay: 500ms; }
        .lp-receipt.in .lp-receipt-row-item:nth-child(7) { transition-delay: 600ms; }
        .lp-receipt-row-item:last-child { border-bottom: none; }
        .lp-receipt-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-3); }
        .lp-receipt-value { font-size: 12px; color: var(--fg-1); text-align: right; }
        .lp-receipt-value.tx { color: var(--input-300); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; text-decoration-style: dotted; }
        .lp-receipt-value.tx:hover { color: var(--input-50); }
        .lp-receipt-value.em { color: var(--anchor-300); }
        .lp-receipt-divider { border: none; border-top: 1px dashed var(--line-3); margin: 4px 0; }
        .lp-receipt-footer { padding: 12px 20px 18px; text-align: center; }
        .lp-receipt-status { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ok-500); background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.22); border-radius: 999px; padding: 5px 12px; animation: lp-receipt-glow 2.5s ease-in-out infinite; }
        .lp-receipt-status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ok-500); box-shadow: 0 0 6px var(--ok-glow); }
        @keyframes lp-receipt-glow { 0%, 100% { box-shadow: 0 0 0 rgba(52,211,153,0); } 50% { box-shadow: 0 0 16px rgba(52,211,153,0.18); } }
        /* STATEMENT */
        .lp-statement { text-align: center; padding: 100px 32px; max-width: 1200px; margin: 0 auto; }
        .lp-statement .lp-h2-stmt { font-size: clamp(36px, 5.5vw, 76px); font-weight: 600; line-height: 1.1; letter-spacing: -0.025em; font-family: var(--font-inter-tight, sans-serif); }
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
          .lp-block-pill { display: none; }
          .lp-receipt { max-width: 100%; }
        }
      `}</style>

      {copied && <div className="lp-copy-toast">TX COPIED</div>}

      {/* NAV */}
      <nav className="lp-nav" ref={navRef}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img src="/flow-wordmark.svg" alt="0G Flow" style={{ height: 26 }} />
        </a>
        <div className="lp-nav-links">
          <a href="#lp-compose">Build</a>
          <a href="#lp-deploy">Run</a>
          <a href="#lp-anchor">Verify</a>
        </div>
        <div className="lp-block-pill">
          <span className="lp-live-dot" />
          LIVE · BLOCK <span className="lp-block-num">{block.toLocaleString()}</span>
        </div>
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
            if (!mounted) return null;
            if (!account) return (
              <button className="lp-wallet-btn" onClick={openConnectModal} style={{ flexShrink: 0 }}>Connect wallet</button>
            );
            return (
              <button className="lp-wallet-btn connected" onClick={openAccountModal} style={{ flexShrink: 0 }}>
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

        {/* COMPOSE */}
        <section id="lp-compose" className="lp-section">
          <div className="lp-sect-head lp-reveal">
            <span className="lp-eyebrow">01 · Build</span>
            <h2 className="lp-h2">Four primitives. <span className="lp-grad">Infinite workflows.</span></h2>
            <p className="lp-lede">Every workflow is the same story: data comes in, AI thinks, result goes to memory, proof goes on-chain. Four node types. That's it.</p>
          </div>
          <div className="lp-nodes-grid lp-reveal-stagger">
            <div className="lp-archetype lp-input">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="14" height="12" rx="2" /><path d="M17 12h4M19 10l2 2-2 2" /></svg>
              </div>
              <div className="lp-a-eyebrow">Input</div>
              <h3>Your data, any shape.</h3>
              <p>Feed in JSON from any source — an API, a wallet event, or your own payload. This is where the workflow begins.</p>
              <div className="lp-a-meta"><span className="lp-tag">JSON</span><span className="lp-tag">CRON</span><span className="lp-tag">WEBHOOK</span></div>
            </div>
            <div className="lp-archetype lp-logic">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M3 12h3M18 12h3M12 3v3M12 18v3" /></svg>
              </div>
              <div className="lp-a-eyebrow">AI Compute</div>
              <h3>Inference, sealed.</h3>
              <p>Real models on 0G's decentralized compute — DeepSeek, Qwen, GLM. No external servers. No trust assumptions. Every call is attested.</p>
              <div className="lp-a-meta"><span className="lp-tag">DEEPSEEK V3</span><span className="lp-tag">QWEN</span><span className="lp-tag">TEE SEALED</span></div>
            </div>
            <div className="lp-archetype lp-anchor">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M5 14c0 4 3 7 7 7s7-3 7-7M3 14h4M17 14h4"/></svg>
              </div>
              <div className="lp-a-eyebrow">Storage Anchor</div>
              <h3>Stored. Permanent. Yours.</h3>
              <p>Your wallet signs the upload. The result lives on 0G Storage forever — a tx hash anyone can verify on the explorer, any time.</p>
              <div className="lp-a-meta"><span className="lp-tag">KECCAK256</span><span className="lp-tag">3 / 3 REPLICAS</span></div>
            </div>
            <div className="lp-archetype lp-memory">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M20 12c0 1.4-3.6 2.5-8 2.5S4 13.4 4 12"/><path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/></svg>
              </div>
              <div className="lp-a-eyebrow">Memory Store</div>
              <h3>Context that persists across runs.</h3>
              <p>Seal agent memory to 0G Storage between sessions. Retrieve it with cryptographic proof that it hasn't changed.</p>
              <div className="lp-a-meta"><span className="lp-tag">SEALED</span><span className="lp-tag">RETRIEVAL</span><span className="lp-tag">VERIFIABLE</span></div>
            </div>
          </div>
        </section>

        {/* DEPLOY */}
        <section id="lp-deploy" className="lp-section">
          <div className="lp-sect-head lp-reveal">
            <span className="lp-eyebrow">02 · Run</span>
            <h2 className="lp-h2">One click. <span className="lp-grad">Watch the chain respond.</span></h2>
            <p className="lp-lede">Deploy compiles your graph to a signed manifest and streams live execution logs. Inference fires, storage anchors, tx hash lands — in under 3 seconds.</p>
          </div>
          <div className="lp-canvas-demo lp-reveal" ref={canvasRef}>
            <svg className="lp-demo-edges">
              <defs>
                <linearGradient id="lp-e1" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#FFB36F" /><stop offset="1" stopColor="#FF95C8" />
                </linearGradient>
                <linearGradient id="lp-e2" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#FF95C8" /><stop offset="1" stopColor="#FFE066" />
                </linearGradient>
                <filter id="lp-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <path id="lp-path-e1" className="lp-demo-edge lp-flow" pathLength={100} ref={edge1Ref} stroke="url(#lp-e1)" />
              <path id="lp-path-e2" className="lp-demo-edge lp-flow" pathLength={100} ref={edge2Ref} stroke="url(#lp-e2)" />
              {/* Particles on edge 1 */}
              <circle ref={p1aRef} r={3} fill="#FFB36F" className="lp-particle">
                <animateMotion dur="1.8s" repeatCount="indefinite" begin="1.3s">
                  <mpath href="#lp-path-e1" />
                </animateMotion>
              </circle>
              <circle ref={p1bRef} r={3} fill="#FF95C8" className="lp-particle">
                <animateMotion dur="1.8s" repeatCount="indefinite" begin="2.2s">
                  <mpath href="#lp-path-e1" />
                </animateMotion>
              </circle>
              {/* Particles on edge 2 */}
              <circle ref={p2aRef} r={3} fill="#FF95C8" className="lp-particle">
                <animateMotion dur="1.8s" repeatCount="indefinite" begin="1.7s">
                  <mpath href="#lp-path-e2" />
                </animateMotion>
              </circle>
              <circle ref={p2bRef} r={3} fill="#FFE066" className="lp-particle">
                <animateMotion dur="1.8s" repeatCount="indefinite" begin="2.5s">
                  <mpath href="#lp-path-e2" />
                </animateMotion>
              </circle>
              <g className="lp-demo-handle" ref={hIoutRef}><circle className="lp-ring" r={4.5} stroke="#FFB36F" strokeWidth={1.5} /><circle r={1.75} fill="#FFB36F" /></g>
              <g className="lp-demo-handle" ref={hLinRef}><circle className="lp-ring" r={4.5} stroke="#FF95C8" strokeWidth={1.5} /><circle r={1.75} fill="#FF95C8" /></g>
              <g className="lp-demo-handle" ref={hLoutRef}><circle className="lp-ring" r={4.5} stroke="#FF95C8" strokeWidth={1.5} /><circle r={1.75} fill="#FF95C8" /></g>
              <g className="lp-demo-handle" ref={hAinRef}><circle className="lp-ring" r={4.5} stroke="#FFE066" strokeWidth={1.5} /><circle r={1.75} fill="#FFE066" /></g>
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
            <div className="lp-demo-tx" onClick={() => copyTx('demo')} title="Click to copy">tx · 0x4f3a…b27c</div>
          </div>
        </section>

        {/* ANCHOR */}
        <section id="lp-anchor" className="lp-section">
          <div className="lp-receipt-row">
            <div className="lp-reveal">
              <div className="lp-sect-head" style={{ marginBottom: 0 }}>
                <span className="lp-eyebrow">03 · Verify</span>
                <h2 className="lp-h2">Every run is <span className="lp-grad">on the record.</span></h2>
                <p className="lp-lede">Each execution produces a real transaction hash. Paste it into the 0G explorer — the result, timestamp, and storage root are permanently on-chain.</p>
              </div>
            </div>
            <div className="lp-receipt lp-reveal">
              <div className="lp-receipt-header">
                <div className="lp-receipt-store">0G Flow</div>
                <div className="lp-receipt-sub">0G Testnet · Execution Receipt</div>
              </div>
              <div className="lp-receipt-body">
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Run ID</span>
                  <span className="lp-receipt-value">run-2k4f</span>
                </div>
                <div className="lp-receipt-row-item">
                  <span className="lp-receipt-label">Manifest</span>
                  <span className="lp-receipt-value">v0.4.2</span>
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
                  <span className="lp-receipt-value tx" onClick={() => copyTx('receipt')} title="Click to copy">0x4f3a…b27c</span>
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
          <h2 className="lp-h2-stmt">Your AI doesn't just run.<br />It leaves <span className="lp-grad" style={{ fontStyle: 'italic' }}>proof.</span></h2>
          <div className="lp-verbs">
            <span>BUILD</span><span className="lp-dot-sep">·</span><span>RUN</span><span className="lp-dot-sep">·</span><span>VERIFY</span>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-final">
          <div className="lp-final-inner lp-reveal">
            <h2 className="lp-h2">Ready to build AI that <span className="lp-grad">can't be disputed?</span></h2>
            <ConnectButton.Custom>
              {({ account, openConnectModal, mounted }) => {
                if (!mounted) return null;
                if (!account) return (
                  <button className="lp-wallet-btn" onClick={openConnectModal}>Connect wallet</button>
                );
                return (
                  <button className="lp-wallet-btn connected" onClick={() => {}}>
                    <span className="lp-wallet-dot" />
                    {account.displayName}
                  </button>
                );
              }}
            </ConnectButton.Custom>
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

const STORAGE_KEY = 'og-flow-workflow';
const RUNS_KEY = 'og-flow-runs';

interface RecentRun {
  id: string;
  timestamp: string;
  workflowName: string;
  success: boolean;
  logCount: number;
  logs: ExecutionLog[];
  manifest: Manifest | null;
}

const TOPBAR_CHAIN_NAMES: Record<number, string> = {
  16600: '0G TESTNET',
  16602: '0G GALILEO',
  16661: '0G ARISTOTLE',
};

function Dashboard() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [chainMenuOpen, setChainMenuOpen] = useState(false);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowName, setWorkflowName] = useState('Untitled');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [selectedRunKey, setSelectedRunKey] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [templateNodes, setTemplateNodes] = useState<Node[] | null>(null);
  const [templateEdges, setTemplateEdges] = useState<Edge[] | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'log' | 'manifest' | 'verify' | 'history'>('log');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { name, nodes: n, edges: e } = JSON.parse(saved);
        if (name) setWorkflowName(name);
        if (n) setNodes(n);
        if (e) setEdges(e);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RUNS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentRuns(parsed.map((r: any) => ({ logs: [], manifest: null, ...r })));
      }
    } catch {}
  }, []);

  const handleSave = useCallback(() => {
    const data = { name: workflowName, nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSavedName(workflowName);
    setTimeout(() => setSavedName(''), 1800);
  }, [workflowName, nodes, edges]);

  const commitName = useCallback(() => {
    setIsEditingName(false);
  }, []);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.select();
  }, [isEditingName]);

  const loadTemplate = useCallback((t: WorkflowTemplate) => {
    setTemplateNodes([...t.nodes]);
    setTemplateEdges([...t.edges]);
    setWorkflowName(t.name);
  }, []);

  const onSelectRun = useCallback((id: string, timestamp: string) => {
    if (isExecuting) return;
    const run = recentRuns.find(r => r.id === id && r.timestamp === timestamp);
    if (!run) return;
    setLogs(run.logs);
    setManifest(run.manifest);
    setSelectedRunKey(id + timestamp);
    if (run.logs.length > 0 && run.manifest) {
      setShowReceipt(true);
    } else {
      setDrawerTab('log');
    }
  }, [recentRuns, isExecuting]);

  const handleDeploy = useCallback(() => {
    if (nodes.length === 0) {
      alert('Please add nodes to the workflow before deploying');
      return;
    }

    const compiled = compileManifest(nodes, edges, address || '0x0', chainId);
    setManifest(compiled);
    setIsModalOpen(true);
  }, [nodes, edges, address, chainId]);

  const handleExecuteManifest = useCallback(async (manifestToExecute: Manifest) => {
    setIsExecuting(true);
    setSelectedRunKey(null);
    setLogs([]);
    let runLogs: ExecutionLog[] = [];
    let runSuccess = false;

    const appendLogs = (newLogs: ExecutionLog[]) => {
      runLogs = [...runLogs, ...newLogs];
      setLogs(prev => [...prev, ...newLogs]);
    };

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
      runLogs = result.logs || [];
      setLogs(runLogs);
      runSuccess = !!result.success;

      if (getNetwork(chainId).registryAddress) {
        registerWorkflow(chainId, manifestToExecute.workflow_id, JSON.stringify(manifestToExecute), manifestToExecute.workflow_id)
          .catch(() => {});
      }

      if (!result.success) {
        alert(`Workflow failed: ${result.error}`);
        return;
      }
      setShowReceipt(true);

      const pendingAnchors: PendingAnchor[] = result.pendingAnchors || [];
      if (pendingAnchors.length > 0) {
        if (!walletClient) {
          throw new Error('Wallet not connected — cannot sign storage uploads');
        }

        appendLogs([{
          id: `log_storage_start_${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'info' as const,
          message: `Signing ${pendingAnchors.length} storage upload(s) with your wallet…`,
        }]);

        const anchorResults = await uploadPendingAnchors(pendingAnchors, walletClient, chainId);

        appendLogs(anchorResults.map((r) => ({
          id: `log_anchor_${r.nodeId}_${Date.now()}`,
          timestamp: r.timestamp,
          level: 'success' as const,
          nodeId: r.nodeId,
          nodeType: 'storage_anchor',
          message: `Anchored to 0G Storage — ${r.explorer}`,
          transactionHash: r.transactionHash,
          data: { rootHash: r.rootHash, key: r.key },
        })));

        if (getNetwork(chainId).registryAddress && manifestToExecute) {
          for (const r of anchorResults) {
            recordExecution(chainId, manifestToExecute.workflow_id, r.transactionHash || '', r.key || '')
              .then((registryTxHash) => {
                setLogs((prev) => [...prev, {
                  id: `log_registry_${r.nodeId}_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  level: 'success' as const,
                  nodeId: r.nodeId,
                  message: `Execution recorded on-chain — https://explorer.0g.ai/tx/${registryTxHash}`,
                  transactionHash: registryTxHash,
                }]);
              })
              .catch(() => {});
          }
        }
      }
    } catch (error: any) {
      appendLogs([{
        id: `log_error_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error' as const,
        message: `Execution error: ${error.message}`,
      }]);
      alert(`Error executing workflow: ${error.message}`);
    } finally {
      setIsExecuting(false);
      const newRun: RecentRun = {
        id: manifestToExecute.workflow_id,
        timestamp: new Date().toISOString(),
        workflowName,
        success: runSuccess,
        logCount: runLogs.length,
        logs: runLogs,
        manifest: manifestToExecute,
      };
      setRecentRuns(prev => {
        const next = [newRun, ...prev].slice(0, 5);
        localStorage.setItem(RUNS_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [walletClient, workflowName, chainId]);

  return (
    <div className="flex h-screen w-screen bg-bg-0">
      <Sidebar onLoadTemplate={loadTemplate} />
      <div className="flex-1 flex flex-col">
        <header style={{ height: 48, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 16px 0 20px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line-2)', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-3)', minWidth: 0 }}>
            <span style={{ color: 'var(--fg-2)', fontWeight: 600, flexShrink: 0 }}>0G Flow</span>
            <span style={{ color: 'var(--fg-4)' }}>/</span>
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => { if (e.key === 'Enter') commitName(); }}
                style={{ color: 'var(--fg-1)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', width: Math.max(60, workflowName.length * 8) }}
              />
            ) : (
              <span style={{ color: 'var(--fg-1)', cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => setIsEditingName(true)}>{workflowName}</span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setChainMenuOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--fg-3)', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok-500)', boxShadow: '0 0 6px var(--ok-glow)', flexShrink: 0 }} />
              {TOPBAR_CHAIN_NAMES[chainId] || `CHAIN ${chainId}`}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {chainMenuOpen && (
              <div onClick={() => setChainMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
            )}
            {chainMenuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, background: 'var(--bg-1)', border: '1px solid var(--line-2)', borderRadius: 8, overflow: 'hidden', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                {([{ id: 16602, label: '0G GALILEO', sub: 'testnet' }, { id: 16661, label: '0G ARISTOTLE', sub: 'mainnet' }] as const).map(c => (
                  <button key={c.id} onClick={() => { switchChain({ chainId: c.id }); setChainMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: c.id === chainId ? 'var(--bg-3)' : 'none', border: 'none', padding: '9px 14px', cursor: 'pointer', fontFamily: 'var(--font-jetbrains-mono, monospace)', textAlign: 'left' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.id === chainId ? 'var(--ok-500)' : 'var(--fg-4)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.id === chainId ? 'var(--fg-1)' : 'var(--fg-3)' }}>{c.label}</div>
                      <div style={{ fontSize: 9, letterSpacing: '0.10em', color: 'var(--fg-4)', marginTop: 1 }}>{c.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={handleDeploy}
              disabled={isExecuting}
              className={`btn-deploy ${isExecuting ? 'is-running' : 'is-pulsing'}`}
            >
              {isExecuting && <span className="shimmer" />}
              {isExecuting ? 'Running…' : 'Deploy'}
            </button>
            <ConnectButton.Custom>
              {({ account, openConnectModal, mounted }) => {
                if (!mounted) return null;
                if (!account) return (
                  <button onClick={openConnectModal} style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--fg-2)', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Connect
                  </button>
                );
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderLeft: '2px solid var(--ok-500)', color: 'var(--fg-1)', padding: '4px 8px 4px 10px', borderRadius: 6, flexShrink: 0 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok-500)', boxShadow: '0 0 6px var(--ok-glow)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{account.displayName}</span>
                    <button onClick={() => disconnect()} title="Disconnect" style={{ background: 'none', border: 'none', color: 'var(--fg-4)', cursor: 'pointer', padding: 0, lineHeight: 0, borderRadius: 3, flexShrink: 0, marginLeft: 2, transition: 'color 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--err-500)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-4)')}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </button>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas onNodesChange={setNodes} onEdgesChange={setEdges} isRunning={isExecuting} externalNodes={templateNodes} externalEdges={templateEdges} />

          <Drawer logs={logs} manifest={manifest} isRunning={isExecuting} recentRuns={recentRuns} onSelectRun={onSelectRun} selectedRunKey={selectedRunKey} activeTab={drawerTab} onTabChange={setDrawerTab} />
        </div>

        <ManifestModal
          manifest={manifest}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onExecute={handleExecuteManifest}
        />

        {showReceipt && (
          <ReceiptModal manifest={manifest} logs={logs} onClose={() => setShowReceipt(false)} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg-2)', borderRadius: '12px 12px 0 0' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
          <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.10em', marginLeft: 6 }}>execution receipt · {manifest?.workflow_id || 'unknown'}</span>
          <button className="receipt-no-print" onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--fg-4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: errorCount > 0 ? 'rgba(244,113,116,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${errorCount > 0 ? 'rgba(244,113,116,0.25)' : 'rgba(52,211,153,0.25)'}`, borderRadius: 8 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 18 }}>{errorCount > 0 ? '✗' : '✓'}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 12, fontWeight: 600, color: errorCount > 0 ? 'var(--err-500)' : 'var(--ok-500)' }}>{errorCount > 0 ? 'EXECUTION FAILED' : 'EXECUTION COMPLETE'}</div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, color: 'var(--fg-4)', marginTop: 2 }}>{ts}</div>
            </div>
          </div>
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
        <div className="receipt-no-print" style={{ display: 'flex', gap: 8, padding: '12px 20px 16px', borderTop: '1px solid var(--line-1)' }}>
          <button onClick={handlePrint} style={{ flex: 1, fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', height: 32, border: '1px solid var(--line-2)', borderRadius: 6, background: 'var(--bg-2)', color: 'var(--fg-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>⎙ print / save pdf</button>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', height: 32, padding: '0 16px', border: '1px solid var(--line-2)', borderRadius: 6, background: 'transparent', color: 'var(--fg-3)', cursor: 'pointer' }}>close</button>
        </div>
      </div>
    </div>
  );
}
