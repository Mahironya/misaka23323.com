// A simple synth for sound effects without external assets
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

// Lazy init wrapper to be safe and handle browser policies
const getCtx = () => {
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    return audioCtx;
};

// Ensure the context is resumed before playing any sound to satisfy mobile autoplay rules
const withAudioContext = (callback: (ctx: AudioContext) => void) => {
    const ctx = getCtx();
    if (!ctx) return;

    const run = () => callback(ctx);

    if (ctx.state === 'suspended') {
        ctx.resume().then(run).catch(() => {
            // Ignore resume errors; user may need another gesture
        });
    } else {
        run();
    }
};

export const playPopSound = (pitchFactor: number = 1) => {
  withAudioContext((ctx) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    // Pentatonic-ish scale mapping for musicality
    // Base freq + steps. 
    const baseFreq = 300;
    const freq = baseFreq + (pitchFactor * 60); 

    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  });
};

export const playSquareSound = () => {
  withAudioContext((ctx) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  });
};

export const playClearSound = (isSquare: boolean) => {
  withAudioContext((ctx) => {
    const duration = isSquare ? 0.5 : 0.3;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Use a richer wave for squares
    oscillator.type = isSquare ? 'sawtooth' : 'sine';
    
    // Sweep up effect
    const startFreq = isSquare ? 200 : 400;
    const endFreq = isSquare ? 800 : 1000;

    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(isSquare ? 0.1 : 0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    // Filter to smooth out the sawtooth if used
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  });
};

export const playGameOverSound = () => {
    withAudioContext((ctx) => {
        const duration = 1.5;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    });
};

export const playClickSound = () => {
    withAudioContext((ctx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    });
};