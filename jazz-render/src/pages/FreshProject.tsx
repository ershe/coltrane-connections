import { Link } from "react-router";
import { FRESH_PROJECT_DATA } from "@/projects/fresh-reset/data/projectData";

export default function FreshProject() {
  return (
    <section className="flex flex-col gap-6 max-w-4xl mx-auto py-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Fresh Reset
        </span>
        <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
        <p className="text-muted-foreground">
          This workspace is a clean slate, completely independent from the
          archived Coltrane Sessions timeline data.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        {FRESH_PROJECT_DATA.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              No data loaded yet. Add your new project&apos;s data in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                src/projects/fresh-reset/data/projectData.ts
              </code>{" "}
              and build out this page.
            </p>
            <div>
              <Link
                to="/archive"
                className="text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80"
              >
                View Archived Coltrane Sessions &rarr;
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
