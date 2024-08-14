import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle, Line } from "react-konva";
import Konva from "konva";

type Tool = "select" | "rect" | "circle" | "line";
type Shape = "rect" | "circle";

interface ShapeData {
  id: string;
  type: Shape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
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
  const [tool, setTool] = useState<Tool>("select");
  const [shape, setShape] = useState<Shape>("rect");
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [lines, setLines] = useState<LineData[]>([]);
  const [activeLine, setActiveLine] = useState<number[] | null>(null);
  const [hoveredLineEnd, setHoveredLineEnd] = useState<string | null>(null);
  const [draggedLineEnd, setDraggedLineEnd] = useState<{
    lineId: string;
    end: "start" | "end";
  } | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (stageRef.current) {
        stageRef.current.width(window.innerWidth);
        stageRef.current.height(window.innerHeight);
      }
    };

    window.addEventListener("resize", updateSize);
    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    if (tool === "select") {
      return;
    }

    setIsDrawing(true);

    if (tool === "line") {
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
        fill: Konva.Util.getRandomColor(),
      };

      setShapes([...shapes, newShape]);
    }
  };

  const handleLineMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent>,
    lineId: string
  ) => {
    if (tool !== "select") return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    const [x1, y1, x2, y2] = line.points;
    const distToStart = Math.hypot(pos.x - x1, pos.y - y1);
    const distToEnd = Math.hypot(pos.x - x2, pos.y - y2);

    if (distToStart < 10) {
      setDraggedLineEnd({ lineId, end: "start" });
    } else if (distToEnd < 10) {
      setDraggedLineEnd({ lineId, end: "end" });
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    if (isDrawing && tool === "line" && activeLine) {
      setActiveLine([activeLine[0], activeLine[1], pos.x, pos.y]);
    } else if (draggedLineEnd) {
      const updatedLines = lines.map((line) => {
        if (line.id === draggedLineEnd.lineId) {
          const newPoints = [...line.points];
          if (draggedLineEnd.end === "start" && !line.startShapeId) {
            newPoints[0] = pos.x;
            newPoints[1] = pos.y;
          } else if (draggedLineEnd.end === "end" && !line.endShapeId) {
            newPoints[2] = pos.x;
            newPoints[3] = pos.y;
          }
          return { ...line, points: newPoints };
        }
        return line;
      });

      setLines(updatedLines);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    if (tool === "line" && activeLine) {
      attachLineToShapes();
    }

    if (draggedLineEnd) {
      const updatedLines = lines.map((line) => {
        if (line.id === draggedLineEnd.lineId) {
          const [x, y] =
            draggedLineEnd.end === "start"
              ? [line.points[0], line.points[1]]
              : [line.points[2], line.points[3]];
          const attachedShape = findNearestShape(x, y);
          if (attachedShape) {
            const newPoints = [...line.points];
            const centerX =
              attachedShape.x +
              (attachedShape.width || attachedShape.radius || 0) / 2;
            const centerY =
              attachedShape.y +
              (attachedShape.height || attachedShape.radius || 0) / 2;
            if (draggedLineEnd.end === "start") {
              newPoints[0] = centerX;
              newPoints[1] = centerY;
              return {
                ...line,
                points: newPoints,
                startShapeId: attachedShape.id,
              };
            } else {
              newPoints[2] = centerX;
              newPoints[3] = centerY;
              return {
                ...line,
                points: newPoints,
                endShapeId: attachedShape.id,
              };
            }
          }
        }
        return line;
      });

      setLines(updatedLines);
      setDraggedLineEnd(null);
    }
  };

  const findNearestShape = (x: number, y: number): ShapeData | null => {
    let nearestShape: ShapeData | null = null;
    let minDistance = Infinity;

    shapes.forEach((shape) => {
      const centerX = shape.x + (shape.width || shape.radius || 0) / 2;
      const centerY = shape.y + (shape.height || shape.radius || 0) / 2;
      const distance = Math.hypot(x - centerX, y - centerY);

      if (distance < minDistance && distance <= 20) {
        minDistance = distance;
        nearestShape = shape;
      }
    });

    return nearestShape;
  };

  const attachLineToShapes = () => {
    if (!activeLine) return;

    const [x1, y1, x2, y2] = activeLine;
    let startShape: ShapeData | null = null;
    let endShape: ShapeData | null = null;

    for (const shape of shapes) {
      const centerX = shape.x + (shape.width || shape.radius || 0) / 2;
      const centerY = shape.y + (shape.height || shape.radius || 0) / 2;

      if (isPointNearShape(x1, y1, shape)) {
        startShape = shape;
      }
      if (isPointNearShape(x2, y2, shape)) {
        endShape = shape;
      }
    }

    const newLine: LineData = {
      id: Math.random().toString(),
      points: [
        startShape
          ? startShape.x + (startShape.width || startShape.radius || 0) / 2
          : x1,
        startShape
          ? startShape.y + (startShape.height || startShape.radius || 0) / 2
          : y1,
        endShape
          ? endShape.x + (endShape.width || endShape.radius || 0) / 2
          : x2,
        endShape
          ? endShape.y + (endShape.height || endShape.radius || 0) / 2
          : y2,
      ],
      startShapeId: startShape?.id || null,
      endShapeId: endShape?.id || null,
    };

    setLines([...lines, newLine]);
    setActiveLine(null);
  };

  const isPointNearShape = (
    x: number,
    y: number,
    shape: ShapeData
  ): boolean => {
    const centerX = shape.x + (shape.width || shape.radius || 0) / 2;
    const centerY = shape.y + (shape.height || shape.radius || 0) / 2;
    const distance = Math.hypot(x - centerX, y - centerY);
    return distance <= 20;
  };

  const handleDragMove = (
    e: Konva.KonvaEventObject<DragEvent>,
    shapeId: string
  ) => {
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId
        ? { ...shape, x: e.target.x(), y: e.target.y() }
        : shape
    );
    setShapes(updatedShapes);

    const updatedLines = lines.map((line) => {
      let newPoints = [...line.points];
      if (line.startShapeId === shapeId) {
        newPoints[0] =
          e.target.x() + (e.target.width() / 2 || e.target.radius());
        newPoints[1] =
          e.target.y() + (e.target.height() / 2 || e.target.radius());
      }
      if (line.endShapeId === shapeId) {
        newPoints[2] =
          e.target.x() + (e.target.width() / 2 || e.target.radius());
        newPoints[3] =
          e.target.y() + (e.target.height() / 2 || e.target.radius());
      }
      return { ...line, points: newPoints };
    });
    setLines(updatedLines);
  };

  const handleLineClick = (
    e: Konva.KonvaEventObject<MouseEvent>,
    lineId: string
  ) => {
    if (tool !== "select") return;

    const updatedLines = lines.map((line) => {
      if (line.id === lineId) {
        const stage = e.target.getStage();
        if (!stage) return line;

        const pos = stage.getPointerPosition();
        if (!pos) return line;

        let newPoints = [...line.points];
        const distToStart = Math.hypot(
          pos.x - newPoints[0],
          pos.y - newPoints[1]
        );
        const distToEnd = Math.hypot(
          pos.x - newPoints[2],
          pos.y - newPoints[3]
        );

        if (distToStart < 10) {
          return {
            ...line,
            startShapeId: null,
            points: [pos.x, pos.y, newPoints[2], newPoints[3]],
          };
        } else if (distToEnd < 10) {
          return {
            ...line,
            endShapeId: null,
            points: [newPoints[0], newPoints[1], pos.x, pos.y],
          };
        }
      }
      return line;
    });

    setLines(updatedLines);
  };

  const handleLineMouseMove = (
    e: Konva.KonvaEventObject<MouseEvent>,
    lineId: string
  ) => {
    if (tool !== "select") return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    const [x1, y1, x2, y2] = line.points;
    const distToStart = Math.hypot(pos.x - x1, pos.y - y1);
    const distToEnd = Math.hypot(pos.x - x2, pos.y - y2);

    if (distToStart < 20) {
      setHoveredLineEnd(`${lineId}-start`);
    } else if (distToEnd < 20) {
      setHoveredLineEnd(`${lineId}-end`);
    } else {
      setHoveredLineEnd(null);
    }
  };

  const handleLineMouseLeave = () => {
    setHoveredLineEnd(null);
  };

  return (
    <>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}>
        <button onClick={() => setTool("select")}>Cursor</button>
        <select
          onChange={(e) => {
            setTool(e.target.value as Shape);
            setShape(e.target.value as Shape);
          }}
        >
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
        <button onClick={() => setTool("line")}>Line</button>
      </div>
      <Stage
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer ref={layerRef}>
          {shapes.map((shape) =>
            shape.type === "rect" ? (
              <Rect
                key={shape.id}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill={shape.fill}
                draggable
                onDragMove={(e) => handleDragMove(e, shape.id)}
              />
            ) : (
              <Circle
                key={shape.id}
                x={shape.x + (shape.radius || 0)}
                y={shape.y + (shape.radius || 0)}
                radius={shape.radius}
                fill={shape.fill}
                draggable
                onDragMove={(e) => handleDragMove(e, shape.id)}
              />
            )
          )}
          {lines.map((line) => (
            <React.Fragment key={line.id}>
              <Line
                points={line.points}
                stroke="black"
                strokeWidth={2}
                onClick={(e) => handleLineClick(e, line.id)}
                onMouseMove={(e) => handleLineMouseMove(e, line.id)}
                onMouseLeave={handleLineMouseLeave}
                onMouseDown={(e) => handleLineMouseDown(e, line.id)}
              />
              {hoveredLineEnd === `${line.id}-start` && (
                <Circle
                  x={line.points[0]}
                  y={line.points[1]}
                  radius={5}
                  fill="red"
                />
              )}
              {hoveredLineEnd === `${line.id}-end` && (
                <Circle
                  x={line.points[2]}
                  y={line.points[3]}
                  radius={5}
                  fill="red"
                />
              )}
            </React.Fragment>
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
