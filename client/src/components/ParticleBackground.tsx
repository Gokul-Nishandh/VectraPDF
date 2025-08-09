import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface MousePosition {
  x: number;
  y: number;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mousePosition = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrame = useRef<number>();

  const PARTICLE_COUNT = 60;
  const CONNECTION_DISTANCE = 120;
  const REPULSION_DISTANCE = 100;
  const REPULSION_FORCE = 0.8;

  const initializeParticles = useCallback((width: number, height: number) => {
    particles.current = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
  }, []);

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    const particleArray = particles.current;
    
    for (let i = 0; i < particleArray.length; i++) {
      for (let j = i + 1; j < particleArray.length; j++) {
        const dx = particleArray[i].x - particleArray[j].x;
        const dy = particleArray[i].y - particleArray[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONNECTION_DISTANCE) {
          const opacity = (1 - distance / CONNECTION_DISTANCE) * 0.3;
          ctx.strokeStyle = `rgba(16, 163, 127, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particleArray[i].x, particleArray[i].y);
          ctx.lineTo(particleArray[j].x, particleArray[j].y);
          ctx.stroke();
        }
      }
    }
  }, []);

  const updateParticles = useCallback((width: number, height: number) => {
    particles.current.forEach((particle) => {
      // Mouse repulsion
      const dx = particle.x - mousePosition.current.x;
      const dy = particle.y - mousePosition.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < REPULSION_DISTANCE) {
        const force = (REPULSION_DISTANCE - distance) / REPULSION_DISTANCE * REPULSION_FORCE;
        particle.vx += (dx / distance) * force * 0.1;
        particle.vy += (dy / distance) * force * 0.1;
      }

      // Apply velocity
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Friction
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Boundary bounce
      if (particle.x <= 0 || particle.x >= width) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(width, particle.x));
      }
      if (particle.y <= 0 || particle.y >= height) {
        particle.vy *= -0.8;
        particle.y = Math.max(0, Math.min(height, particle.y));
      }

      // Gentle return to center tendency
      particle.vx += (Math.random() - 0.5) * 0.01;
      particle.vy += (Math.random() - 0.5) * 0.01;
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    drawConnections(ctx);

    // Draw particles
    particles.current.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(16, 163, 127, ${particle.opacity})`;
      ctx.fill();
    });

    // Update particles
    updateParticles(width, height);
  }, [drawConnections, updateParticles]);

  const animate = useCallback(() => {
    draw();
    animationFrame.current = requestAnimationFrame(animate);
  }, [draw]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    initializeParticles(innerWidth, innerHeight);
  }, [initializeParticles]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    mousePosition.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    handleResize();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Start animation
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [handleResize, handleMouseMove, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};