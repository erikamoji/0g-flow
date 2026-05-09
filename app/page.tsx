'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Sidebar } from '@/components/Sidebar';
import { Canvas } from '@/components/Canvas';
import { ManifestModal } from '@/components/ManifestModal';
import { Drawer } from '@/components/Drawer';
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
        .lp-h1 { font-size: clamp(44px, 6.5vw, 88px); font-weight: 600; line-height: 1.02; letter-spacing: -0.025em; margin: 0; font-family: var(--font-inter-tight, sans-serif); }
        .lp-h2 { font-size: clamp(30px, 3.8vw, 52px); font-weight: 600; line-height: 1.05; letter-spacing: -0.02em; margin: 0; font-family: var(--font-inter-tight, sans-serif); }
        .lp-lede { font-size: clamp(15px, 1.3vw, 17px); line-height: 1.6; color: var(--fg-2); max-width: 520px; margin: 0; }
        .lp-grad { background: var(--brand-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
        /* HERO */
        .lp-hero { min-height: calc(100vh - 64px); display: grid; place-items: center; padding: 40px 32px 80px; position: relative; overflow: hidden; }
        .lp-hero-grid { position: absolute; inset: 0; background-color: var(--bg-0); background-image: radial-gradient(circle at 1px 1px, var(--grid-dot) 1px, transparent 0); background-size: 24px 24px; mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent 80%); -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent 80%); }
        .lp-hero-glow { position: absolute; inset: 0; pointer-events: none; }
        .lp-hero-glow::before { content: ""; position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(100px); opacity: 0.30; background: radial-gradient(circle, var(--input-glow), var(--logic-glow)); left: 50%; top: 50%; transform: translate(-50%, -50%); }
        .lp-hero-inner { text-align: center; max-width: 860px; position: relative; display: flex; flex-direction: column; align-items: center; gap: 0; }
        .lp-hero-sub { color: var(--fg-3); margin: 24px auto 0; max-width: 480px; font-size: 17px; line-height: 1.6; }
        .lp-scroll-arrow { margin-top: 56px; display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--fg-4); cursor: pointer; background: none; border: none; padding: 0; animation: lp-bounce 2.2s ease-in-out infinite; }
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
          <a href="#lp-compose">Compose</a>
          <a href="#lp-deploy">Deploy</a>
          <a href="#lp-anchor">Anchor</a>
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

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-grid" />
          <div className="lp-hero-glow" />
          <div className="lp-hero-inner lp-reveal">
            <h1 className="lp-h1">Compose decentralized AI,<br /><span className="lp-grad" style={{ fontStyle: 'italic' }}>visually.</span></h1>
            <p className="lp-hero-sub">Triggers, sealed inferences, on-chain anchors. One signed manifest. No servers.</p>
            <button className="lp-scroll-arrow" onClick={() => document.getElementById('lp-compose')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Scroll down">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>
        </section>

        {/* COMPOSE */}
        <section id="lp-compose" className="lp-section">
          <div className="lp-sect-head lp-reveal">
            <span className="lp-eyebrow">01 · Compose</span>
            <h2 className="lp-h2">Three primitives. <span className="lp-grad">Infinite graphs.</span></h2>
            <p className="lp-lede">Three node types. Connect them by intent.</p>
          </div>
          <div className="lp-nodes-grid lp-reveal-stagger">
            <div className="lp-archetype lp-input">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="14" height="12" rx="2" /><path d="M17 12h4M19 10l2 2-2 2" /></svg>
              </div>
              <div className="lp-a-eyebrow">Input</div>
              <h3>Trigger anything.</h3>
              <p>Webhook, schedule, or manual JSON. Signed at the edge.</p>
              <div className="lp-a-meta"><span className="lp-tag">JSON</span><span className="lp-tag">CRON</span><span className="lp-tag">WEBHOOK</span></div>
            </div>
            <div className="lp-archetype lp-logic">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M3 12h3M18 12h3M12 3v3M12 18v3" /></svg>
              </div>
              <div className="lp-a-eyebrow">Logic</div>
              <h3>Sealed inference.</h3>
              <p>Run models on 0G Compute. Attested in a TEE.</p>
              <div className="lp-a-meta"><span className="lp-tag">QWEN 2.5</span><span className="lp-tag">GLM-4</span><span className="lp-tag">SEALED</span></div>
            </div>
            <div className="lp-archetype lp-anchor">
              <div className="lp-a-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16" /><circle cx="12" cy="6" r="2" /><path d="M5 13c0 4 3 7 7 7s7-3 7-7" /></svg>
              </div>
              <div className="lp-a-eyebrow">Anchor</div>
              <h3>On-chain by default.</h3>
              <p>Output hash committed to Galileo. Verifiable forever.</p>
              <div className="lp-a-meta"><span className="lp-tag">KECCAK256</span><span className="lp-tag">3 / 3 REPLICAS</span></div>
            </div>
          </div>
        </section>

        {/* DEPLOY */}
        <section id="lp-deploy" className="lp-section">
          <div className="lp-sect-head lp-reveal">
            <span className="lp-eyebrow">02 · Deploy</span>
            <h2 className="lp-h2">One button. <span className="lp-grad">Runs everywhere.</span></h2>
            <p className="lp-lede">Your graph compiles to a signed manifest. The 0G runtime takes it from there.</p>
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
                <span className="lp-eyebrow">03 · Anchor</span>
                <h2 className="lp-h2">Receipts <span className="lp-grad">on-chain.</span></h2>
                <p className="lp-lede">Every run produces a signed, immutable receipt. Hash, block, attestation — permanent.</p>
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
          <h2 className="lp-h2-stmt">Workflows that <span className="lp-grad" style={{ fontStyle: 'italic' }}>outlive</span><br />their authors.</h2>
          <div className="lp-verbs">
            <span>COMPOSE</span><span className="lp-dot-sep">·</span><span>DEPLOY</span><span className="lp-dot-sep">·</span><span>ANCHOR</span>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-final">
          <div className="lp-final-inner lp-reveal">
            <h2 className="lp-h2">Build something <span className="lp-grad">trustless.</span></h2>
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
    <div className="flex h-screen w-screen bg-bg-0">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 0 20px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="brand-wordmark" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>0G Flow</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
              <span>WORKFLOWS</span>
              <span style={{ color: 'var(--fg-4)' }}>/</span>
              <span style={{ color: 'var(--fg-1)' }}>Untitled</span>
            </div>
            <span className="hdr-net"><span className="dot" />GALILEO TESTNET</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="eyebrow">{nodes.length} NODES · {edges.length} EDGES</span>
            <WalletButton />
            <button
              onClick={handleDeploy}
              disabled={isExecuting}
              className={`btn-deploy ${isExecuting ? 'is-running' : 'is-pulsing'}`}
            >
              {isExecuting && <span className="shimmer" />}
              {isExecuting ? 'Running…' : 'Deploy'}
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
      </div>
    </div>
  );
}
