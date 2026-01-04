"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  ExternalLink,
  Server,
  Plus,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";

import type { Server as ServerType } from "@/lib/api";

import { AddSourceModal } from "@/components/add-source-modal";
import { ConnectionStatus } from "@/components/connection-status";
import {
  ConnectionTestToastContent,
  getToastType,
  getToastTitle,
} from "@/components/connection-test-toast";
import { EditServerDialog } from "@/components/edit-server-dialog";
import { IntegrationIcon } from "@/components/integration-icon";
import { TablePagination } from "@/components/table-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServers, useDeleteServer, useTestConnection } from "@/hooks/use-api";
import {
  useFitToViewport,
  useFitToViewportPagination,
} from "@/hooks/use-fit-to-viewport";
import { getIntegrationById, integrationCategories } from "@/lib/integrations";


// Fixed heights for layout calculations
const ROW_HEIGHT = 64; // Height of each table row
const HEADER_HEIGHT = 40; // Height of the table header
const CARD_HEADER_HEIGHT = 76; // Height of CardHeader
const PAGINATION_HEIGHT = 48;

function ServersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: servers, isLoading } = useServers();
  const deleteServer = useDeleteServer();
  const testConnection = useTestConnection();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<ServerType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [serverToEdit, setServerToEdit] = useState<ServerType | null>(null);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);

  // Handle edit param from URL (e.g., /sources?edit=server-id)
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && servers && !editDialogOpen) {
      const server = servers.find((s) => s.id === editId);
      if (server) {
        setServerToEdit(server);
        setEditDialogOpen(true);
        // Clear the URL param
        router.replace("/sources", { scroll: false });
      }
    }
  }, [searchParams, servers, editDialogOpen, router]);

  // Fit-to-viewport pagination
  const { containerRef, pageSize, isReady } = useFitToViewport<HTMLDivElement>({
    rowHeight: ROW_HEIGHT,
    headerHeight: HEADER_HEIGHT + CARD_HEADER_HEIGHT,
    paginationHeight: PAGINATION_HEIGHT,
    minRows: 3,
  });

  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  } = useFitToViewportPagination(servers || [], pageSize);

  const handleDelete = async () => {
    if (!serverToDelete) return;

    try {
      await deleteServer.mutateAsync(serverToDelete.id);
      toast.success(`Server "${serverToDelete.name}" deleted`);
      setDeleteDialogOpen(false);
      setServerToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete server"
      );
    }
  };

  const handleTestConnection = async (server: ServerType) => {
    setTestingServerId(server.id);
    try {
      const result = await testConnection.mutateAsync(server.id);
      const toastType = getToastType(result);
      const toastTitle = getToastTitle(result);

      const toastFn = toastType === "success" ? toast.success
        : toastType === "warning" ? toast.warning
        : toast.error;

      toastFn(toastTitle, {
        description: <ConnectionTestToastContent result={result} serverName={server.name} />,
        duration: toastType === "success" ? 5000 : 8000,
      });
    } catch (error) {
      toast.error("Connection Test Failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setTestingServerId(null);
    }
  };

  return (
    <Card ref={containerRef} className="flex flex-col flex-1 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
        <div>
          <CardTitle>Connected Sources</CardTitle>
          <CardDescription>
            View and manage your media server and service connections
          </CardDescription>
        </div>
        <AddSourceModal
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Source
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {isLoading || !isReady ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : servers && servers.length > 0 ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((server) => {
                    const integration = getIntegrationById(server.providerId);
                    return (
                      <TableRow key={server.id} style={{ height: ROW_HEIGHT }}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {integration ? (
                              <div
                                className="flex items-center justify-center w-10 h-10 rounded-lg"
                                style={{
                                  backgroundColor: `${integration.color}15`,
                                }}
                              >
                                <IntegrationIcon
                                  integration={integration}
                                  size="md"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                                <Server className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{server.name}</div>
                              {(server.serverName || server.version) && (
                                <div className="text-xs text-muted-foreground">
                                  {server.serverName && server.version
                                    ? `${server.serverName} v${server.version}`
                                    : server.serverName ||
                                      (server.version
                                        ? `v${server.version}`
                                        : "")}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const category = integration
                              ? integrationCategories.find(
                                  (c) => c.id === integration.category
                                )
                              : null;
                            return (
                              <Badge
                                variant="outline"
                                className="capitalize"
                                style={{
                                  borderColor: integration?.color || "#6B7280",
                                  color: integration?.color || "#6B7280",
                                }}
                              >
                                {category?.name || server.providerId}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <a
                            href={server.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            {new URL(server.url).host}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <ConnectionStatus
                            apiConnected={server.isConnected}
                            fileIngestionEnabled={server.fileIngestionEnabled}
                            fileIngestionConnected={server.fileIngestionConnected}
                            lastSeen={server.lastSeen}
                            lastFileSync={server.lastFileSync}
                            variant="badge"
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {server.lastSeen
                            ? formatDistanceToNow(new Date(server.lastSeen), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleTestConnection(server)}
                                disabled={testingServerId === server.id}
                              >
                                {testingServerId === server.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Test Connection
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setServerToEdit(server);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setServerToDelete(server);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onNextPage={nextPage}
                onPrevPage={prevPage}
                onFirstPage={firstPage}
                onLastPage={lastPage}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 rounded-lg border border-dashed m-6">
            <div className="text-center">
              <Server className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No sources configured
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first source to start collecting logs
              </p>
              <div className="mt-4">
                <AddSourceModal
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Source
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{serverToDelete?.name}
              &quot;? This action cannot be undone. All logs associated with
              this server will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteServer.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {serverToEdit && (
        <EditServerDialog
          server={serverToEdit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setServerToEdit(null);
          }}
        />
      )}
    </Card>
  );
}

export default function ServersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Server className="h-8 w-8 animate-pulse text-zinc-600" /></div>}>
      <ServersPageContent />
    </Suspense>
  );
}
