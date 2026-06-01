'use client';
import { scoreColor } from '@/lib/utils';

interface Props { score: number; size?: number }

export function ScoreRing({ score, size = 80 }: Props) {
  const r  = 32;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const capped  = Math.min(score, 15);
  const fill    = (capped / 15) * circumference;
  const color   = scoreColor(score).replace('text-', '');

  const stroke: Record<string, string> = {
    'success':    '#00c853',
    'warning':    '#ffab00',
    'orange-400': '#fb923c',
    'danger':     '#ff3d3d',
  };

  const s = stroke[color] ?? '#6b7280';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#2a2d3a" strokeWidth={6} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={s} strokeWidth={6}
        strokeDasharray={`${fill} ${circumference - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={cx} y={cx + 1} textAnchor="middle" dominantBaseline="middle"
        fill={s} fontSize={size < 70 ? 11 : 14} fontWeight="700" fontFamily="monospace">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}
