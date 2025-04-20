import React, { useRef, useEffect, useState } from "react";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState<number>(100);
  const [size, setSize] = useState<number>(20);
  const [inconsistent, setInconsistent] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [objectColor, setObjectColor] = useState<string>("#4A90E2");
  const [bgColor, setBgColor] = useState<string>("#FFFFFF");
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [timerRemaining, setTimerRemaining] = useState<number>(30);

  // Toggle play/pause via spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Timer countdown using rAF
  useEffect(() => {
    let frameId: number;
    let lastTimestamp: number | null = null;
    const tick = (timestamp: number) => {
      if (!isPlaying) return;
      if (lastTimestamp !== null) {
        const delta = (timestamp - lastTimestamp) / 1000;
        setTimerRemaining(prev => {
          const next = Math.max(0, prev - delta);
          if (next === 0) setIsPlaying(false);
          return next;
        });
      }
      lastTimestamp = timestamp;
      frameId = requestAnimationFrame(tick);
    };
    if (isPlaying && timerRemaining > 0) {
      frameId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  // Reset remaining when duration changes
  useEffect(() => {
    if (!isPlaying) setTimerRemaining(timerDuration);
  }, [timerDuration, isPlaying]);

  // Animation refs and jitter logic
  const xRef = useRef<number>(size);
  const dirRef = useRef<number>(1);
  const jitterRef = useRef<number>(1);
  const targetJitterRef = useRef<number>(1);
  const jitterTimerRef = useRef<number>(0);
  const JITTER_INTERVAL = 0.5;

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      xRef.current = Math.max(size, Math.min(xRef.current, canvas.width - size));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [size]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let lastTime: number | null = null;
    let frameId: number;
    const render = (time: number) => {
      if (!isPlaying) return;
      if (lastTime !== null) {
        const delta = (time - lastTime) / 1000;
        if (inconsistent) {
          jitterTimerRef.current += delta;
          if (jitterTimerRef.current >= JITTER_INTERVAL) {
            jitterTimerRef.current = 0;
            targetJitterRef.current = 0.8 + Math.random() * 0.4;
          }
          jitterRef.current += (targetJitterRef.current - jitterRef.current) * delta * 2;
        } else {
          jitterRef.current = 1;
          targetJitterRef.current = 1;
          jitterTimerRef.current = 0;
        }
        const actualSpeed = speed * jitterRef.current;
        xRef.current += dirRef.current * actualSpeed * delta;
        const maxX = canvas.width - size;
        if (xRef.current > maxX || xRef.current < size) {
          dirRef.current *= -1;
          xRef.current = Math.max(size, Math.min(xRef.current, maxX));
        }
      }
      lastTime = time;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(xRef.current, canvas.height / 2, size, 0, Math.PI * 2);
      ctx.fillStyle = objectColor;
      ctx.fill();
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [speed, size, inconsistent, isPlaying, objectColor, bgColor]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: 20,
      fontFamily: 'Segoe UI, sans-serif',
      backgroundColor: '#F0F4F8',
      boxSizing: 'border-box'
    }}>
      {/* Canvas area */}
      <div style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: 20,
        overflow: 'hidden'
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      {/* Controls bar */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: 20,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 20
      }}>
        <button
          onClick={() => setIsPlaying(p => !p)}
          style={{ width: 80, padding: '8px 0', border: 'none', borderRadius: 4, backgroundColor: '#4A90E2', color: '#fff', cursor: 'pointer' }}
        >{isPlaying ? 'Pause' : 'Start'}</button>
        {/* Timer display */}
        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 500, color: '#555' }}>Remaining</label>
          <span style={{ fontSize: '1.25rem', color: '#333' }}>{Math.ceil(timerRemaining)}s</span>
        </div>
        {/* Duration setter */}
        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 500, color: '#555' }}>Duration (s)</label>
          <input
            type="number"
            min={1}
            value={timerDuration}
            disabled={isPlaying}
            onChange={e => setTimerDuration(Math.max(1, Number(e.target.value)))}
            style={{ width: 60, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        {/* Reset */}
        <button
          onClick={() => { setIsPlaying(false); setTimerRemaining(timerDuration); }}
          style={{ padding: '6px 12px', border: 'none', borderRadius: 4, backgroundColor: '#E94E77', color: '#fff', cursor: 'pointer' }}
        >Reset</button>
        {/* Speed */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 500, color: '#555' }}>Speed</label>
          <input
            type="range"
            min={10}
            max={500}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        {/* Size */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 500, color: '#555' }}>Size</label>
          <input
            type="range"
            min={5}
            max={100}
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        {/* Inconsistent */}
        <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#555' }}>
          <input
            type="checkbox"
            checked={inconsistent}
            onChange={e => setInconsistent(e.target.checked)}
            style={{ marginRight: 8 }}
          />Inconsistent
        </label>
        {/* Colors */}
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ marginBottom: 4, fontWeight: 500, color: '#555' }}>Object Color</span>
          <input type="color" value={objectColor} onChange={e => setObjectColor(e.target.value)} style={{ width: 40, height: 30, border: 'none' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ marginBottom: 4, fontWeight: 500, color: '#555' }}>Background Color</span>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 40, height: 30, border: 'none' }} />
        </label>
      </div>
    </div>
  );
};

export default App;
