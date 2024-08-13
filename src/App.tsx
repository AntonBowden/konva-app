import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';
import Konva from 'konva';

type Tool = 'select' | 'rect' | 'circle' | 'line';
type Shape = 'rect' | 'circle';

const App: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [shape, setShape] = useState<Shape>('rect');
  const [isDrawing, setIsDrawing] = useState(false);
  const [linePoints, setLinePoints] = useState<number[]>([]);

  useEffect(() => {
    const updateSize = () => {
      if (stageRef.current) {
        stageRef.current.width(window.innerWidth);
        stageRef.current.height(window.innerHeight);
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    if (tool === 'select') {
      return;
    }

    setIsDrawing(true);

    if (tool === 'line') {
      setLinePoints([pos.x, pos.y, pos.x, pos.y]);
    } else {
      const shapeProps = {
        x: pos.x,
        y: pos.y,
        width: 50,
        height: 50,
        fill: Konva.Util.getRandomColor(),
        draggable: true,
      };

      const newShape = tool === 'rect' 
        ? new Konva.Rect(shapeProps)
        : new Konva.Circle({ ...shapeProps, radius: 25 });

      layerRef.current?.add(newShape);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    if (!stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    if (tool === 'line') {
      setLinePoints([linePoints[0], linePoints[1], pos.x, pos.y]);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    if (tool === 'line' && layerRef.current) {
      const newLine = new Konva.Line({
        points: linePoints,
        stroke: 'black',
        strokeWidth: 2,
      });
      layerRef.current.add(newLine);
      setLinePoints([]);
    }
  };

  return (
    <>
      <div className='toolbar' >
        <button onClick={() => setTool('select')} className={tool === 'select' ? 'active' : ''}>Cursor</button>
        <select onChange={(e) => {
          setTool(e.target.value as Shape);
          setShape(e.target.value as Shape);
        }}>
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
        <button onClick={() => setTool('line')} className={tool === 'line' ? 'active' : ''}>Line</button>
      </div>
      <Stage
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer ref={layerRef}>
          {isDrawing && tool === 'line' && (
            <Line points={linePoints} stroke="black" strokeWidth={2} />
          )}
        </Layer>
      </Stage>
    </>
  );
};

export default App;