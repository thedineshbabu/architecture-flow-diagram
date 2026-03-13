declare module 'dagre' {
  interface GraphLabel {
    rankdir?: string;
    nodesep?: number;
    ranksep?: number;
  }

  interface NodeConfig {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
  }

  interface Graph {
    setGraph(label: GraphLabel): Graph;
    setDefaultEdgeLabel(cb: () => object): Graph;
    setNode(name: string, config: NodeConfig): void;
    setEdge(source: string, target: string): void;
    node(name: string): NodeConfig | undefined;
  }

  interface DagreModule {
    graphlib: {
      Graph: new () => Graph;
    };
    layout(g: Graph): void;
  }

  const dagre: DagreModule;
  export default dagre;
}
