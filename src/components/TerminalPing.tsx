'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

interface TerminalLine {
  text: string;
  type: 'system' | 'cmd' | 'reply' | 'timeout' | 'stats' | 'default';
}

export default function TerminalPing() {
  const [target, setTarget] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([
    { text: 'Microsoft Windows [Version 10.0.22631]', type: 'system' },
    { text: '(c) Microsoft Corporation. All rights reserved.', type: 'system' },
    { text: '', type: 'default' },
    { text: 'Type a domain/URL below to test ping (e.g., google.com or 1.1.1.1)...', type: 'system' },
    { text: '', type: 'default' }
  ]);
  const [isPinging, setIsPinging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of terminal content smoothly
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handlePing = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = target.trim();
    if (!domain || isPinging) return;

    setIsPinging(true);
    setTarget('');

    // Append entered command line
    setLines((prev) => [...prev, { text: domain, type: 'cmd' }]);
    
    // Tiny delay before outputting initial ping response
    await new Promise((resolve) => setTimeout(resolve, 300));
    setLines((prev) => [...prev, { text: `Pinging ${domain} dengan 32 bytes of data...`, type: 'system' }]);

    let successCount = 0;
    let failCount = 0;

    // Run 4 iterations with a 1-second delay
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        const res = await fetch('/api/cmd-ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: domain }),
        });
        const data = await res.json();
        
        if (data.success) {
          successCount++;
          setLines((prev) => [
            ...prev,
            { text: `Reply from ${data.target}: time=${data.latency}ms status=${data.status}`, type: 'reply' }
          ]);
        } else {
          failCount++;
          setLines((prev) => [...prev, { text: 'Request timed out.', type: 'timeout' }]);
        }
      } catch (err) {
        failCount++;
        setLines((prev) => [...prev, { text: 'Request timed out.', type: 'timeout' }]);
      }
    }

    // Ping summary statistics output
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLines((prev) => [
      ...prev,
      { text: '', type: 'default' },
      { text: `Ping statistics for ${domain}:`, type: 'stats' },
      { text: `    Packets: Sent = 4, Received = ${successCount}, Lost = ${failCount} (${Math.round((failCount / 4) * 100)}% loss).`, type: 'stats' },
      { text: '', type: 'default' }
    ]);
    setIsPinging(false);
  };

  const clearConsole = () => {
    setLines([
      { text: 'Microsoft Windows [Version 10.0.22631]', type: 'system' },
      { text: '(c) Microsoft Corporation. All rights reserved.', type: 'system' },
      { text: '', type: 'default' },
      { text: 'Console cleared. Ready for next target ping.', type: 'system' }
    ]);
  };

  return (
    <Card className="w-full border-border bg-card shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Terminal className="h-4.5 w-4.5 text-muted-foreground" />
          <div>
            <CardTitle className="text-sm font-bold">Interactive Ping Console</CardTitle>
            <CardDescription className="text-[11px]">Simulate a diagnostic CMD ping directly from the browser</CardDescription>
          </div>
        </div>
        <button 
          onClick={clearConsole}
          disabled={isPinging}
          className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md border border-border/40 disabled:opacity-50 transition-all duration-300"
        >
          Clear
        </button>
      </CardHeader>
      <CardContent className="p-4">
        {/* Terminal Window container with glassmorphism */}
        <div className="w-full bg-black/85 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-zinc-800/60">
          {/* Mock Window Controls Header */}
          <div className="bg-zinc-950/75 px-4 py-2 border-b border-zinc-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            <span className="text-[10px] text-zinc-500 font-mono ml-2">cmd.exe - ping</span>
          </div>

          {/* Terminal Console output area */}
          <div className="p-4 h-[320px] overflow-y-auto font-mono text-xs space-y-2.5 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {lines.map((line, index) => {
              if (line.type === 'cmd') {
                return (
                  <div key={index} className="flex items-center gap-1.5 leading-relaxed">
                    <span className="text-zinc-600 select-none">C:\Users\Admin&gt; ping</span>
                    <span className="text-zinc-100 font-semibold">{line.text}</span>
                  </div>
                );
              }
              
              if (line.type === 'reply') {
                return (
                  <div key={index} className="text-emerald-400 font-medium drop-shadow-[0_0_6px_rgba(52,211,153,0.45)] leading-relaxed">
                    {line.text}
                  </div>
                );
              }

              if (line.type === 'timeout') {
                return (
                  <div key={index} className="text-rose-500 font-medium drop-shadow-[0_0_6px_rgba(244,63,94,0.45)] leading-relaxed">
                    {line.text}
                  </div>
                );
              }

              if (line.type === 'system') {
                return (
                  <div key={index} className="text-zinc-400 leading-relaxed">
                    {line.text}
                  </div>
                );
              }

              if (line.type === 'stats') {
                return (
                  <div key={index} className="text-yellow-400/90 font-medium leading-relaxed">
                    {line.text}
                  </div>
                );
              }

              return (
                <div key={index} className="text-zinc-300 leading-relaxed min-h-[1rem]">
                  {line.text}
                </div>
              );
            })}
            
            {/* Input Form line */}
            <form onSubmit={handlePing} className="flex items-center pt-2">
              <span className="text-zinc-600 select-none shrink-0 mr-1.5">C:\Users\Admin&gt; ping</span>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={isPinging ? 'Pinging...' : 'example.com'}
                disabled={isPinging}
                className="bg-transparent border-none outline-none focus:outline-none flex-1 text-zinc-100 font-mono text-xs placeholder:text-zinc-800 caret-emerald-400"
                autoComplete="off"
                spellCheck={false}
              />
            </form>
            
            {/* Anchor for auto-scroll */}
            <div ref={bottomRef} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
