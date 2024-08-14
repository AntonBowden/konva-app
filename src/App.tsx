import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';
import Konva from 'konva';

type Tool = 'select' | 'rect' | 'circle' | 'line';
type Shape = 'rect' | 'circle';

interface ShapeData {
  id: string;
  type: Shape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
}

interface LineData {
  id: string;
  points: number[];
  startShapeId: string | null;
  endShapeId: string | null;
}

const App: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [shape, setShape] = useState<Shape>('rect');
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [lines, setLines] = useState<LineData[]>([]);
  const [activeLine, setActiveLine] = useState<number[] | null>(null);

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
      setActiveLine([pos.x, pos.y, pos.x, pos.y]);
    } else {
      const newShape: ShapeData = {
        id: Math.random().toString(),
        type: shape,
        x: pos.x,
        y: pos.y,
        width: 50,
        height: 50,
        radius: 25,
      };

      setShapes([...shapes, newShape]);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || tool !== 'line' || !activeLine) return;
    if (!stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    setActiveLine([activeLine[0], activeLine[1], pos.x, pos.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'line' && activeLine) {
      attachLineToShapes();
    }
  };

  const isPointInShape = (x: number, y: number, shape: ShapeData): boolean => {
    if (shape.type === 'rect') {
      return (
        x >= shape.x &&
        x <= shape.x + (shape.width || 0) &&
        y >= shape.y &&
        y <= shape.y + (shape.height || 0)
      );
    } else if (shape.type === 'circle') {
      const dx = x - (shape.x + (shape.radius || 0));
      const dy = y - (shape.y + (shape.radius || 0));
      return dx * dx + dy * dy <= (shape.radius || 0) * (shape.radius || 0);
    }
    return false;
  };

  const attachLineToShapes = () => {
    if (!activeLine) return;

    const [x1, y1, x2, y2] = activeLine;
    let startShape: ShapeData | null = null;
    let endShape: ShapeData | null = null;

    for (const shape of shapes) {
      if (isPointInShape(x1, y1, shape)) {
        startShape = shape;
      }
      if (isPointInShape(x2, y2, shape)) {
        endShape = shape;
      }
    }

    const newLine: LineData = {
      id: Math.random().toString(),
      points: activeLine,
      startShapeId: startShape?.id || null,
      endShapeId: endShape?.id || null,
    };

    setLines([...lines, newLine]);
    setActiveLine(null);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
    const updatedShapes = shapes.map(shape => 
      shape.id === shapeId ? { ...shape, x: e.target.x(), y: e.target.y() } : shape
    );
    setShapes(updatedShapes);

    const updatedLines = lines.map(line => {
      let newPoints = [...line.points];
      if (line.startShapeId === shapeId) {
        newPoints[0] = e.target.x() + (e.target.width() / 2 || e.target.radius());
        newPoints[1] = e.target.y() + (e.target.height() / 2 || e.target.radius());
      }
      if (line.endShapeId === shapeId) {
        newPoints[2] = e.target.x() + (e.target.width() / 2 || e.target.radius());
        newPoints[3] = e.target.y() + (e.target.height() / 2 || e.target.radius());
      }
      return { ...line, points: newPoints };
    });
    setLines(updatedLines);
  };

  const handleLineClick = (e: Konva.KonvaEventObject<MouseEvent>, lineId: string) => {
    if (tool !== 'select') return;

    const updatedLines = lines.map(line => {
      if (line.id === lineId) {
        const stage = e.target.getStage();
        if (!stage) return line;

        const pos = stage.getPointerPosition();
        if (!pos) return line;

        let newPoints = [...line.points];
        const distToStart = Math.hypot(pos.x - newPoints[0], pos.y - newPoints[1]);
        const distToEnd = Math.hypot(pos.x - newPoints[2], pos.y - newPoints[3]);

        if (distToStart < 10) {
          return { ...line, startShapeId: null };
        } else if (distToEnd < 10) {
          return { ...line, endShapeId: null };
        }
      }
      return line;
    });

    setLines(updatedLines);
  };

  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
        <button onClick={() => setTool('select')}>Cursor</button>
        <select
          onChange={(e) => {
            setTool(e.target.value as Shape);
            setShape(e.target.value as Shape);
          }}
        >
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
        <button onClick={() => setTool('line')}>Line</button>
      </div>
      <Stage
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer ref={layerRef}>
          {shapes.map((shape) =>
            shape.type === 'rect' ? (
              <Rect
                key={shape.id}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill={Konva.Util.getRandomColor()}
                draggable
                onDragMove={(e) => handleDragMove(e, shape.id)}
              />
            ) : (
              <Circle
                key={shape.id}
                x={shape.x + (shape.radius || 0)}
                y={shape.y + (shape.radius || 0)}
                radius={shape.radius}
                fill={Konva.Util.getRandomColor()}
                draggable
                onDragMove={(e) => handleDragMove(e, shape.id)}
              />
            )
          )}
          {lines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              stroke="black"
              strokeWidth={2}
              onClick={(e) => handleLineClick(e, line.id)}
            />
          ))}
          {activeLine && (
            <Line points={activeLine} stroke="black" strokeWidth={2} />
          )}
        </Layer>
      </Stage>
    </>
  );
};

export default App;