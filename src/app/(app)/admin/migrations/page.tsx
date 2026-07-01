"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchFocusBatchSample,
  fetchFocusBatchSummary,
  fetchFocusDatabaseNames,
  fetchFocusImportRuns,
  fetchFocusMigrationOverview,
  fetchFocusRawCatalog,
  type FocusBatchTableSummary,
  type FocusImportRun,
  type FocusMigrationOverview,
  type FocusRawCatalogEntry,
} from "@/lib/data/focus-migrations";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yyyy HH:mm");
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: FocusImportRun["status"] }) {
  if (status === "completed") return <Badge variant="default">Completed</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="secondary">Running</Badge>;
}

const runColumns: ColumnDef<FocusImportRun>[] = [
  {
    accessorKey: "started_at",
    header: "Started",
    cell: ({ row }) => formatWhen(row.original.started_at),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  { accessorKey: "server_name", header: "Focus server" },
  {
    id: "databases",
    header: "Databases",
    cell: ({ row }) => row.original.databases.join(", ") || "—",
  },
  { accessorKey: "tables_synced", header: "Tables" },
  {
    accessorKey: "rows_synced",
    header: "Rows reported",
    cell: ({ row }) => row.original.rows_synced.toLocaleString(),
  },
  {
    accessorKey: "finished_at",
    header: "Finished",
    cell: ({ row }) => formatWhen(row.original.finished_at),
  },
];

function catalogColumns(
  onViewSample: (entry: FocusRawCatalogEntry) => void,
  runId: string | null
): ColumnDef<FocusRawCatalogEntry>[] {
  return [
    { accessorKey: "database_name", header: "Database" },
    {
      id: "full_name",
      header: "Table",
      cell: ({ row }) => `${row.original.schema_name}.${row.original.table_name}`,
    },
    {
      accessorKey: "approx_row_count",
      header: "Approx rows",
      cell: ({ row }) => row.original.approx_row_count.toLocaleString(),
    },
    {
      accessorKey: "columns",
      header: "Columns",
      cell: ({ row }) => row.original.columns.length,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        runId ? (
          <Button variant="ghost" size="sm" onClick={() => onViewSample(row.original)}>
            Sample
          </Button>
        ) : null,
    },
  ];
}

function syncedColumns(
  onViewSample: (row: FocusBatchTableSummary) => void
): ColumnDef<FocusBatchTableSummary>[] {
  return [
    { accessorKey: "database_name", header: "Database" },
    {
      id: "full_name",
      header: "Table",
      cell: ({ row }) => `${row.original.schema_name}.${row.original.table_name}`,
    },
    { accessorKey: "batch_count", header: "Batches" },
    {
      accessorKey: "row_count",
      header: "Rows copied",
      cell: ({ row }) => row.original.row_count.toLocaleString(),
    },
    {
      accessorKey: "last_imported_at",
      header: "Imported",
      cell: ({ row }) => formatWhen(row.original.last_imported_at),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onViewSample(row.original)}>
          Sample
        </Button>
      ),
    },
  ];
}

