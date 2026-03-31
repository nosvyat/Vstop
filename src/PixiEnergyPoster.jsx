import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export default function PixiEnergyPoster() {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const host = hostRef.current;
    const app = new PIXI.Application();
    let mounted = true;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const rand = (min, max) => Math.random() * (max - min) + min;
    const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const COLOR_VIOLET = 0xd486ff;
    const COLOR_CYAN = 0x87ffe3;
    const COLOR_GOLD = 0xffd777;
    const COLOR_PINK = 0xff90dd;
    const COLOR_WHITE = 0xffffff;
    const PARTICLE_COLORS = [COLOR_GOLD, COLOR_PINK, COLOR_CYAN, 0xa8baff];

    const run = async () => {
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        preference: 'high-performance',
        powerPreference: 'high-performance',
      });

      if (!mounted) return;
      host.appendChild(app.canvas);

      const W = () => app.screen.width;
      const H = () => app.screen.height;
      const CX = () => W() * 0.5;
      const CY = () => H() * 0.5;
      const MS = () => Math.min(W(), H());

      const root = new PIXI.Container();
      app.stage.addChild(root);

      const bgVignette = new PIXI.Graphics();
      root.addChild(bgVignette);

      const poster = new PIXI.Container();
      root.addChild(poster);

      const baseTexture = await PIXI.Assets.load('/image.png');
      const base = new PIXI.Sprite(baseTexture);
      base.anchor.set(0.5);
      poster.addChild(base);

      const haloLayer = new PIXI.Container();
      const mistLayer = new PIXI.Container();
      const bodyLayer = new PIXI.Container();
      const flameLayerBack = new PIXI.Container();
      const emberLayerBack = new PIXI.Container();
      const emberLayerFront = new PIXI.Container();
      const flashLayer = new PIXI.Container();
      const flameLayerFront = new PIXI.Container();

      poster.addChild(haloLayer);
      poster.addChild(mistLayer);
      poster.addChild(bodyLayer);
      poster.addChild(flameLayerBack);
      poster.addChild(emberLayerBack);
      poster.addChild(emberLayerFront);
      poster.addChild(flashLayer);
      poster.addChild(flameLayerFront);

      const haloA = new PIXI.Graphics();
      const haloB = new PIXI.Graphics();
      const mistA = new PIXI.Graphics();
      const mistB = new PIXI.Graphics();
      const bodyWave = new PIXI.Graphics();
      const shoulderLeft = new PIXI.Graphics();
      const shoulderRight = new PIXI.Graphics();
      const chestGlow = new PIXI.Graphics();
      const flash = new PIXI.Graphics();

      haloLayer.addChild(haloA, haloB);
      mistLayer.addChild(mistA, mistB);
      bodyLayer.addChild(bodyWave, shoulderLeft, shoulderRight, chestGlow);
      flashLayer.addChild(flash);

      const flameBack = [new PIXI.Graphics(), new PIXI.Graphics(), new PIXI.Graphics()];
      const flameFront = [new PIXI.Graphics(), new PIXI.Graphics()];
      flameBack.forEach((g) => flameLayerBack.addChild(g));
      flameFront.forEach((g) => flameLayerFront.addChild(g));

      flameBack.forEach((g, i) => {
        g.filters = [new PIXI.BlurFilter({ strength: i === 0 ? 6 : 4, quality: 1 })];
      });
      flameFront.forEach((g, i) => {
        g.filters = [new PIXI.BlurFilter({ strength: i === 0 ? 2.5 : 1.5, quality: 1 })];
      });

      haloA.filters = [new PIXI.BlurFilter({ strength: 24, quality: 1 })];
      haloB.filters = [new PIXI.BlurFilter({ strength: 14, quality: 1 })];
      mistA.filters = [new PIXI.BlurFilter({ strength: 26, quality: 1 })];
      mistB.filters = [new PIXI.BlurFilter({ strength: 16, quality: 1 })];
      shoulderLeft.filters = [new PIXI.BlurFilter({ strength: 14, quality: 1 })];
      shoulderRight.filters = [new PIXI.BlurFilter({ strength: 14, quality: 1 })];
      chestGlow.filters = [new PIXI.BlurFilter({ strength: 18, quality: 1 })];
      bodyWave.filters = [new PIXI.BlurFilter({ strength: 14, quality: 1 })];
      flash.filters = [new PIXI.BlurFilter({ strength: 12, quality: 1 })];

      const drawCircle = (g, x, y, r, color, alpha) => {
        g.circle(x, y, r);
        g.fill({ color, alpha });
      };

      const makeParticle = (front = false) => {
        const g = new PIXI.Graphics();
        (front ? emberLayerFront : emberLayerBack).addChild(g);

        const p = {
          g,
          front,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          size: 1,
          life: 0,
          maxLife: 1,
          color: choose(PARTICLE_COLORS),
          phase: rand(0, Math.PI * 2),
        };

        p.reset = () => {
          p.x = CX() + rand(-W() * 0.15, W() * 0.15);
          p.y = rand(H() * 0.10, H() * 0.52);
          p.vx = rand(-0.05, 0.05);
          p.vy = front ? rand(-0.90, -0.45) : rand(-0.68, -0.28);
          p.size = front ? rand(0.6, 1.6) : rand(0.35, 1.0);
          p.life = rand(60, 170);
          p.maxLife = p.life;
          p.color = choose(PARTICLE_COLORS);
          p.phase = rand(0, Math.PI * 2);
        };

        p.reset();
        return p;
      };

      const embersBack = Array.from({ length: 44 }, () => makeParticle(false));
      const embersFront = Array.from({ length: 26 }, () => makeParticle(true));

      let flashLife = 0;
      let flashMax = 1;
      let nextFlash = 110;
      let flashPoint = { x: 0.5, y: 0.43, r: 0.08, color: COLOR_GOLD };

      const triggerFlash = () => {
  flashPoint = choose([
    { x: 0.50, y: 0.34, r: 0.095, color: COLOR_VIOLET },
    { x: 0.50, y: 0.46, r: 0.125, color: COLOR_GOLD },
    { x: 0.36, y: 0.43, r: 0.090, color: COLOR_GOLD },
    { x: 0.64, y: 0.43, r: 0.090, color: COLOR_PINK },
  ]);

  flashLife = rand(10, 16);
  flashMax = flashLife;
  nextFlash = rand(95, 170);
};

      const resizeScene = () => {
        const textureRatio = base.texture.width / base.texture.height;
const screenRatio = W() / H();

if (screenRatio > textureRatio) {
  base.width = W();
  base.height = W() / textureRatio;
} else {
  base.height = H();
  base.width = H() * textureRatio;
}

base.x = CX();
base.y = CY();

        bgVignette.clear();
        drawCircle(bgVignette, CX(), CY(), MS() * 0.72, 0x3b0917, 0.12);
      };

      const drawHalo = (t) => {
        haloA.clear();
        haloB.clear();

        const pulseA = 0.95 + Math.sin(t * 0.0013) * 0.08;
        const pulseB = 0.90 + Math.sin(t * 0.0017 + 1.2) * 0.07;

        drawCircle(haloA, CX(), H() * 0.50, MS() * 0.34 * pulseA, COLOR_VIOLET, 0.08);
        drawCircle(haloA, CX(), H() * 0.45, MS() * 0.23 * pulseA, COLOR_CYAN, 0.04);
        drawCircle(haloB, CX(), H() * 0.49, MS() * 0.26 * pulseB, COLOR_CYAN, 0.05);
        drawCircle(haloB, CX(), H() * 0.56, MS() * 0.16 * pulseB, COLOR_PINK, 0.035);
      };

      const drawMist = (t) => {
        mistA.clear();
        mistB.clear();

        const driftA = Math.sin(t * 0.0006) * W() * 0.01;
        const driftB = Math.cos(t * 0.0008) * W() * 0.008;

        drawCircle(mistA, CX() + driftA, H() * 0.28, MS() * 0.18, COLOR_WHITE, 0.06);
        drawCircle(mistA, CX() + driftA * 0.7, H() * 0.40, MS() * 0.12, COLOR_GOLD, 0.04);
        drawCircle(mistB, CX() + driftB, H() * 0.18, MS() * 0.12, COLOR_CYAN, 0.05);
        drawCircle(mistB, CX() - driftB * 0.5, H() * 0.34, MS() * 0.10, COLOR_PINK, 0.035);
      };

      const drawBodyEnergy = (t) => {
        bodyWave.clear();
        shoulderLeft.clear();
        shoulderRight.clear();
        chestGlow.clear();

        const progress = (Math.sin(t * 0.0007) + 1) * 0.5;
        const y = H() * (0.83 - progress * 0.48);

        bodyWave.ellipse(CX(), y, W() * 0.11, H() * 0.020);
        bodyWave.fill({ color: COLOR_GOLD, alpha: 0.10 });
        bodyWave.ellipse(CX(), y, W() * 0.09, H() * 0.014);
        bodyWave.fill({ color: COLOR_CYAN, alpha: 0.05 });

        const pulse = 0.18 + (0.5 + Math.sin(t * 0.0011) * 0.5) * 0.08;
        drawCircle(shoulderLeft, W() * 0.36, H() * 0.43, MS() * 0.08, COLOR_GOLD, pulse);
        drawCircle(shoulderRight, W() * 0.64, H() * 0.43, MS() * 0.08, COLOR_PINK, pulse);
        drawCircle(chestGlow, W() * 0.50, H() * 0.46, MS() * 0.10, COLOR_WHITE, 0.06 + (0.5 + Math.sin(t * 0.0014) * 0.5) * 0.04);
      };

      const drawFlameRibbon = (g, t, cfg) => {
        const { phase, alpha, widthScale, xShift, color, top = 0.02, bottom = 0.48 } = cfg;
        g.clear();

        const cx = CX() + xShift + Math.sin(t * 0.0010 + phase) * 4;
        const y0 = H() * top;
        const y1 = H() * bottom;
        const right = [];
        const left = [];

        for (let i = 0; i <= 28; i++) {
          const k = i / 28;
          const y = y0 + (y1 - y0) * k;
          const sway =
            Math.sin(t * 0.0020 + phase + k * 7.6) * (18 * widthScale) +
            Math.sin(t * 0.0035 + phase * 0.7 + k * 12.4) * (8 * widthScale) +
            Math.sin(t * 0.0012 + phase * 1.3 + k * 5.2) * (4 * widthScale);
          const half = ((1 - k) * 28 + 8) * widthScale;

          right.push([cx + sway + half, y]);
          left.push([cx + sway - half, y]);
        }

        g.moveTo(cx, y0);
        right.forEach(([x, y]) => g.lineTo(x, y));
        left.reverse().forEach(([x, y]) => g.lineTo(x, y));
        g.closePath();
        g.fill({ color, alpha });
      };

      const updateParticles = (arr, delta, t, front = false) => {
  arr.forEach((p, i) => {
    p.life -= delta;
    p.x += p.vx * delta + Math.sin(t * 0.0032 + p.phase + i * 0.1) * (front ? 0.08 : 0.045);
    p.y += p.vy * delta;

    if (p.life <= 0 || p.y < -10) p.reset();

    const life = clamp(p.life / p.maxLife, 0, 1);
    const alpha = life * (front ? 0.95 : 0.72);

    p.g.clear();
    p.g.ellipse(0, 0, p.size * 0.75, p.size * 1.35);
    p.g.fill({ color: p.color, alpha });

    p.g.x = p.x;
    p.g.y = p.y;
    p.g.rotation = front ? 0.18 : 0.08;
  });
};

      const updateFlash = (delta) => {
  flash.clear();
  flashLife -= delta;
  nextFlash -= delta;

  if (nextFlash <= 0) triggerFlash();

  if (flashLife > 0) {
    const burst = Math.sin((1 - flashLife / flashMax) * Math.PI);
    const alpha = clamp(burst, 0, 1) * 0.46;

    drawCircle(
      flash,
      W() * flashPoint.x,
      H() * flashPoint.y,
      W() * flashPoint.r,
      flashPoint.color,
      alpha
    );

    drawCircle(
      flash,
      W() * flashPoint.x,
      H() * flashPoint.y,
      W() * flashPoint.r * 0.62,
      COLOR_WHITE,
      alpha * 0.22
    );
  }
};

      const tick = (ticker) => {
        const t = app.ticker.lastTime;
        const d = ticker.deltaTime;

        const camX = Math.sin(t * 0.00045) * 6;
        const camY = Math.cos(t * 0.00033) * -10;
        const camScale = 1.03 + Math.sin(t * 0.00028) * 0.02;

        poster.x = camX;
        poster.y = camY;
        poster.scale.set(camScale);

        haloLayer.x = camX * 0.5;
        haloLayer.y = camY * 0.5;
        flameLayerBack.x = camX * 0.8;
        flameLayerBack.y = camY * 0.8;
        emberLayerBack.x = camX * 0.9;
        emberLayerBack.y = camY * 0.9;
        emberLayerFront.x = camX * 1.15;
        emberLayerFront.y = camY * 1.15;
        flashLayer.x = camX * 0.95;
        flashLayer.y = camY * 0.95;

        drawHalo(t);
        drawMist(t);
        drawBodyEnergy(t);

        drawFlameRibbon(flameBack[0], t, { phase: 0.2, alpha: 0.18, widthScale: 1.0, xShift: 0, color: COLOR_VIOLET });
        drawFlameRibbon(flameBack[1], t, { phase: 1.4, alpha: 0.14, widthScale: 0.84, xShift: -W() * 0.025, color: COLOR_CYAN });
        drawFlameRibbon(flameBack[2], t, { phase: 2.6, alpha: 0.12, widthScale: 0.76, xShift: W() * 0.025, color: COLOR_GOLD });

        drawFlameRibbon(flameFront[0], t, { phase: 0.8, alpha: 0.11, widthScale: 0.54, xShift: -W() * 0.008, color: COLOR_WHITE, top: 0.05, bottom: 0.39 });
        drawFlameRibbon(flameFront[1], t, { phase: 2.2, alpha: 0.09, widthScale: 0.46, xShift: W() * 0.01, color: COLOR_PINK, top: 0.06, bottom: 0.35 });

        updateParticles(embersBack, d, t, false);
        updateParticles(embersFront, d, t, true);
        updateFlash(d);
      };

      resizeScene();
      const onResize = () => resizeScene();
      window.addEventListener('resize', onResize);
      app.ticker.add(tick);

      host.__cleanupPixi = () => {
        window.removeEventListener('resize', onResize);
        app.ticker.remove(tick);
      };
    };

    run();

    return () => {
      mounted = false;
      if (host.__cleanupPixi) host.__cleanupPixi();
      app.destroy(true, { children: true, texture: false });
    };
  }, []);

  return <div ref={hostRef} className='poster-root' />;
}
