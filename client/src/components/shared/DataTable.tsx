import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, Download, FileSpreadsheet, FileText, Columns, Check, Printer,
} from 'lucide-react';
import { downloadAsCSV, downloadAsWord, downloadAsPowerPoint, printReport } from '@/lib/export';

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: string;
  isLoading?: boolean;
  pageSize?: number;
  showExport?: boolean;
  showExportBox?: boolean;
  exportTitle?: string;
  showColumnToggle?: boolean;
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
}

export default function DataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  isLoading = false,
  pageSize = 20,
  showExport = false,
  showExportBox = false,
  exportTitle = 'report',
  showColumnToggle = false,
  toolbar,
  emptyState,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColumns, setShowColumns] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const getExportData = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original);
    return rows.length > 0 ? rows : data;
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <span>Show</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border rounded px-1.5 py-1 text-xs bg-background"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {toolbar}

          {showColumnToggle && (
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowColumns(!showColumns)}>
                <Columns className="h-3.5 w-3.5 mr-1.5" />
                Columns
              </Button>
              {showColumns && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-xl z-50 py-1">
                  {table.getAllLeafColumns().map((col) => (
                    <button
                      key={col.id}
                      onClick={() => col.toggleVisibility()}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                    >
                      <div className={cn(
                        'w-3.5 h-3.5 rounded border flex items-center justify-center',
                        col.getIsVisible() ? 'bg-primary border-primary' : 'border-input'
                      )}>
                        {col.getIsVisible() && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <span className="capitalize">{col.id.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(showExportBox || showExport) && (
            <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/20">
              <span className="text-[11px] font-semibold text-muted-foreground px-1.5">Export:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-50"
                onClick={() => downloadAsWord(getExportData(), `${exportTitle}.doc`, exportTitle)}
                title="Export to Word"
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Word
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                onClick={() => downloadAsCSV(getExportData(), `${exportTitle}.csv`)}
                title="Export to Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50"
                onClick={() => downloadAsPowerPoint(getExportData(), `${exportTitle}.ppt`, exportTitle)}
                title="Export to PowerPoint"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                PowerPoint
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-700 hover:bg-red-50"
                onClick={() => printReport(getExportData(), exportTitle)}
                title="PDF / Print"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print / PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn(
                          'flex items-center gap-1',
                          header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </span>
                        )}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  {emptyState || (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No results found</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length > 0 ? (
            <>
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length}
            </>
          ) : (
            '0 results'
          )}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 text-xs font-medium">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
