import React, { useEffect, useRef } from "react";
import { Stage, Layer, Rect, Line, RegularPolygon } from "react-konva";
import Konva from "konva";
import { Tool, Shape } from "./types";
import { useShapes } from "./hooks/useShapes";
import { useLines } from "./hooks/useLines";

const App: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [tool, setTool] = React.useState<Tool>("select");
  const [shape, setShape] = React.useState<Shape>("rect");
  const [isDrawing, setIsDrawing] = React.useState(false);

  const { shapes, addShape, handleDragMove } = useShapes();

  const {
    lines,
    activeLine,
    hoveredLineEnd,
    startLine,
    updateActiveLine,
    finishLine,
    updateLineEndpoints,
    handleLineMouseDown,
    handleLineDragMove,
    handleLineDragEnd,
    handleLineClick,
    handleLineMouseMove,
    handleLineMouseLeave,
  } = useLines(shapes);

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

  const handleMouseDown = () => {
    if (!stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    if (tool === "select") {
      return;
    }

    setIsDrawing(true);

    if (tool === "line") {
      startLine(pos);
    } else {
      addShape(pos, shape);
    }
  };

  const handleMouseMove = () => {
    if (!stageRef.current) return;

    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    if (isDrawing && tool === "line") {
      updateActiveLine(pos);
    } else {
      handleLineDragMove(pos);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    if (tool === "line") {
      finishLine();
    }

    handleLineDragEnd();
  };

  return (
    <>
      <div className="toolbar">
        <button
          onClick={() => setTool("select")}
          className={tool === "select" ? "active" : ""}
        >
          Курсор
        </button>
        <select
          onChange={(e) => {
            setTool(e.target.value as Shape);
            setShape(e.target.value as Shape);
          }}
        >
          <option>Выбрать фигуру</option>
          <option value="rect">Квадрат</option>
          <option value="pentagon">Пятиугольник</option>
          <option value="hexagon">Шестиугольник</option>
        </select>
        <button
          onClick={() => setTool("line")}
          className={tool === "line" ? "active" : ""}
        >
          Линия
        </button>
      </div>
      <Stage
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        width={window.innerWidth}
        height={window.innerHeight}
      >
        <Layer ref={layerRef}>
          {shapes.map((shape) => {
            if (shape.type === "rect") {
              return (
                <Rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  draggable
                  onDragMove={(e) => {
                    handleDragMove(e, shape.id);
                    updateLineEndpoints(shape.id, e.target.x(), e.target.y());
                  }}
                />
              );
            } else {
              return (
                <RegularPolygon
                  key={shape.id}
                  x={shape.centerX}
                  y={shape.centerY}
                  sides={shape.type === "pentagon" ? 5 : 6}
                  radius={shape.width / 2}
                  fill={shape.fill}
                  draggable
                  onDragMove={(e) => {
                    const newX = e.target.x() - shape.width / 2;
                    const newY = e.target.y() - shape.height / 2;
                    handleDragMove(e, shape.id);
                    updateLineEndpoints(shape.id, newX, newY);
                  }}
                />
              );
            }
          })}
          {lines.map((line) => (
            <React.Fragment key={line.id}>
              <Line
                points={line.points}
                stroke="black"
                strokeWidth={5}
                onClick={(e) => handleLineClick(e, line.id)}
                onMouseMove={(e) => handleLineMouseMove(e, line.id)}
                onMouseLeave={handleLineMouseLeave}
                onMouseDown={(e) => handleLineMouseDown(e, line.id)}
              />
              {hoveredLineEnd === `${line.id}-start` && (
                <RegularPolygon
                  x={line.points[0]}
                  y={line.points[1]}
                  sides={3}
                  radius={7}
                  fill="red"
                />
              )}
              {hoveredLineEnd === `${line.id}-end` && (
                <RegularPolygon
                  x={line.points[2]}
                  y={line.points[3]}
                  sides={3}
                  radius={7}
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
