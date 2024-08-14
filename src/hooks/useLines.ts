import { useState } from "react";
import {
  LineData,
  ShapeData,
  DraggedLineEnd,
  KonvaEventObject,
} from "../types";
import { findNearestShape, isPointNearShape } from "../utils";

export const useLines = (shapes: ShapeData[]) => {
  const [lines, setLines] = useState<LineData[]>([]);
  const [activeLine, setActiveLine] = useState<number[] | null>(null);
  const [hoveredLineEnd, setHoveredLineEnd] = useState<string | null>(null);
  const [draggedLineEnd, setDraggedLineEnd] = useState<DraggedLineEnd | null>(
    null
  );

  const startLine = (pos: { x: number; y: number }) => {
    setActiveLine([pos.x, pos.y, pos.x, pos.y]);
  };

  const updateActiveLine = (pos: { x: number; y: number }) => {
    if (activeLine) {
      setActiveLine([activeLine[0], activeLine[1], pos.x, pos.y]);
    }
  };

  const finishLine = () => {
    if (activeLine) {
      attachLineToShapes();
    }
  };

  const attachLineToShapes = () => {
    if (!activeLine) return;

    const [x1, y1, x2, y2] = activeLine;
    let startShape: ShapeData | null = null;
    let endShape: ShapeData | null = null;

    for (const shape of shapes) {
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
        startShape ? startShape.x + (startShape.width || 0) / 2 : x1,
        startShape ? startShape.y + (startShape.height || 0) / 2 : y1,
        endShape ? endShape.x + (endShape.width || 0) / 2 : x2,
        endShape ? endShape.y + (endShape.height || 0) / 2 : y2,
      ],
      startShapeId: startShape?.id || null,
      endShapeId: endShape?.id || null,
    };

    setLines([...lines, newLine]);
    setActiveLine(null);
  };

  const updateLineEndpoints = (shapeId: string, x: number, y: number) => {
    const updatedLines = lines.map((line) => {
      const updatedPoints = [...line.points];
      const shape = shapes.find((s) => s.id === shapeId);
      if (!shape) return line;

      const centerX = shape.centerX;
      const centerY = shape.centerY;

      if (line.startShapeId === shapeId) {
        updatedPoints[0] = centerX;
        updatedPoints[1] = centerY;
      }
      if (line.endShapeId === shapeId) {
        updatedPoints[2] = centerX;
        updatedPoints[3] = centerY;
      }
      return { ...line, points: updatedPoints };
    });
    setLines(updatedLines);
  };

  const handleLineMouseDown = (
    e: KonvaEventObject<MouseEvent>,
    lineId: string
  ) => {
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

  const handleLineDragMove = (pos: { x: number; y: number }) => {
    if (draggedLineEnd) {
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

  const handleLineDragEnd = () => {
    if (draggedLineEnd) {
      const updatedLines = lines.map((line) => {
        if (line.id === draggedLineEnd.lineId) {
          const [x, y] =
            draggedLineEnd.end === "start"
              ? [line.points[0], line.points[1]]
              : [line.points[2], line.points[3]];
          const attachedShape = findNearestShape(x, y, shapes);
          if (attachedShape) {
            const newPoints = [...line.points];
            const centerX = attachedShape.x + (attachedShape.width || 0) / 2;
            const centerY = attachedShape.y + (attachedShape.height || 0) / 2;
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

  const handleLineClick = (e: KonvaEventObject<MouseEvent>, lineId: string) => {
    const updatedLines = lines.map((line) => {
      if (line.id === lineId) {
        const stage = e.target.getStage();
        if (!stage) return line;

        const pos = stage.getPointerPosition();
        if (!pos) return line;

        const newPoints = [...line.points];
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
    e: KonvaEventObject<MouseEvent>,
    lineId: string
  ) => {
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
      setHoveredLineEnd(`${lineId}-start`);
    } else if (distToEnd < 10) {
      setHoveredLineEnd(`${lineId}-end`);
    } else {
      setHoveredLineEnd(null);
    }
  };

  const handleLineMouseLeave = () => {
    setHoveredLineEnd(null);
  };

  return {
    lines,
    activeLine,
    hoveredLineEnd,
    draggedLineEnd,
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
  };
};
