import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { router } from "@inertiajs/react";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from "./data-table-view-options";

declare let route: (name: string, params?: Record<string, unknown> | string | number) => string;

type InertiaGetPayload = NonNullable<Parameters<typeof router.get>[1]>;

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        next_page_url: string | null;
        prev_page_url: string | null;
        from: number;
        to: number;
    };
    filters?: Record<string, unknown>;
    routeName?: string;
    isLoading?: boolean;
}

export function DataTable<TData, TValue>({ columns, data, pagination, filters = {}, routeName, isLoading = false }: DataTableProps<TData, TValue>) {
    const isServerSide = !!routeName;

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [internalLoading, setInternalLoading] = React.useState(false);

    const showLoading = isLoading || internalLoading;

    const visitTable = React.useCallback(
        (query: InertiaGetPayload) => {
            if (!routeName) return;

            router.cancelAll();

            router.get(route(routeName), query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["classes", "filters"],
                onStart: () => setInternalLoading(true),
                onFinish: () => setInternalLoading(false),
            });
        },
        [routeName],
    );

    React.useEffect(() => {
        if (!isServerSide) return;

        const urlParams = new URLSearchParams(window.location.search);
        const sort = urlParams.get("sort");
        const direction = urlParams.get("direction");
        if (sort) {
            setSorting([{ id: sort, desc: direction === "desc" }]);
        }
    }, [isServerSide]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: isServerSide,
        manualSorting: isServerSide,
        pageCount: pagination?.last_page ?? -1,
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: isServerSide
            ? (updater) => {
                  const newSorting = typeof updater === "function" ? updater(sorting) : updater;
                  setSorting(newSorting);

                  if (newSorting.length > 0) {
                      const { id, desc } = newSorting[0];
                      visitTable({ ...filters, sort: id, direction: desc ? "desc" : "asc", page: 1 });
                  } else {
                      visitTable({ ...filters, sort: null, direction: null, page: 1 });
                  }
              }
            : setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: isServerSide
            ? (updater) => {
                  const currentPaginationState = {
                      pageIndex: pagination ? pagination.current_page - 1 : 0,
                      pageSize: pagination ? pagination.per_page : 10,
                  };

                  const nextState = typeof updater === "function" ? updater(currentPaginationState) : updater;

                  if (nextState.pageIndex !== currentPaginationState.pageIndex || nextState.pageSize !== currentPaginationState.pageSize) {
                      visitTable({
                          ...filters,
                          page: nextState.pageIndex + 1,
                          per_page: nextState.pageSize,
                      });
                  }
              }
            : undefined,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            ...(isServerSide && {
                pagination: {
                    pageIndex: pagination ? pagination.current_page - 1 : 0,
                    pageSize: pagination ? pagination.per_page : 10,
                },
            }),
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <DataTableViewOptions table={table} />
            </div>
            <div className="relative overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className={cn(showLoading && "opacity-60 transition-opacity")}>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (
                                            target.closest("button") ||
                                            target.closest('[role="checkbox"]') ||
                                            target.closest("a") ||
                                            target.closest('[role="menu"]')
                                        ) {
                                            return;
                                        }

                                        const classRow = row.original as { id?: number };
                                        if (classRow?.id) {
                                            router.visit(route("administrators.classes.show", { class: classRow.id }));
                                        }
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center">
                                    <p className="font-medium">No classes found</p>
                                    <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {showLoading && (
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-3">
                        <span className="bg-background/90 text-muted-foreground rounded-full border px-3 py-1 text-xs shadow-sm">Updating…</span>
                    </div>
                )}
            </div>
            <DataTablePagination table={table} pagination={pagination} isLoading={showLoading} />
        </div>
    );
}
