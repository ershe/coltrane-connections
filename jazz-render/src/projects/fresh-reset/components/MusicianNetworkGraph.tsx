import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import type {
  MusicianGraphData,
  MusicianLink,
  MusicianNode,
  MusicianRole,
} from "../types/network";

export const ROLE_COLORS: Record<MusicianRole, string> = {
  Saxophone: "#f59e0b",
  Trumpet: "#38bdf8",
  Piano: "#a78bfa",
  Bass: "#34d399",
  Drums: "#fb7185",
  Trombone: "#fb923c",
  Other: "#94a3b8",
};

interface MusicianNetworkGraphProps {
  graphData: MusicianGraphData;
  selectedNodeId?: string | null;
  onSelectNode?: (node: MusicianNode | null) => void;
}

interface DisposableResources {
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
  textures: Set<THREE.Texture>;
}

export default function MusicianNetworkGraph({
  graphData,
  selectedNodeId,
  onSelectNode,
}: MusicianNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<
    ForceGraphMethods<MusicianNode, MusicianLink> | undefined
  >(undefined);
  const resourcesRef = useRef<DisposableResources>({
    geometries: new Set(),
    materials: new Set(),
    textures: new Set(),
  });

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });
  const [hoveredNode, setHoveredNode] = useState<MusicianNode | null>(null);

  const disposeResources = useCallback(() => {
    const { geometries, materials, textures } = resourcesRef.current;
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    geometries.clear();
    materials.clear();
    textures.clear();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    const chargeForce = fg.d3Force("charge") as
      | { strength: (value: number) => void }
      | undefined;
    if (chargeForce) {
      chargeForce.strength(-190);
    }

    const linkForce = fg.d3Force("link") as
      | { distance: (value: number) => void }
      | undefined;
    if (linkForce) {
      linkForce.distance(90);
    }
  }, [graphData]);

  useEffect(() => {
    return () => {
      disposeResources();
    };
  }, [disposeResources, graphData]);

  const buildNodeObject = useCallback(
    (node: MusicianNode): THREE.Object3D => {
      const group = new THREE.Group();
      const isSelected = selectedNodeId === node.id;
      const radius = node.isColtrane
        ? 7.5
        : Math.min(6.2, 3.2 + node.sessionCount * 0.75);

      const geometry = new THREE.SphereGeometry(radius, 24, 24);
      const colorHex = ROLE_COLORS[node.role];
      const material = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: isSelected ? 0.65 : node.isColtrane ? 0.45 : 0.22,
        roughness: 0.35,
        metalness: 0.25,
      });

      resourcesRef.current.geometries.add(geometry);
      resourcesRef.current.materials.add(material);

      const sphere = new THREE.Mesh(geometry, material);
      group.add(sphere);

      const label = new SpriteText(node.name);
      label.color = isSelected || node.isColtrane ? "#f8fafc" : "#cbd5e1";
      label.textHeight = node.isColtrane ? 4.2 : 3.2;
      label.fontFace = "JetBrains Mono Variable, monospace";
      label.backgroundColor = "rgba(15, 23, 42, 0.72)";
      label.padding = 1.6;
      label.borderRadius = 2;
      label.position.set(0, radius + 5.5, 0);

      const spriteMaterial = label.material as THREE.SpriteMaterial;
      resourcesRef.current.materials.add(spriteMaterial);
      if (spriteMaterial.map) {
        resourcesRef.current.textures.add(spriteMaterial.map);
      }

      group.add(label);
      return group;
    },
    [selectedNodeId],
  );

  const handleNodeClick = useCallback(
    (node: MusicianNode) => {
      onSelectNode?.(node);

      const fg = graphRef.current;
      if (!fg) return;

      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const z = node.z ?? 0;
      const distance = 110;
      const distRatio = 1 + distance / Math.hypot(x, y, z || 1);

      fg.cameraPosition(
        { x: x * distRatio, y: y * distRatio, z: z * distRatio },
        { x, y, z },
        800,
      );
    },
    [onSelectNode],
  );

  const handleNodeHover = useCallback((node: MusicianNode | null) => {
    setHoveredNode(node);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? "pointer" : "grab";
    }
  }, []);

  const getLinkWidth = useCallback((link: MusicianLink): number => {
    return Math.min(3.5, 0.8 + link.weight * 0.65);
  }, []);

  const getLinkParticles = useCallback((link: MusicianLink): number => {
    return Math.min(4, link.weight);
  }, []);

  const getLinkParticleSpeed = useCallback((link: MusicianLink): number => {
    return 0.003 + Math.min(link.weight, 4) * 0.0012;
  }, []);

  const getLinkColor = useCallback((link: MusicianLink): string => {
    return link.weight > 1
      ? "rgba(245, 158, 11, 0.5)"
      : "rgba(148, 163, 184, 0.28)";
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[540px] sm:h-[620px] rounded-xl overflow-hidden border border-border bg-slate-950"
    >
      <ForceGraph3D<MusicianNode, MusicianLink>
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#020617"
        nodeThreeObject={buildNodeObject}
        nodeThreeObjectExtend={false}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onBackgroundClick={() => onSelectNode?.(null)}
        linkWidth={getLinkWidth}
        linkColor={getLinkColor}
        linkDirectionalParticles={getLinkParticles}
        linkDirectionalParticleWidth={1.8}
        linkDirectionalParticleSpeed={getLinkParticleSpeed}
        cooldownTicks={120}
      />

      {hoveredNode ? (
        <div className="pointer-events-none absolute top-3 left-3 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-lg backdrop-blur">
          <div className="font-semibold">{hoveredNode.name}</div>
          <div className="text-slate-300">
            {hoveredNode.role} &middot; {hoveredNode.sessionCount}{" "}
            {hoveredNode.sessionCount === 1 ? "session" : "sessions"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
