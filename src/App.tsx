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
  const [currentSpeed, setCurrentSpeed] = useState<number>(speed);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // Audio setup for edge click
  const audioCtxRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }, []);

  const playClick = () => {
    if (!soundOn) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 600;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

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

  // Timer countdown
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
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
  const jitterIntervalRef = useRef<number>(1 + Math.random() * (2 - 1));
  const MIN_JITTER_INTERVAL = 1;
  const MAX_JITTER_INTERVAL = 2;

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

  // Animation loop (always drawing, updates motion only when playing)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let lastTime = performance.now();
    let frameId: number;

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;

      // Only update physics when playing
      if (isPlaying) {
        if (inconsistent) {
          jitterTimerRef.current += delta;
          if (jitterTimerRef.current >= jitterIntervalRef.current) {
            jitterTimerRef.current = 0;
            jitterIntervalRef.current = MIN_JITTER_INTERVAL + Math.random() * (MAX_JITTER_INTERVAL - MIN_JITTER_INTERVAL);
            targetJitterRef.current = 0.5 + Math.random() * 1.0;
          }
          jitterRef.current += (targetJitterRef.current - jitterRef.current) * delta * 1;
        } else {
          jitterRef.current = 1;
          targetJitterRef.current = 1;
          jitterTimerRef.current = 0;
        }

        const actualSpeed = speed * jitterRef.current;
        setCurrentSpeed(actualSpeed);
        xRef.current += dirRef.current * actualSpeed * delta;
        const maxX = canvas.width - size;
        if (xRef.current > maxX || xRef.current < size) {
          playClick();
          dirRef.current *= -1;
          xRef.current = Math.max(size, Math.min(xRef.current, maxX));
        }
      }

      // Always draw
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(xRef.current, canvas.height / 2, size, 0, Math.PI * 2);
      ctx.fillStyle = objectColor;
      ctx.fill();

      lastTime = time;
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [speed, size, inconsistent, isPlaying, objectColor, bgColor, soundOn]);

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
          <span style={{ fontSize: '1.25rem', color: '#333' }}>{timerRemaining}s</span>
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
        {/* Speed slider */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 500, color: '#555' }}>Speed</label>
          <input
            type="range"
            min={10}
            max={2000}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          {/* <div style={{ marginTop: 4, fontSize: '0.9rem', color: '#333' }}>
            Live: {currentSpeed.toFixed(1)} px/s
          </div> */}
        </div>
        {/* Size slider */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <label style={{ display: 'block', fontWeight: 500, color: '#555' }}>Size</label>
          <input
            type="range"
            min={5}
            max={200}
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        {/* Inconsistent toggle */}
        <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#555' }}>
          <input
            type="checkbox"
            checked={inconsistent}
            onChange={e => setInconsistent(e.target.checked)}
            style={{ marginRight: 8 }}
          />Inconsistent
        </label>
        {/* Sound toggle */}
        <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#555' }}>
          <input
            type="checkbox"
            checked={soundOn}
            onChange={e => setSoundOn(e.target.checked)}
            style={{ marginRight: 8 }}
          />Sound
        </label>
        {/* Color pickers */}
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
