import Konva from "konva";

export type Tool = "select" | "rect" | "pentagon" | "hexagon" | "line";
export type Shape = "rect" | "pentagon" | "hexagon";

export interface ShapeData {
  id: string;
  type: Shape;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  points?: number[];
  centerX: number;
  centerY: number;
}

export interface LineData {
  id: string;
  points: number[];
  startShapeId: string | null;
  endShapeId: string | null;
}

export interface DraggedLineEnd {
  lineId: string;
  end: "start" | "end";
}

export type KonvaEventObject<T> = Konva.KonvaEventObject<T>;
