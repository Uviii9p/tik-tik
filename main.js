/**
 * Zen Flow - Ultra-Premium Professional Engine
 * 30 Unique Satisfying Engines with 100+ Behavioral Variants
 */

class SoundManager {
    constructor() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.4;

            this.lpf = this.ctx.createBiquadFilter();
            this.lpf.type = 'lowpass';
            this.lpf.frequency.value = 20000;
            this.masterGain.connect(this.lpf);
            this.lpf.connect(this.ctx.destination);
        } catch (e) {
            console.warn('AudioContext not supported');
        }
        this.enabled = false;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        this.enabled = true;
    }

    playOsc(freq, decay, vol = 0.1) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + decay);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + decay);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + decay);
    }

    playTone(baseFreq = 200, factor = 1) {
        this.playOsc(baseFreq * factor, 0.3, 0.08);
    }

    playSoftClick() { this.playOsc(150, 0.1, 0.1); }
    playWaterDrop() { this.playOsc(Math.random() * 300 + 500, 0.4, 0.05); }
    playSwish(speedFactor = 1) {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000 * speedFactor, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    playAmbient() {
        if (!this.enabled || !this.ctx) return;
        const low = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        low.type = 'sine';
        low.frequency.value = 40;
        gain.gain.value = 0.005;
        low.connect(gain);
        gain.connect(this.masterGain);
        low.start();
    }

    playHaptic() {
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(5);
    }
}

class ZenFlow {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.container = document.getElementById('game-canvas-container');
        this.sandCanvas = document.createElement('canvas');
        this.sandCtx = this.sandCanvas.getContext('2d');

        this.games = this.generateGames();
        this.currentGame = this.games[0];
        this.mode = this.currentGame.engine;
        this.params = this.currentGame.params || {};

        this.particles = [];
        this.ripples = [];
        this.entities = [];
        this.mouse = { x: 0, y: 0, active: false };
        this.lastMouse = { x: 0, y: 0 };
        this.theme = 'dark';
        this.sound = new SoundManager();

        this.initCursor();
        this.updateActiveInfo();
        this.initPWA();

