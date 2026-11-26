import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMusicianNetworkData } from "@/projects/fresh-reset/hooks/useMusicianNetworkData";
import MusicianNetworkGraph, {
  ROLE_COLORS,
} from "@/projects/fresh-reset/components/MusicianNetworkGraph";
import type {
  MusicianNode,
  MusicianRole,
  RawNetworkData,
} from "@/projects/fresh-reset/types/network";

export default function FreshProject() {
  const [rawData, setRawData] = useState<RawNetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MusicianNode | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNetwork() {
      try {
        setIsLoading(true);
        const response = await fetch("/data/network.json");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json: RawNetworkData = await response.json();
        if (!cancelled) {
          setRawData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load network data",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadNetwork();
    return () => {
      cancelled = true;
    };
  }, []);

  const graphData = useMusicianNetworkData(rawData);
  const roles = Object.keys(ROLE_COLORS) as MusicianRole[];

  return (
    <section className="flex flex-col gap-6 max-w-7xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            3D Musician Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Coltrane Collaborator Connections
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Interactive 3D force-directed network of musicians who recorded with
            John Coltrane and with one another ({graphData.nodes.length}{" "}
            musicians, {graphData.links.length} connections).
          </p>
        </div>

        <Link
          to="/archive"
          className="text-xs sm:text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80 shrink-0"
        >
          View Archived Timeline &rarr;
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {roles.map((role) => (
          <div
            key={role}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: ROLE_COLORS[role] }}
            />
            <span>{role}</span>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load network data: {error}
        </div>
      ) : isLoading ? (
        <div className="flex h-[540px] items-center justify-center rounded-xl border border-border bg-slate-950 text-sm text-slate-300">
          Loading 3D musician network...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <div className="lg:col-span-3">
            <MusicianNetworkGraph
              graphData={graphData}
              selectedNodeId={selectedNode?.id ?? null}
              onSelectNode={setSelectedNode}
            />
          </div>

          <aside className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Musician Details
            </h2>
            {selectedNode ? (
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <div className="text-lg font-bold">{selectedNode.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedNode.instruments.join(", ") || "Unknown instrument"}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ROLE_COLORS[selectedNode.role] }}
                  />
                  <span>{selectedNode.role}</span>
                  <span>&middot;</span>
                  <span>
                    {selectedNode.sessionCount}{" "}
                    {selectedNode.sessionCount === 1 ? "session" : "sessions"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click any musician node in the 3D graph to inspect their
                instruments, role, and session count.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