export default function MigrationsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<FocusMigrationOverview | null>(null);
  const [runs, setRuns] = useState<FocusImportRun[]>([]);
  const [catalog, setCatalog] = useState<FocusRawCatalogEntry[]>([]);
  const [synced, setSynced] = useState<FocusBatchTableSummary[]>([]);
  const [databases, setDatabases] = useState<string[]>([]);
  const [databaseFilter, setDatabaseFilter] = useState<string>("all");
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [sampleJson, setSampleJson] = useState<string | null>(null);
  const [sampleTitle, setSampleTitle] = useState("");

  const latestRunId = overview?.latest_run?.id ?? runs[0]?.id ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    const [ov, runRes, dbRes] = await Promise.all([
      fetchFocusMigrationOverview(),
      fetchFocusImportRuns(),
      fetchFocusDatabaseNames(),
    ]);

    if (ov.error) toast.error(ov.error);
    if (runRes.error) toast.error(runRes.error);

    const nextOverview = ov.data ?? null;
    const nextRuns = runRes.data ?? [];
    setOverview(nextOverview);
    setRuns(nextRuns);
    setDatabases(dbRes.data ?? []);

    const runId = selectedRunId || nextOverview?.latest_run?.id || nextRuns[0]?.id || "";
    if (runId && !selectedRunId) setSelectedRunId(runId);

    const catalogRes = await fetchFocusRawCatalog(
      databaseFilter === "all" ? undefined : databaseFilter
    );
    if (catalogRes.error) toast.error(catalogRes.error);
    setCatalog(catalogRes.data ?? []);

    if (runId) {
      const summaryRes = await fetchFocusBatchSummary(runId);
      if (summaryRes.error) toast.error(summaryRes.error);
      setSynced(summaryRes.data ?? []);
    } else {
      setSynced([]);
    }

    setLoading(false);
  }, [databaseFilter, selectedRunId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onViewCatalogSample = async (entry: FocusRawCatalogEntry) => {
    const runId = selectedRunId || latestRunId;
    if (!runId) return;
    const res = await fetchFocusBatchSample({
      runId,
      database: entry.database_name,
      table: entry.table_name,
      schema: entry.schema_name,
    });
    if (res.error || !res.data) {
      toast.error(res.error ?? "No sample for this table in the selected run");
      return;
    }
    setSampleTitle(`${entry.database_name}.${entry.schema_name}.${entry.table_name}`);
    setSampleJson(JSON.stringify(res.data, null, 2));
  };

  const onViewSyncedSample = async (row: FocusBatchTableSummary) => {
    const runId = selectedRunId || latestRunId;
    if (!runId) return;
    const res = await fetchFocusBatchSample({
      runId,
      database: row.database_name,
      table: row.table_name,
      schema: row.schema_name,
    });
    if (res.error || !res.data) {
      toast.error(res.error ?? "No sample available");
      return;
    }
    setSampleTitle(`${row.database_name}.${row.schema_name}.${row.table_name}`);
    setSampleJson(JSON.stringify(res.data, null, 2));
  };

  const catalogCols = useMemo(
    () => catalogColumns(onViewCatalogSample, selectedRunId || latestRunId),
    [selectedRunId, latestRunId]
  );

  const syncedCols = useMemo(() => syncedColumns(onViewSyncedSample), [selectedRunId, latestRunId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Migrations"
        description="Focus v6 data fetched from the on-premise server into Supabase staging (raw backup before ERP mapping)"
        action={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {!overview?.staging_ready && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-base">Staging tables not found</CardTitle>
            <CardDescription>
              Apply migration <code className="text-xs">0014_focus_raw_staging.sql</code> on Supabase,
              then run the <code className="text-xs">focus-data-fetch</code> job on the Focus server.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest job</CardDescription>
            <CardTitle className="text-lg">
              {overview?.latest_run ? (
                <StatusBadge status={overview.latest_run.status} />
              ) : (
                "No runs yet"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {overview?.latest_run
              ? formatWhen(overview.latest_run.started_at)
              : "Run focus-data-fetch on the Focus server"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Focus databases</CardDescription>
            <CardTitle className="text-2xl">{overview?.total_databases ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">In table catalog</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tables discovered</CardDescription>
            <CardTitle className="text-2xl">{overview?.total_catalog_tables ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">focus_raw_catalog</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rows in Supabase</CardDescription>
            <CardTitle className="text-2xl">
              {(overview?.total_rows_in_batches ?? 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {overview?.total_batches ?? 0} batches in focus_raw_batches
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import run</CardTitle>
          <CardDescription>View synced tables for a specific fetch job</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRunId} onValueChange={setSelectedRunId}>
            <SelectTrigger className="max-w-xl">
              <SelectValue placeholder="Select import run" />
            </SelectTrigger>
            <SelectContent>
              {runs.map((run) => (
                <SelectItem key={run.id} value={run.id}>
                  {formatWhen(run.started_at)} — {run.status} — {run.databases.join(", ") || "explore"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {overview?.latest_run?.error_message && (
            <p className="mt-3 text-sm text-destructive">{overview.latest_run.error_message}</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Import runs</TabsTrigger>
          <TabsTrigger value="catalog">Table catalog</TabsTrigger>
          <TabsTrigger value="synced">Synced data</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable columns={runColumns} data={runs} searchKey="server_name" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={databaseFilter} onValueChange={setDatabaseFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Database" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All databases</SelectItem>
                {databases.map((db) => (
                  <SelectItem key={db} value={db}>
                    {db}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={catalogCols}
                data={catalog}
                searchKey="table_name"
                searchPlaceholder="Search table name..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synced" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tables with copied rows</CardTitle>
              <CardDescription>
                Data copied in the selected import run. Mapping into Sales / Inventory modules is a
                later step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={syncedCols}
                data={synced}
                searchKey="table_name"
                searchPlaceholder="Search table..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={sampleJson != null} onOpenChange={(open) => !open && setSampleJson(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Sample rows — {sampleTitle}</DialogTitle>
            <DialogDescription>First batch from the selected import run (raw JSON)</DialogDescription>
          </DialogHeader>
          <pre className="flex-1 overflow-auto rounded-md bg-muted p-4 text-xs">{sampleJson}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