        // Initialize with a small delay to ensure CSS/DOM is ready for measurements
        setTimeout(() => {
            this.resize();
            this.initLibrary();
            this.initEventListeners();
            this.initJuice();
            this.initCursor();
            this.updateActiveInfo();
            this.engines = this.getEngineLogic();
            this.loop();
        }, 100);
    }

    initCursor() {
        this.cursorGlow = document.createElement('div');
        this.cursorGlow.className = 'ui-cursor-glow';
        document.body.appendChild(this.cursorGlow);
        window.addEventListener('mousemove', (e) => {
            this.cursorGlow.style.left = e.clientX + 'px';
            this.cursorGlow.style.top = e.clientY + 'px';
        });
    }

    initJuice() {
        // Only enable 3D juice on hover-capable devices (PCs)
        if (window.matchMedia('(hover: hover)').matches) {
            this.container.addEventListener('mousemove', (e) => {
                const rect = this.container.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                this.container.style.transform = `scale(1.02) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
            });
            this.container.addEventListener('mouseleave', () => {
                this.container.style.transform = `scale(1) rotateY(0deg) rotateX(0deg)`;
            });
        }
    }

    generateGames() {
        const engines = [
            { id: 'sand', icon: '🏜️', name: 'Sand' },
            { id: 'fluid', icon: '✨', name: 'Light' },
            { id: 'jelly', icon: '🍮', name: 'Jelly' },
            { id: 'mandala', icon: '🕸️', name: 'Mirror' },
            { id: 'nebula', icon: '🌌', name: 'Nebula' },
            { id: 'grass', icon: '🎋', name: 'Flow' },
            { id: 'magnet', icon: '🧲', name: 'Core' },
            { id: 'clouds', icon: '☁️', name: 'Vapor' },
            { id: 'growth', icon: '💎', name: 'Crystal' },
            { id: 'breath', icon: '🌬️', name: 'Focus' },
            { id: 'pulse', icon: '💓', name: 'Pulse' },
            { id: 'vortex', icon: '🌀', name: 'Vortex' },
            { id: 'sparkle', icon: '⚡', name: 'Spark' },
            { id: 'bubbles', icon: '🧼', name: 'Bubbles' },
            { id: 'fireworks', icon: '🎆', name: 'Firework' },
            { id: 'snow', icon: '❄️', name: 'Snow' },
            { id: 'snake', icon: '🐍', name: 'Snake' },
            { id: 'bokeh', icon: '🏮', name: 'Bokeh' },
            { id: 'gravity', icon: '🌑', name: 'Gravity' },
            { id: 'lava', icon: '🌋', name: 'Lava' },
            { id: 'stars', icon: '⭐', name: 'Stars' },
            { id: 'waves', icon: '🌊', name: 'Waves' },
            { id: 'pixel', icon: '👾', name: 'Pixel' },
            { id: 'electric', icon: '🔌', name: 'Volt' },
            { id: 'aurora', icon: '🌈', name: 'Aurora' },
            { id: 'bloom', icon: '🌸', name: 'Bloom' },
            { id: 'echo', icon: '👻', name: 'Ghost' },
            { id: 'fractal', icon: '📐', name: 'Geo' },
            { id: 'portal', icon: '🌀', name: 'Portal' }
        ];

        const adjectives = ['Deep', 'Slow', 'Fast', 'Neon', 'Soft', 'Dark', 'Golden', 'Ice', 'Fire', 'Void', 'Eco', 'Pure', 'Dream', 'Quiet', 'Loud', 'Zen', 'Aura', 'Silk', 'Velvet', 'Glitch', 'Cosmic', 'Lunar', 'Solar', 'Atomic', 'Prism', 'Cyber', 'Urban', 'Wild', 'Misty', 'Royal', 'Ethereal', 'Crystal', 'Shadow', 'Blaze', 'Frost', 'Nova', 'Pulse', 'Hyper', 'Flow'];
        const iconPool = ['🏜️', '✨', '🍮', '💧', '🕸️', '🌌', '🎋', '🧲', '☁️', '💎', '🌬️', '💓', '🌀', '⚡', '🧼', '🎆', '❄️', '🐍', '🏮', '🌑', '🌋', '⭐', '🌊', '👾', '🔌', '🌈', '🌸', '👻', '📐', '🛸', '🔮', '🧿', '☄️', '🪐', '🍄', '🐚', '🦜', '🦋', '🍀', '🍂', '🌻', '🌙', '☀️', '🌋', '🏖️', '🏝️', '🌍', '🧨', '🧩', '🎨', '🎭', '🧵', '🧶', '🧴', '🕯️', '🎐', '🎀', '🎈', '🎏', '💎', '💍', '🗝️', '🛡️', '⚔️', '🍯', '🥃', '🍹', '🍬', '🍩', '🍎', '🍓', '🍋', '🌵', '🌴', '🎍', '🍁', '🪵', '🪴', '🦎', '🐲', '🐳', '🐬', '🐾', '🕊️', '🦢', '🦚', '🐉', '🐙', '🚀', '🔭', '⛅', '⛈️', '🔥', '🌟', '🍭'];
        const games = [];

        for (let i = 0; i < 100; i++) {
            const eng = engines[i % engines.length];
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const variantType = i % 4;

            games.push({
                id: `game-${i}`,
                name: i < engines.length ? `Original ${eng.name}` : `${adj} ${eng.name}`,
                icon: iconPool[i % iconPool.length],
                engine: eng.id,
                params: {
                    color: this.getRandomColor(),
                    secondaryColor: this.getRandomColor(),
                    speed: 0.1 + Math.random() * 3.0,
                    size: 0.2 + Math.random() * 2.5,
                    gravityStrength: Math.random() * 0.8,
                    friction: 0.85 + Math.random() * 0.12,
                    quantity: 4 + Math.floor(Math.random() * 40),
                    variant: variantType,
                    elasticity: Math.random() * 0.9,
                    glow: true
                }
            });
        }
        return games;
    }

    getRandomColor() {
        const colors = [
            '#818cf8', '#c084fc', '#fb7185', '#38bdf8', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa',
            '#2dd4bf', '#fb923c', '#f87171', '#60a5fa', '#a3e635', '#fde047', '#5eead4', '#fda4af',
            '#ffffff', '#fdfcf0', '#00bcd4', '#9c27b0', '#22d3ee'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getEngineLogic() {
        return {
            sand: () => this.updateSand(),
            mandala: () => this.updateMandala(),
            jelly: () => this.updateJelly(),
            fluid: () => this.updateFluid(),
            nebula: () => this.updateNebula(),
            grass: () => this.updateGrass(),
            magnet: () => this.updateMagnet(),
            clouds: () => this.updateClouds(),
            vortex: () => this.updateVortex(),
            snake: () => this.updateSnake(),
            gravity: () => this.updateGravity(),
            snow: () => this.updateSnow(),
            fireworks: () => this.updateFireworks(),
            bubbles: () => this.updateBubbles(),
            growth: () => this.updateGrowth(),
            breath: () => this.updateBreath(),
            pulse: () => this.updatePulse(),
            bokeh: () => this.updateBokeh(),
            lava: () => this.updateLava(),
            stars: () => this.updateStars(),
            waves: () => this.updateWaves(),
            pixel: () => this.updatePixel(),
            electric: () => this.updateElectric(),
            aurora: () => this.updateAurora(),
            bloom: () => this.updateBloom(),
            fractal: () => this.updateFractal(),
            portal: () => this.updatePortal(),
            echo: () => this.updateEcho(),
            sparkle: () => this.updateSpark()
        };
    }

    initLibrary() {
        const grid = document.getElementById('game-grid');
        const search = document.getElementById('game-search');
        const renderGrid = (filter = '') => {
            grid.innerHTML = '';
            const filtered = this.games.filter(g => g.name.toLowerCase().includes(filter.toLowerCase()));
            filtered.forEach(game => {
                const card = document.createElement('div');
                card.className = 'game-card';
                card.innerHTML = `<span class="game-card-icon">${game.icon}</span><span class="game-card-name">${game.name}</span>`;
                card.onclick = () => {
                    this.selectGame(game);
                    document.getElementById('library-overlay').classList.add('hidden');
                    this.addBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
                };
                grid.appendChild(card);
            });
        };
        search.oninput = (e) => renderGrid(e.target.value);
        renderGrid();
        document.getElementById('btn-library').onclick = () => {
            document.getElementById('library-overlay').classList.remove('hidden');
            search.focus();
            this.sound.playTone(400, 1.5);
        };
        document.getElementById('close-library').onclick = () => {
            document.getElementById('library-overlay').classList.add('hidden');
            this.sound.playSoftClick();
        };
    }

    selectGame(game) {
        this.container.style.opacity = '0.3';
        this.container.style.transform = 'scale(0.98)';

        setTimeout(() => {
            this.currentGame = game;
            this.mode = game.engine;
            this.params = game.params;
            this.resetActivity();
            this.updateActiveInfo();
            this.sound.playSoftClick();
            this.sound.playHaptic();

            this.container.style.opacity = '1';
            this.container.style.transform = 'scale(1)';
        }, 150);
    }

    updateActiveInfo() {
        document.getElementById('current-game-icon').textContent = this.currentGame.icon;
        document.getElementById('current-game-name').textContent = this.currentGame.name;
    }

    initEventListeners() {
        const splash = document.getElementById('splash-screen');
        const startBtn = document.getElementById('start-btn');

        startBtn.onclick = () => {
            splash.classList.add('hidden');
            this.sound.resume();
            this.sound.playSoftClick();
            this.sound.playAmbient();
            // Force a resize after splash is gone to ensure dimensions are perfect
            this.resize();
        };

        const interactionLayer = document.getElementById('interaction-overlay');

        const handlePointerDown = (e) => {
            this.mouse.active = true;
            const pos = this.getPos(e);
            this.mouse.x = this.lastMouse.x = pos.x;
            this.mouse.y = this.lastMouse.y = pos.y;
            this.triggerActivityStart(pos);
            this.sound.playHaptic();
        };

        const handlePointerMove = (e) => {
            const pos = this.getPos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
        };

        const handlePointerUp = () => {
            this.mouse.active = false;
        };

        // Use Pointer Events for universal support (Mouse, Touch, Pen)
        interactionLayer.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        window.addEventListener('resize', () => this.resize());

        document.getElementById('btn-settings').onclick = () => document.getElementById('settings-menu').classList.remove('hidden');
        document.getElementById('btn-restart').onclick = () => { this.resetActivity(); this.sound.playSoftClick(); };
        document.getElementById('close-settings').onclick = () => document.getElementById('settings-menu').classList.add('hidden');
        document.getElementById('dark-mode-toggle').onchange = (e) => {
            this.theme = e.target.checked ? 'dark' : 'light';
            document.body.setAttribute('data-theme', this.theme);
        };
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    resetActivity() {
        this.particles = []; this.ripples = []; this.entities = [];
        const clear = (c, ctx) => {
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.restore();
        };
        clear(this.sandCanvas, this.sandCtx);
        clear(this.canvas, this.ctx);

        if (this.mode === 'grass') this.initGrass();
        if (this.mode === 'magnet') this.initMagnet();
        if (this.mode === 'clouds') this.initClouds();
        if (this.mode === 'bokeh') this.initBokeh();
        if (this.mode === 'gravity') this.initGravity();
        if (this.mode === 'lava') this.initLava();
        if (this.mode === 'stars') this.initStars();
        if (this.mode === 'waves') this.initWaves();
        if (this.mode === 'pixel') this.initPixel();
        if (this.mode === 'electric') this.initElectric();
        if (this.mode === 'aurora') this.initAurora();
        if (this.mode === 'bloom') this.initBloom();
        if (this.mode === 'fractal') this.initFractal();
        if (this.mode === 'portal') this.initPortal();
    }

    triggerActivityStart(pos) {
        const color = this.params.color || '#818cf8';
        if (this.mode === 'sand') this.addParticles(pos.x, pos.y, 10 * (this.params.size || 1), color);
        if (this.mode === 'fluid') this.addBurst(pos.x, pos.y, this.params.quantity);
        if (this.mode === 'growth') this.addCrystal(pos.x, pos.y);
        if (this.mode === 'fireworks') this.addFirework(pos.x, pos.y);
        if (this.mode === 'bubbles') this.addBubbles(pos.x, pos.y);
    }

    updateSand() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.mouse.active) {
            this.sandCtx.beginPath();
            this.sandCtx.moveTo(this.lastMouse.x, this.lastMouse.y);
            this.sandCtx.lineTo(this.mouse.x, this.mouse.y);
            this.sandCtx.strokeStyle = this.theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
            this.sandCtx.lineWidth = 25 * (this.params.size || 1);
            this.sandCtx.lineCap = 'round';
            this.sandCtx.stroke();
            if (Math.random() > 0.8) {
                this.addParticles(this.mouse.x, this.mouse.y, 4, this.params.color, this.params.gravityStrength > 0.3);
                this.sound.playSwish(this.params.speed);
            }
        }
        this.ctx.drawImage(this.sandCanvas, 0, 0, this.width, this.height);
        this.lastMouse.x = this.mouse.x; this.lastMouse.y = this.mouse.y;
        this.updateParticles();
    }

    updateMandala() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.mouse.active) {
            const axes = this.params.variant === 2 ? 12 : 8;
            const cx = this.width / 2, cy = this.height / 2;
            for (let i = 0; i < axes; i++) {
                this.sandCtx.save();
                this.sandCtx.translate(cx, cy);
                this.sandCtx.rotate((Math.PI * 2 / axes) * i);
                this.sandCtx.beginPath();
                this.sandCtx.moveTo(this.lastMouse.x - cx, this.lastMouse.y - cy);
                this.sandCtx.lineTo(this.mouse.x - cx, this.mouse.y - cy);
                this.sandCtx.strokeStyle = this.params.color;
                this.sandCtx.lineWidth = 1 + (this.params.size || 1);
                this.sandCtx.stroke();
                this.sandCtx.restore();
            }
        }
        this.ctx.drawImage(this.sandCanvas, 0, 0, this.width, this.height);
        this.lastMouse.x = this.mouse.x; this.lastMouse.y = this.mouse.y;
    }

    updateJelly() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const time = Date.now() * 0.002 * (this.params.speed || 1);
        const cx = this.width / 2, cy = this.height / 2;
        this.ctx.save();
        this.ctx.translate(cx + Math.sin(time) * (50 * this.params.size), cy + Math.cos(time * 0.6) * (30 * this.params.size));
        this.ctx.beginPath();
        const w = 150 * (this.params.size || 1), h = 200 * (this.params.size || 1);
        this.drawRoundRect(this.ctx, -w / 2, -h / 2, w, h, 40);
        this.ctx.fillStyle = this.params.color; this.ctx.globalAlpha = 0.6; this.ctx.fill();
        this.ctx.restore();
        if (this.mouse.active && Math.hypot(this.mouse.x - cx, this.mouse.y - cy) < 150) {
            if (Math.random() > 0.7) this.addParticles(this.mouse.x, this.mouse.y, 4, this.params.color, true);
        }
        this.updateParticles(true);
    }

    updateFluid() {
        this.ctx.fillStyle = `rgba(8,10,15,${0.1 + (0.2 * this.params.friction)})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        if (!this.mouse.active && Math.random() > 0.95) {
            this.addParticles(this.width / 2 + (Math.random() - 0.5) * 100, this.height / 2 + (Math.random() - 0.5) * 100, 2, this.params.color, false, true);
        }
        if (this.mouse.active) {
            this.addParticles(this.mouse.x, this.mouse.y, 8, this.params.color, false, true);
        }
        this.updateParticles();
    }

    updateNebula() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (Math.random() > 0.97) {
            const tx = this.width / 2 + Math.sin(Date.now() * 0.001) * 200;
            const ty = this.height / 2 + Math.cos(Date.now() * 0.001) * 200;
            this.particles.push({
                x: tx, y: ty, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                size: (Math.random() * 60 + 30) * this.params.size, color: this.params.secondaryColor,
                life: 1, decay: 0.003, nebula: true
            });
        }
        if (this.mouse.active) {
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.particles.push({
                    x: this.mouse.x, y: this.mouse.y,
                    vx: Math.cos(angle) * (2 * this.params.speed), vy: Math.sin(angle) * (2 * this.params.speed),
                    size: (Math.random() * 40 + 20) * this.params.size, color: this.params.color,
                    life: 1, decay: 0.005, nebula: true
                });
            }
        }
        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.life -= p.decay;
            const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, p.color); grad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = grad; this.ctx.globalAlpha = p.life * 0.4;
            this.ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    initGrass() {
        const step = 30 / (this.params.size || 1);
        for (let i = 0; i < this.width + step; i += step) {
            this.entities.push({ x: i, h: (100 + Math.random() * 200) * (this.params.size || 1), targetX: i, curX: i });
        }
    }

    updateGrass() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(g => {
            const dx = this.mouse.x - g.curX;
            if (this.mouse.active && Math.abs(dx) < 150) g.targetX = g.x + dx * 0.8;
            else g.targetX = g.x + Math.sin(Date.now() * 0.001 + g.x) * 10;
            g.curX += (g.targetX - g.curX) * (0.05 * this.params.speed);
            this.ctx.beginPath(); this.ctx.moveTo(g.x, this.height);
            this.ctx.quadraticCurveTo(g.curX, this.height - g.h / 2, g.curX, this.height - g.h);
            this.ctx.strokeStyle = this.params.color; this.ctx.lineWidth = 3 * (this.params.size || 1); this.ctx.lineCap = 'round'; this.ctx.stroke();
        });
    }

    initMagnet() {
        const count = this.params.quantity * 5;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.width, y = Math.random() * this.height;
            this.entities.push({ x, y, ox: x, oy: y, color: Math.random() > 0.5 ? this.params.color : this.params.secondaryColor });
        }
    }

    updateMagnet() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(p => {
            const d = Math.hypot(this.mouse.x - p.x, this.mouse.y - p.y);
            const range = 200 * (this.params.size || 1);
            if (this.mouse.active && d < range) {
                const ang = Math.atan2(this.mouse.y - p.y, this.mouse.x - p.x);
                p.x += Math.cos(ang) * 6 * this.params.speed; p.y += Math.sin(ang) * 6 * this.params.speed;
            } else { p.x += (p.ox - p.x) * 0.05; p.y += (p.oy - p.y) * 0.05; }
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 4 * (this.params.size || 1), 0, Math.PI * 2);
            this.ctx.fillStyle = p.color; this.ctx.fill();
        });
    }

    initClouds() {
        for (let i = 0; i < 8; i++) {
            this.entities.push({ x: Math.random() * this.width, y: Math.random() * this.height, r: (60 + Math.random() * 100) * (this.params.size || 1), phase: Math.random() * 10 });
        }
    }

    updateClouds() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(c => {
            const d = Math.hypot(this.mouse.x - c.x, this.mouse.y - c.y);
            if (this.mouse.active && d < c.r) { c.x += (this.mouse.x - c.x) * 0.05; c.y += (this.mouse.y - c.y) * 0.05; }
            else { c.x += Math.sin(Date.now() * 0.001 * this.params.speed + c.phase) * 1; }
            this.ctx.beginPath(); this.ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
            this.ctx.fill();
        });
    }

    updateVortex() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const cx = this.mouse.active ? this.mouse.x : this.width / 2 + Math.sin(Date.now() * 0.001) * 50;
        const cy = this.mouse.active ? this.mouse.y : this.height / 2 + Math.cos(Date.now() * 0.001) * 50;

        if (this.mouse.active || Math.random() > 0.9) {
            for (let i = 0; i < 3; i++) {
                const r = (50 + Math.random() * 150) * (this.params.size || 1);
                this.particles.push({
                    cx, cy, angle: Math.random() * 6, r,
                    speed: (0.02 + Math.random() * 0.04) * this.params.speed,
                    size: (2 + Math.random() * 4) * this.params.size, color: this.params.color, life: 1, vortex: true
                });
            }
        }
        this.particles.forEach(p => {
            if (p.vortex) {
                p.angle += p.speed; p.r *= 0.985;
                const x = p.cx + Math.cos(p.angle) * p.r; const y = p.cy + Math.sin(p.angle) * p.r;
                this.ctx.beginPath(); this.ctx.arc(x, y, p.size * p.life, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color; this.ctx.fill();
                if (p.r < 5) p.life = 0;
            }
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    updateSnake() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const len = 10 + Math.floor(this.params.quantity);
        if (this.entities.length === 0) { for (let i = 0; i < len; i++) this.entities.push({ x: this.width / 2, y: this.height / 2 }); }
        if (this.mouse.active) { this.entities[0].x += (this.mouse.x - this.entities[0].x) * 0.2; this.entities[0].y += (this.mouse.y - this.entities[0].y) * 0.2; }
        for (let i = 1; i < this.entities.length; i++) {
            this.entities[i].x += (this.entities[i - 1].x - this.entities[i].x) * (0.2 * this.params.speed);
            this.entities[i].y += (this.entities[i - 1].y - this.entities[i].y) * (0.2 * this.params.speed);
        }
        this.ctx.beginPath(); this.ctx.moveTo(this.entities[0].x, this.entities[0].y);
        for (let i = 1; i < this.entities.length; i++) this.ctx.lineTo(this.entities[i].x, this.entities[i].y);
        this.ctx.strokeStyle = this.params.color; this.ctx.lineWidth = 15 * this.params.size;
        this.ctx.lineCap = 'round'; this.ctx.stroke();
    }

    initGravity() {
        for (let i = 0; i < 80; i++) {
            this.entities.push({ x: Math.random() * this.width, y: Math.random() * this.height, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 });
        }
    }

    updateGravity() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(p => {
            if (this.mouse.active) {
                const dx = this.mouse.x - p.x; const dy = this.mouse.y - p.y; const d = Math.hypot(dx, dy);
                const force = Math.min(3, 800 / (d + 1));
                p.vx += (dx / d) * force * this.params.speed; p.vy += (dy / d) * force * this.params.speed;
            }
            p.x += p.vx; p.y += p.vy; p.vx *= this.params.friction; p.vy *= this.params.friction;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 3 * this.params.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.params.color; this.ctx.fill();
        });
    }

    updateSnow() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (Math.random() > (0.9 - 0.2 * this.params.speed)) {
            this.entities.push({ x: Math.random() * this.width, y: -20, vx: (Math.random() - 0.5) * 2, vy: (1 + Math.random() * 2) * this.params.speed, s: (2 + Math.random() * 4) * this.params.size });
        }
        this.entities.forEach(s => {
            s.x += s.vx + Math.sin(Date.now() * 0.002) * 0.5; s.y += s.vy;
            if (this.mouse.active && Math.hypot(this.mouse.x - s.x, this.mouse.y - s.y) < 100) { s.vx += (s.x - this.mouse.x) * 0.01; }
            this.ctx.beginPath(); this.ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255,255,255,0.8)'; this.ctx.fill();
        });
        this.entities = this.entities.filter(s => s.y < this.height + 20);
    }

    updateGrowth() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.mouse.active && Math.random() > 0.9) {
            this.addParticles(this.mouse.x, this.mouse.y, 1, this.params.color, true, true);
        }
        this.ctx.drawImage(this.sandCanvas, 0, 0, this.width, this.height);
        this.updateParticles(true);
    }

    updateBreath() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const cycle = Math.sin(Date.now() * 0.001 * this.params.speed) * 0.5 + 0.5;
        const targetX = this.mouse.active ? this.mouse.x : this.width / 2;
        const targetY = this.mouse.active ? this.mouse.y : this.height / 2;
        const r = (100 + 100 * cycle) * this.params.size;
        const grad = this.ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, r);
        grad.addColorStop(0, this.params.color);
        grad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = grad;
        this.ctx.globalAlpha = 0.3 * cycle;
        this.ctx.beginPath();
        this.ctx.arc(targetX, targetY, r, 0, Math.PI * 2);
        this.ctx.fill();
    }

    updatePulse() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const time = Date.now() * 0.001 * this.params.speed;
        const cx = this.mouse.active ? this.mouse.x : this.width / 2;
        const cy = this.mouse.active ? this.mouse.y : this.height / 2;
        for (let i = 0; i < 5; i++) {
            const r = ((time + i * 0.2) % 1) * 300 * this.params.size;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.strokeStyle = i % 2 === 0 ? this.params.color : this.params.secondaryColor;
            this.ctx.lineWidth = 10 * (1 - r / (300 * this.params.size));
            this.ctx.globalAlpha = 1 - r / (300 * this.params.size);
            this.ctx.stroke();
        }
    }

    initBokeh() {
        for (let i = 0; i < 30; i++) {
            this.entities.push({
                x: Math.random() * this.width, y: Math.random() * this.height,
                r: (20 + Math.random() * 60) * this.params.size,
                vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                color: Math.random() > 0.5 ? this.params.color : this.params.secondaryColor
            });
        }
    }

    updateBokeh() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(b => {
            b.x += b.vx * this.params.speed; b.y += b.vy * this.params.speed;
            if (b.x < -b.r) b.x = this.width + b.r; if (b.x > this.width + b.r) b.x = -b.r;
            if (b.y < -b.r) b.y = this.height + b.r; if (b.y > this.height + b.r) b.y = -b.r;
            this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fillStyle = b.color; this.ctx.globalAlpha = 0.2;
            this.ctx.fill();
        });
    }

    initLava() {
        for (let i = 0; i < 15; i++) {
            this.entities.push({
                x: Math.random() * this.width, y: Math.random() * this.height,
                r: (40 + Math.random() * 80) * this.params.size,
                vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8
            });
        }
    }

    updateLava() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.filter = 'blur(40px) contrast(150%)';
        this.entities.forEach(b => {
            b.x += b.vx * this.params.speed; b.y += b.vy * this.params.speed;
            if (b.x < 0 || b.x > this.width) b.vx *= -1;
            if (b.y < 0 || b.y > this.height) b.vy *= -1;
            this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fillStyle = this.params.color;
            this.ctx.fill();
        });
        this.ctx.filter = 'none';
        if (this.mouse.active) {
            this.addParticles(this.mouse.x, this.mouse.y, 2, this.params.secondaryColor, true);
        }
        this.updateParticles();
    }

    initStars() {
        for (let i = 0; i < 200; i++) {
            this.entities.push({ x: Math.random() * this.width, y: Math.random() * this.height, s: Math.random() * 2, z: Math.random() * 2 + 1 });
        }
    }

    updateStars() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const mx = (this.mouse.x - this.width / 2) * 0.05;
        const my = (this.mouse.y - this.height / 2) * 0.05;
        this.entities.forEach(s => {
            const x = (s.x + mx * s.z + this.width) % this.width;
            const y = (s.y + my * s.z + this.height) % this.height;
            this.ctx.beginPath(); this.ctx.arc(x, y, s.s * this.params.size, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.globalAlpha = 0.5 + Math.random() * 0.5;
            this.ctx.fill();
        });
    }

    initWaves() {
        this.entities = [0, 0, 0];
    }

    updateWaves() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const time = Date.now() * 0.002 * this.params.speed;
        const mouseOffset = this.mouse.active ? (this.mouse.y - this.height / 2) * 0.1 : 0;
        for (let j = 0; j < 3; j++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);
            for (let i = 0; i <= this.width; i += 20) {
                const distToMouse = Math.abs(i - this.mouse.x);
                const influence = (this.mouse.active && distToMouse < 200) ? (1 - distToMouse / 200) * 50 : 0;
                const y = this.height / 2 + mouseOffset + influence + Math.sin(i * 0.01 + time + j) * 50 * this.params.size;
                this.ctx.lineTo(i, y);
            }
            this.ctx.lineTo(this.width, this.height);
            this.ctx.fillStyle = j === 0 ? this.params.color : this.params.secondaryColor;
            this.ctx.globalAlpha = 0.4 - j * 0.1;
            this.ctx.fill();
        }
    }

    initPixel() {
        this.sandCtx.clearRect(0, 0, this.width, this.height);
    }

    updatePixel() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.mouse.active) {
            const size = 20 * this.params.size;
            const px = Math.floor(this.mouse.x / size) * size;
            const py = Math.floor(this.mouse.y / size) * size;
            this.sandCtx.fillStyle = this.params.color;
            this.sandCtx.fillRect(px, py, size, size);
        }
        this.ctx.drawImage(this.sandCanvas, 0, 0, this.width, this.height);
    }

    initElectric() { this.entities = []; }
    updateElectric() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.mouse.active || Math.random() > 0.9) {
            this.ctx.beginPath();
            const tx = this.mouse.active ? this.mouse.x : this.width / 2 + (Math.random() - 0.5) * 100;
            const ty = this.mouse.active ? this.mouse.y : this.height / 2 + (Math.random() - 0.5) * 100;

            this.ctx.moveTo(this.width / 2, this.height / 2);
            let cx = this.width / 2, cy = this.height / 2;
            for (let i = 0; i < 10; i++) {
                cx += (tx - cx) * 0.2 + (Math.random() - 0.5) * 50;
                cy += (ty - cy) * 0.2 + (Math.random() - 0.5) * 50;
                this.ctx.lineTo(cx, cy);
            }
            this.ctx.strokeStyle = this.params.color;
            this.ctx.lineWidth = 2 * this.params.size;
            this.ctx.shadowBlur = 10; this.ctx.shadowColor = this.params.color;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    }

    initAurora() { this.entities = []; }
    updateAurora() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const time = Date.now() * 0.001 * this.params.speed;
        const mx = this.mouse.active ? (this.mouse.x / this.width) * 100 : 0;
        const grad = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        grad.addColorStop(0, this.params.color);
        grad.addColorStop(0.5, this.params.secondaryColor);
        grad.addColorStop(1, this.params.color);
        this.ctx.fillStyle = grad;
        this.ctx.globalAlpha = 0.3;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);
            for (let x = 0; x <= this.width; x += 50) {
                const influence = this.mouse.active ? Math.sin((x + mx) * 0.01) * 50 : 0;
                const y = this.height * 0.3 + influence + Math.sin(x * 0.005 + time + i) * 100;
                this.ctx.lineTo(x, y);
            }
            this.ctx.lineTo(this.width, this.height);
            this.ctx.fill();
        }
    }

    initBloom() { this.entities = []; }
    updateBloom() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.mouse.active && Math.random() > 0.8) {
            this.particles.push({ x: this.mouse.x, y: this.mouse.y, size: 5, color: this.params.color, life: 1, bloom: true });
        }
        this.particles.forEach(p => {
            if (p.bloom) {
                p.size += 0.5 * this.params.speed; p.life -= 0.01;
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const ang = (Math.PI * 2 / 6) * i;
                    const x = p.x + Math.cos(ang) * p.size;
                    const y = p.y + Math.sin(ang) * p.size;
                    if (i === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = p.color; this.ctx.globalAlpha = p.life;
                this.ctx.fill();
            }
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    initFractal() { this.entities = []; }
    updateFractal() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const drawBranch = (x, y, len, angle, depth) => {
            if (depth === 0) return;
            const x2 = x + Math.cos(angle) * len;
            const y2 = y + Math.sin(angle) * len;
            this.ctx.beginPath(); this.ctx.moveTo(x, y); this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = this.params.color; this.ctx.lineWidth = depth * this.params.size;
            this.ctx.stroke();
            const newLen = len * 0.7;
            const mouseInfluence = this.mouse.active ? (this.mouse.x - this.width / 2) * 0.001 : 0;
            const offset = Math.sin(Date.now() * 0.001 * this.params.speed) * 0.3 + mouseInfluence;
            drawBranch(x2, y2, newLen, angle - 0.4 + offset, depth - 1);
            drawBranch(x2, y2, newLen, angle + 0.4 + offset, depth - 1);
        };
        const rootX = this.mouse.active ? this.mouse.x : this.width / 2;
        drawBranch(rootX, this.height, 100 * this.params.size, -Math.PI / 2, 8);
    }

    initPortal() { this.entities = []; }
    updatePortal() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const time = Date.now() * 0.005 * this.params.speed;
        const cx = this.mouse.active ? this.mouse.x : this.width / 2;
        const cy = this.mouse.active ? this.mouse.y : this.height / 2;
        for (let i = 0; i < 50; i++) {
            const ang = i * 0.2 + time;
            const r = (50 + i * 5 * this.params.size) * (this.mouse.active ? 1.2 : 1);
            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;
            this.ctx.beginPath(); this.ctx.arc(x, y, 2 * this.params.size, 0, Math.PI * 2);
            this.ctx.fillStyle = i % 2 === 0 ? this.params.color : this.params.secondaryColor;
            this.ctx.fill();
        }
    }

    updateEcho() {
        this.ctx.fillStyle = 'rgba(8,10,15,0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        if (this.mouse.active) {
            this.ctx.beginPath(); this.ctx.arc(this.mouse.x, this.mouse.y, 10 * this.params.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.params.color; this.ctx.fill();
        }
    }

    updateSpark() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const cx = this.mouse.active ? this.mouse.x : this.width / 2;
        const cy = this.mouse.active ? this.mouse.y : this.height / 2;
        const count = this.mouse.active ? 12 : 3;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const len = (Math.random() * 50 + (this.mouse.active ? 30 : 10)) * this.params.size;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
            this.ctx.strokeStyle = i % 2 === 0 ? this.params.color : (this.params.secondaryColor || '#fff');
            this.ctx.lineWidth = this.mouse.active ? 2 : 1;
            this.ctx.globalAlpha = this.mouse.active ? 1 : 0.3;
            this.ctx.stroke();
        }
    }

    addBurst(x, y, count) {
        for (let i = 0; i < count; i++) {
            const ang = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
                size: Math.random() * 4 + 2, color: this.params.color,
                life: 1, decay: 0.02
            });
        }
    }
    addCrystal(x, y) {
        this.sandCtx.save();
        this.sandCtx.translate(x, y);
        this.sandCtx.rotate(Math.random() * Math.PI * 2);
        this.sandCtx.fillStyle = this.params.color;
        this.sandCtx.beginPath();
        this.sandCtx.moveTo(0, -20 * this.params.size);
        this.sandCtx.lineTo(10 * this.params.size, 0);
        this.sandCtx.lineTo(0, 20 * this.params.size);
        this.sandCtx.lineTo(-10 * this.params.size, 0);
        this.sandCtx.closePath();
        this.sandCtx.globalAlpha = 0.6;
        this.sandCtx.fill();
        this.sandCtx.restore();
    }
    addParticles(x, y, count, color, gravity = false, glow = false) {
        const limit = window.matchMedia('(max-width: 600px)').matches ? 200 : 800;
        if (this.particles.length > limit) return;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                size: (Math.random() * 5 + 3) * (this.params.size || 1),
                color, life: 1, decay: 0.01 + Math.random() * 0.02, gravity, glow
            });
        }
    }
    addRipple(x, y) { this.ripples.push({ x, y, r: 0, life: 1 }); this.sound.playWaterDrop(); }
    addFirework(x, y) {
        for (let i = 0; i < this.params.quantity * 2; i++) {
            const angle = Math.random() * Math.PI * 2, speed = Math.random() * 8 + 2;
            this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: Math.random() * 3 + 1, color: Math.random() > 0.5 ? this.params.color : this.params.secondaryColor, life: 1, decay: 0.02, gravity: true, firework: true });
        }
        this.sound.playSwish(2);
    }
    addBubbles(x, y) {
        for (let i = 0; i < 5; i++) { this.entities.push({ x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40, r: (8 + Math.random() * 15) * this.params.size, vy: -Math.random() * 2 - 1, vx: (Math.random() - 0.5), color: this.params.color }); }
    }
    updateBubbles() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(b => {
            b.y += b.vy * this.params.speed; b.x += b.vx; b.vx += Math.sin(Date.now() * 0.01) * 0.1;
            this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.strokeStyle = b.color; this.ctx.lineWidth = 2; this.ctx.globalAlpha = 0.5; this.ctx.stroke();
            this.ctx.fillStyle = b.color; this.ctx.globalAlpha = 0.1; this.ctx.fill();
        });
        this.entities = this.entities.filter(b => b.y + b.r > 0);
    }
    updateFireworks() {
        this.ctx.fillStyle = 'rgba(8,10,15,0.2)';
        this.ctx.fillRect(0, 0, this.width, this.height); this.updateParticles(true);
    }
    updateParticles(gravity = false) {
        this.particles.forEach(p => {
            if (p.vortex) return; p.x += p.vx; p.y += p.vy; if (gravity || p.gravity) p.vy += 0.3; p.life -= p.decay;
            if (p.life > 0) {
                this.ctx.save();
                this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color; this.ctx.globalAlpha = p.life;
                if (p.glow || this.params.glow) { this.ctx.shadowBlur = 20 * p.life; this.ctx.shadowColor = p.color; this.ctx.globalAlpha = p.life * 0.8; }
                this.ctx.fill(); this.ctx.restore();
            }
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }
    drawRoundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = this.container.getBoundingClientRect();

        // Use a fallback to ensure we never have 0 dimensions
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;

        [this.canvas, this.sandCanvas].forEach(c => {
            c.width = this.width * dpr;
            c.height = this.height * dpr;
            c.style.width = this.width + 'px';
            c.style.height = this.height + 'px';
        });

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.sandCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.resetActivity();
    }

    loop() {
        this.ctx.globalCompositeOperation = 'source-over';
        if (Math.random() > (this.mouse.active ? 0.7 : 0.95)) {
            const tx = this.mouse.active ? this.mouse.x : this.width / 2 + Math.sin(Date.now() * 0.001) * 100;
            const ty = this.mouse.active ? this.mouse.y : this.height / 2 + Math.cos(Date.now() * 0.001) * 100;
            this.particles.push({
                x: tx, y: ty,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 3 + 1,
                color: this.params.color,
                life: 1, decay: 0.01,
                glow: true
            });
        }

        if (this.engines[this.mode]) {
            if (this.params.glow) this.ctx.globalCompositeOperation = 'lighter';
            this.engines[this.mode]();
        }
        window.requestAnimationFrame(() => this.loop());
    }

    initPWA() {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('SW Registered', reg))
                    .catch(err => console.log('SW Error', err));
            });
        }

        // Handle Installation Logic
        let deferredPrompt;
        const installContainer = document.getElementById('install-container');
        const installBtn = document.getElementById('btn-install');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installContainer.style.display = 'flex';
        });

        installBtn.onclick = async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installContainer.style.display = 'none';
            }
            deferredPrompt = null;
        };

        window.addEventListener('appinstalled', () => {
            installContainer.style.display = 'none';
            deferredPrompt = null;
        });
    }
}
window.addEventListener('DOMContentLoaded', () => new ZenFlow());
