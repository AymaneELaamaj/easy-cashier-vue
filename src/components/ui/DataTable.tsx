import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    size: number;
    total: number;
    onPageChange: (page: number) => void;
    onSizeChange: (size: number) => void;
  };
  searchable?: boolean;
  onSearch?: (query: string) => void;
  sortable?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  searchable = false,
  onSearch,
  sortable = false,
  onSort,
  className
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSort = (column: string) => {
    if (!sortable || !onSort) return;

    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort(column, newDirection);
  };

  const LoadingRow = () => (
    <TableRow className="hover:bg-transparent">
      {columns.map((column, index) => (
        <TableCell key={index}>
          <div className="animate-pulse bg-muted h-4 w-full rounded" />
        </TableCell>
      ))}
    </TableRow>
  );

  const EmptyRow = () => (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-lg font-medium">Aucune donnée disponible</div>
          <div className="text-sm">Aucun résultat ne correspond à votre recherche</div>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barre de recherche et filtres */}
      {searchable && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button variant="outline" size="sm" className="hover:bg-muted">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b bg-muted/50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    'font-semibold text-foreground',
                    column.className,
                    column.sortable && sortable && 
                    'cursor-pointer select-none transition-colors hover:bg-muted/70 active:bg-muted'
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortable && sortColumn === column.key && (
                      <span className="text-xs font-bold text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow key={index} />
              ))
            ) : data.length === 0 ? (
              <EmptyRow />
            ) : (
              data.map((row, index) => (
                <TableRow 
                  key={index} 
                  className={cn(
                    "transition-colors border-b last:border-b-0",
                    "hover:bg-muted/30 hover:shadow-sm",
                    "focus-within:bg-muted/50 focus-within:shadow-md",
                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                  )}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={column.key} 
                      className={cn(
                        "py-3 px-4 transition-colors",
                        column.className
                      )}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key] || '-'
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2 py-4 bg-card rounded-lg border">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground font-medium">
              Lignes par page:
            </p>
            <Select
              value={pagination.size.toString()}
              onValueChange={(value) => pagination.onSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4">
            <p className="text-sm text-muted-foreground font-medium">
              Page {pagination.page + 1} sur {Math.ceil(pagination.total / pagination.size) || 1}
            </p>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
                className="h-8 w-8 p-0 hover:bg-muted disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Page précédente</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.size) - 1}
                className="h-8 w-8 p-0 hover:bg-muted disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Page suivante</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;