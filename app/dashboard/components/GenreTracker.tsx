/* octagon points generator
const n = 8;  // number of sides
const cx = 12, cy = 12;  // center
const r = 8;  // radius
const startAngle = -90;  // start at top

const points = Array.from({length: n}, (_, i) => {
  const angle = (startAngle + (360 / n) * i) * Math.PI / 180;
  const x = (cx + r * Math.cos(angle)).toFixed(1);
  const y = (cy + r * Math.sin(angle)).toFixed(1);
  return `${x} ${y}`;
}).join(' ');

console.log(points);
*/

const outer = "#1d2a40";
const inner = "#111721";
const progress = "#fdd807a6";

type GenreData = {
    name: string;
    value: number;
};

type GenreTrackerProps = {
    genres?: GenreData[];
};

export function GenreTracker({ genres: providedGenres }: GenreTrackerProps) {
    // Default 8 genre values (0-100 percentile values)
    const defaultGenres = [
        { name: "Action", value: 0 },
        { name: "RPG", value: 0 },
        { name: "Strategy", value: 0 },
        { name: "Puzzle", value: 0 },
        { name: "Adventure", value: 0 },
        { name: "Sports", value: 0 },
        { name: "Horror", value: 0 },
        { name: "Indie", value: 0 }
    ];

    const genres = providedGenres || defaultGenres;

    const cx = 12, cy = 12;
    const maxRadius = 10;
    const startAngle = -90;
    const n = 8;

    // Calculate data polygon points based on percentile values (0-100)
    const dataPoints = genres.map((genre, i) => {
        const angle = (startAngle + (360 / n) * i) * Math.PI / 180;
        const r = (genre.value / 100) * maxRadius; // Scale radius by percentile
        const x = (cx + r * Math.cos(angle)).toFixed(1);
        const y = (cy + r * Math.sin(angle)).toFixed(1);
        return `${x} ${y}`;
    }).join(' ');

    // Calculate octagon vertices for reference lines
    const octagonPoints = Array.from({length: n}, (_, i) => {
        const angle = (startAngle + (360 / n) * i) * Math.PI / 180;
        const x = parseFloat((cx + maxRadius * Math.cos(angle)).toFixed(2));
        const y = parseFloat((cy + maxRadius * Math.sin(angle)).toFixed(2));
        return { x, y };
    });

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="-4 -2 32 28" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="w-full h-full min-h-70">
                {/* Background rings (r=10, 8, 6, 4, 2) */}
                <polygon
                    points="12.0 2.0 19.1 4.9 22.0 12.0 19.1 19.1 12.0 22.0 4.9 19.1 2.0 12.0 4.9 4.9"
                    fill={outer}
                    />
                <polygon
                    points="12.0 4.0 17.7 6.3 20.0 12.0 17.7 17.7 12.0 20.0 6.3 17.7 4.0 12.0 6.3 6.3"
                    fill={inner}
                    />                
                <polygon
                    points="12.0 6.0 16.2 7.8 18.0 12.0 16.2 16.2 12.0 18.0 7.8 16.2 6.0 12.0 7.8 7.8"
                    fill={outer}
                    />                
                <polygon
                    points="12.0 8.0 14.8 9.2 16.0 12.0 14.8 14.8 12.0 16.0 9.2 14.8 8.0 12.0 9.2 9.2"
                    fill={inner}
                    />                
                <polygon
                    points="12.0 10.0 13.4 10.6 14.0 12.0 13.4 13.4 12.0 14.0 10.6 13.4 10.0 12.0 10.6 10.6"
                    fill={outer}
                    />
                
                {/* Reference lines from center to vertices */}
                {octagonPoints.map((point, i) => (
                    <line
                        key={`line-${i}`}
                        x1={cx}
                        y1={cy}
                        x2={point.x}
                        y2={point.y}
                        stroke="#4a3a5f"
                        strokeWidth="0.1"
                    />
                ))}

                {/* Data polygon (based on genre values) */}
                <polygon
                    points={dataPoints}
                    fill={progress}
                    fillOpacity="0.7"
                    stroke="#fdd807"
                    strokeWidth="0.3"
                />

                {/* Data points */}
                {genres.map((genre, i) => {
                    const angle = (startAngle + (360 / n) * i) * Math.PI / 180;
                    const r = (genre.value / 100) * maxRadius;
                    const x = parseFloat((cx + r * Math.cos(angle)).toFixed(2));
                    const y = parseFloat((cy + r * Math.sin(angle)).toFixed(2));
                    return (
                        <circle
                            key={`point-${i}`}
                            cx={x}
                            cy={y}
                            r="0.4"
                            fill="#fdd807"
                        />
                    );
                })}

                {/* Genre labels */}
                {genres.map((genre, i) => {
                    const angle = (startAngle + (360 / n) * i) * Math.PI / 180;
                    const labelRadius = maxRadius + 2; // Position labels outside the octagon
                    const x = parseFloat((cx + labelRadius * Math.cos(angle)).toFixed(2));
                    const y = parseFloat((cy + labelRadius * Math.sin(angle)).toFixed(2));
                    
                    // Adjust text anchor based on position
                    let textAnchor: "start" | "middle" | "end" = "middle";
                    if (x < cx - 0.5) textAnchor = "end";
                    else if (x > cx + 0.5) textAnchor = "start";
                    
                    return (
                        <text
                            key={`label-${i}`}
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            dominantBaseline="middle"
                            className="text-[1.1px] fill-gray-300"
                            style={{ fontSize: '1.1px' }}
                        >
                            {genre.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
