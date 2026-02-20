'use client';

import React, { useEffect, useRef } from 'react';

const StainedGlassShader: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) return;

        const vertexSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentSource = `
            precision highp float;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;

            // Simple noise function
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                vec2 center = u_mouse / u_resolution.xy;
                
                // Vintage Jewel Tones (Ruby, Sapphire, Amber, Deep Gold)
                vec3 ruby = vec3(0.5, 0.05, 0.1);
                vec3 sapphire = vec3(0.05, 0.1, 0.3);
                vec3 amber = vec3(0.6, 0.3, 0.05);
                vec3 emerald = vec3(0.02, 0.2, 0.1);

                // Create "Glass Panes" using cellular-like pattern
                float dist = distance(uv, center);
                float timer = u_time * 0.1;
                
                vec2 p = uv * 4.0;
                float f = 0.0;
                f += 0.5000 * noise(p + timer); p *= 2.02;
                f += 0.2500 * noise(p - timer); p *= 2.03;
                
                // Mixing colors based on noise and position
                vec3 color = mix(ruby, sapphire, sin(uv.x * 3.0 + timer) * 0.5 + 0.5);
                color = mix(color, amber, cos(uv.y * 2.0 - timer * 0.5) * 0.5 + 0.5);
                color = mix(color, emerald, f * 0.3);

                // Add "Lead" lines (dark edges)
                float edge = abs(sin(uv.x * 10.0 + f) * sin(uv.y * 10.0 + f));
                float lead = smoothstep(0.48, 0.5, edge);
                color *= (0.7 + 0.3 * lead);

                // Ambient Glow
                float glow = smoothstep(0.5, 0.0, dist);
                color += glow * 0.1;

                gl_FragColor = vec4(color * 0.6, 1.0); // Keep it subtle for background
            }
        `;

        const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        };

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const timeLoc = gl.getUniformLocation(program, 'u_time');
        const resLoc = gl.getUniformLocation(program, 'u_resolution');
        const mouseLoc = gl.getUniformLocation(program, 'u_mouse');

        let mouseX = 0, mouseY = 0;
        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = canvas.height - e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const render = (time: number) => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);

            gl.uniform1f(timeLoc, time * 0.001);
            gl.uniform2f(resLoc, canvas.width, canvas.height);
            gl.uniform2f(mouseLoc, mouseX, mouseY);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(render);
        };

        requestAnimationFrame(render);

        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full -z-10 opacity-30 pointer-events-none"
            style={{ filter: 'blur(40px)' }}
        />
    );
};

export default StainedGlassShader;
