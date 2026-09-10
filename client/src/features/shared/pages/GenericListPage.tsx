import { useState, useEffect } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Download } from 'lucide-react';
import api from '@/api/client';
import { downloadAsCSV, flattenObject } from '@/lib/export';
import { useUIStore } from '@/store';

interface GenericListPageProps {
  title: string;
  description: string;
  columns?: ColumnDef<any, any>[];
  data?: any[];
  apiEndpoint?: string;
  searchPlaceholder?: string;
}

export default function GenericListPage({ 
  title, 
  description, 
  columns = [], 
  data: initialData = [], 
  apiEndpoint,
  searchPlaceholder = "Search records..." 
}: GenericListPageProps) {
  const { academicYearId } = useUIStore();
  const [data, setData] = useState<any[]>(initialData);
  const [isLoading, setIsLoading] = useState(!!apiEndpoint);

  useEffect(() => {
    if (apiEndpoint) {
      setIsLoading(true);
      api.get(apiEndpoint, {
        params: {
          academicYearId: academicYearId || undefined
        }
      })
        .then(res => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setData(res.data.data);
          }
        })
        .catch(err => console.error(`Failed to fetch ${apiEndpoint}`, err))
        .finally(() => setIsLoading(false));
    }
  }, [apiEndpoint, academicYearId]);

  const handleExport = () => {
    const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`;
    downloadAsCSV(data, filename);
  };

  // Generate default columns from the first row of data if no columns are provided
  const generateDynamicColumns = (): ColumnDef<any, any>[] => {
    if (data.length === 0) return [{ accessorKey: 'id', header: 'ID' }];
    
    // Flatten the first item to get all possible nested keys
    const flattened = flattenObject(data[0]);
    const keys = Object.keys(flattened).slice(0, 8); // Limit to first 8 columns to avoid horizontal overflow
    
    return keys.map(key => ({
      accessorFn: (row: any) => {
        const flatRow = flattenObject(row);
        return flatRow[key];
      },
      id: key,
      header: key.split('.').map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' '),
    }));
  };

  const activeColumns = columns.length > 0 ? columns : generateDynamicColumns();

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description}>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading || data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {isLoading ? "Loading..." : "Export Report"}
        </Button>
      </PageHeader>
      
      <DataTable
        columns={activeColumns}
        data={data}
        searchPlaceholder={searchPlaceholder}
        showExportBox={true}
        exportTitle={title}
      />
    </div>
  );
}
