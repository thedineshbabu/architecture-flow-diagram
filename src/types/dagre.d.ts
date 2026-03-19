declare module 'dagre' {
  export const graphlib: {
    Graph: new () => Graph;
  };
  export function layout(graph: Graph): void;

  interface Graph {
    setDefaultEdgeLabel(fn: () => Record<string, unknown>): Graph;
    setGraph(opts: Record<string, unknown>): void;
    setNode(id: string, opts: { width: number; height: number }): void;
    setEdge(source: string, target: string): void;
    node(id: string): { x: number; y: number; width: number; height: number } | undefined;
  }
}
