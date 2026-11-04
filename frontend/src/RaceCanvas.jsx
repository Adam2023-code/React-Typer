import React, {useRef, useEffect} from 'react';

const CAR_AVATARS = ['🚗', '🚙', '🏎️', '🚕', '🚓', '🚑', '🚒', '🛻', '🚚', '🚛'];

const LANE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#eab308', '#6366f1'];


const RaceCanvas = ({ players = [], playersPct = {} }) => {
    const canvasRef = useRef(null);

    const currentPositionsRef = useRef({});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const laneHeight = 60;
        const padding = 30;
        const trackWidth = canvas.width - padding * 2;
        let animationFrameId;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            players.forEach((player, index) => {
                const playerId = typeof player === 'object' ? player.id : player;
                const username = typeof player === 'object' ? player.username : `Player ${index + 1}`;

                const targetPct = playersPct[playerId] || 0;
                const targetX = padding + targetPct * trackWidth;


                const user_x = targetPct * (canvas.width - 60);
                const user_y = 40 + (index * laneHeight);


                if (currentPositionsRef.current[playerId] === undefined) {
                    currentPositionsRef.current[playerId] = padding;
                }

                const currentX = currentPositionsRef.current[playerId];
                const diff = targetX - currentX;
                currentPositionsRef.current[playerId] += diff * 0.1;

                const activeX = currentPositionsRef.current[playerId];
                const y = index * laneHeight + 40;

                const laneColor = LANE_COLORS[index % LANE_COLORS.length];
                const carSymbol = CAR_AVATARS[index % CAR_AVATARS.length];


                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(activeX, y);
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(activeX, y);
                ctx.strokeStyle = laneColor;
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.stroke();

                ctx.fillStyle = '#000000';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(username, activeX, y - 25);


                ctx.save();
                ctx.translate(activeX, y);
                ctx.scale(-1, 1);

                ctx.font = '22px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(carSymbol, 0, 0);

                ctx.restore();

                // ctx.fillStyle = '#ffffff';
                // ctx.font = '12px sans-serif';
                // ctx.fillText(username, user_x, user_y - 12);
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [players, playersPct]);

    return (
        <canvas
            ref={canvasRef}
            width={700}
            height={Math.max(players.length * 60 + 30, 90)}
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
        />
    );
}

export default RaceCanvas;