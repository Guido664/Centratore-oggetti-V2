import React, { useRef, useState, useEffect } from 'react';

export interface VisualData {
  wallWidth: number;
  objects: {
    start: number;
    width: number;
  }[];
  mode: 'uniform' | 'desired';
  gapSize?: number; // For uniform mode
  sideGap?: number; // For desired mode
  innerGap?: number; // For desired mode
}

const Visualization: React.FC<{ data: VisualData }> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [transform, setTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanPointRef = useRef({ x: 0, y: 0 });
  const startTransformRef = useRef({ scale: 1, translateX: 0, translateY: 0 });
  const initialPinchDistanceRef = useRef(0);


  const resetView = () => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(entries[0].contentRect.width);
        resetView(); // Reset view on resize to avoid weird positioning
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    setTransform(prev => {
      const newScale = Math.max(1, prev.scale + scaleAmount); // Min zoom is 1x
      const newTranslateX = mouseX - (mouseX - prev.translateX) * (newScale / prev.scale);
      const newTranslateY = mouseY - (mouseY - prev.translateY) * (newScale / prev.scale);
      return { scale: newScale, translateX: newTranslateX, translateY: newTranslateY };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    startPanPointRef.current = { x: e.clientX, y: e.clientY };
    startTransformRef.current = { ...transform };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    const dx = e.clientX - startPanPointRef.current.x;
    const dy = e.clientY - startPanPointRef.current.y;
    
    setTransform({
      ...transform,
      translateX: startTransformRef.current.translateX + dx,
      translateY: startTransformRef.current.translateY + dy,
    });
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
      setIsPanning(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
     e.preventDefault();
    if (e.touches.length === 1) { // Pan
      setIsPanning(true);
      startPanPointRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startTransformRef.current = { ...transform };
    } else if (e.touches.length === 2) { // Zoom
      setIsPanning(false); // Stop panning when zoom starts
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      startTransformRef.current = { ...transform };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
     e.preventDefault();
    if (e.touches.length === 1 && isPanning) { // Pan
      const dx = e.touches[0].clientX - startPanPointRef.current.x;
      const dy = e.touches[0].clientY - startPanPointRef.current.y;
      setTransform({
        ...transform,
        translateX: startTransformRef.current.translateX + dx,
        translateY: startTransformRef.current.translateY + dy,
      });
    } else if (e.touches.length === 2 && initialPinchDistanceRef.current > 0) { // Zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
      const scaleMultiplier = currentPinchDistance / initialPinchDistanceRef.current;
      const newScale = Math.max(1, startTransformRef.current.scale * scaleMultiplier);
      
      const svgRect = e.currentTarget.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - svgRect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - svgRect.top;

      const newTranslateX = midX - (midX - startTransformRef.current.translateX) * (newScale / startTransformRef.current.scale);
      const newTranslateY = midY - (midY - startTransformRef.current.translateY) * (newScale / startTransformRef.current.scale);
      
      setTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPanning(false);
    initialPinchDistanceRef.current = 0;
  };

  const formatNumber = (num: number): string => {
    if (num % 1 === 0) {
      return num.toString();
    }
    return num.toFixed(1);
  };

  const DimensionLabel = ({ startX, endX, y, label }: { startX: number, endX: number, y: number, label: string }) => {
    const width = endX - startX;
    const midX = startX + width / 2;
    // Hide label if the space is too small to avoid clutter
    const showLabel = width > 25 / transform.scale; 

    if (!showLabel) {
      return null;
    }

    return (
      <text x={midX} y={y} textAnchor="middle" fill="#1f2937" className="text-sm font-semibold">
        {label}
      </text>
    );
  };


  if (!data) {
    return null;
  }

  const { wallWidth, objects } = data;
  const scaleFactor = containerWidth > 0 ? containerWidth / wallWidth : 0;

  // Define vertical layout constants
  const topMargin = 50;
  const wallHeight = 50;
  const centerLabelY_low = topMargin - 10;
  const centerLabelY_high = topMargin - 25;
  const dimTextY = topMargin + wallHeight + 30;
  const totalSvgHeight = dimTextY + 15;


  return (
    <>
      <div className="flex justify-end mb-2">
        <button
          onClick={resetView}
          className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Reimposta la visualizzazione allo zoom iniziale"
        >
          Reset View
        </button>
      </div>
      <div 
        ref={containerRef} 
        className="w-full overflow-hidden border border-gray-200 rounded-md" 
        style={{ cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
        aria-label="Rappresentazione visiva del muro e degli oggetti. Usa la rotellina del mouse o il tocco per zoomare e trascinare."
      >
        {containerWidth > 0 && (
          <svg 
            width="100%" 
            height={totalSvgHeight} 
            role="img"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <title>Schema di posizionamento interattivo</title>
            <desc>
              Un rettangolo grigio rappresenta il muro. I rettangoli blu rappresentano gli oggetti.
              Sopra ogni oggetto, un'etichetta viola mostra la posizione del centro. Sotto, i numeri indicano le dimensioni degli spazi.
              Se la spaziatura è uniforme, viene mostrata una sola misura al centro. Se la spaziatura è specificata, vengono mostrati gli spazi laterali e quelli tra oggetti.
              La vista è interattiva: usa la rotellina per zoomare e trascina per spostare la visuale. Sui dispositivi mobili, usa due dita per zoomare e un dito per trascinare.
            </desc>
            <g transform={`translate(${transform.translateX}, ${transform.translateY}) scale(${transform.scale})`}>
              {/* Wall */}
              <rect
                x="0"
                y={topMargin}
                width={wallWidth * scaleFactor}
                height={wallHeight}
                fill="#e2e8f0"
                stroke="#94a3b8"
                strokeWidth="1"
              />

              {/* Objects */}
              {objects.map((obj, index) => (
                <rect
                  key={`obj-${index}`}
                  x={obj.start * scaleFactor}
                  y={topMargin}
                  width={obj.width * scaleFactor}
                  height={wallHeight}
                  fill="#3b82f6"
                />
              ))}

              {/* Center position labels */}
              {objects.map((obj, index) => {
                const centerPos = obj.start + obj.width / 2;
                const centerX_svg = centerPos * scaleFactor;
                const labelY = (index % 2 !== 0) ? centerLabelY_high : centerLabelY_low;

                return (
                  <g key={`center-label-${index}`} className="text-xs font-bold text-fuchsia-600">
                    <line
                      x1={centerX_svg}
                      y1={topMargin}
                      x2={centerX_svg}
                      y2={topMargin - 5}
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <text
                      x={centerX_svg}
                      y={labelY}
                      textAnchor="middle"
                      fill="currentColor"
                    >
                      {formatNumber(centerPos)}
                    </text>
                  </g>
                );
              })}

              {/* Dimension Labels */}
              {data.mode === 'uniform' && typeof data.gapSize === 'number' && (
                 <text x={(wallWidth * scaleFactor) / 2} y={dimTextY} textAnchor="middle" className="text-sm font-bold text-gray-800">
                    {formatNumber(data.gapSize)}
                 </text>
              )}
              
              {data.mode === 'desired' && typeof data.sideGap === 'number' && typeof data.innerGap === 'number' && objects.length > 0 && (
                <>
                  {/* Left Side Gap */}
                  <DimensionLabel
                    startX={0}
                    endX={objects[0].start * scaleFactor}
                    y={dimTextY}
                    label={formatNumber(data.sideGap)}
                  />

                  {/* Single Inner Gap (if more than one object) */}
                  {objects.length > 1 && data.innerGap > 0 && (
                    <DimensionLabel
                      startX={(objects[0].start + objects[0].width) * scaleFactor}
                      endX={objects[1].start * scaleFactor}
                      y={dimTextY}
                      label={formatNumber(data.innerGap)}
                    />
                  )}
                  
                  {/* Right Side Gap */}
                  <DimensionLabel
                    startX={(objects[objects.length - 1].start + objects[objects.length - 1].width) * scaleFactor}
                    endX={wallWidth * scaleFactor}
                    y={dimTextY}
                    label={formatNumber(data.sideGap)}
                  />
                </>
              )}
            </g>
          </svg>
        )}
      </div>
    </>
  );
};

export default Visualization;