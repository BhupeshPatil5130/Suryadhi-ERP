import { useState, useEffect } from 'react';
import api from '@/api/client';

import { type ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatCard from '@/components/shared/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, IndianRupee, Wallet, FileText, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface SOARecord {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: string;
}

const columns: ColumnDef<SOARecord, any>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ getValue }) => <span className="text-sm">{formatDate(getValue() as string)}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => <Badge variant="outline" className="text-xs uppercase tracking-wider">{getValue() as string}</Badge>,
  },
  {
    accessorKey: 'description',
    header: 'Particulars',
    cell: ({ row }) => (
      <div>
        <span className="text-sm">{row.original.description}</span>
      </div>
    ),
  },
  {
    accessorKey: 'debit',
    header: () => <div className="text-right">Debit / Invoice (₹)</div>,
    cell: ({ getValue }) => {
      const val = getValue() as number;
      return val > 0 ? (
        <div className="flex items-center justify-end gap-1 text-destructive font-mono">
          {formatCurrency(val)} <ArrowUpRight className="h-3 w-3" />
        </div>
      ) : <div className="text-right text-muted-foreground">—</div>;
    },
  },
  {
    accessorKey: 'credit',
    header: () => <div className="text-right">Credit / Receipt (₹)</div>,
    cell: ({ getValue }) => {
      const val = getValue() as number;
      return val > 0 ? (
        <div className="flex items-center justify-end gap-1 text-emerald-600 font-mono">
          {formatCurrency(val)} <ArrowDownRight className="h-3 w-3" />
        </div>
      ) : <div className="text-right text-muted-foreground">—</div>;
    },
  },
  {
    accessorKey: 'balance',
    header: () => <div className="text-right font-bold text-foreground">Balance (₹)</div>,
    cell: ({ getValue }) => <div className="text-right font-mono font-bold">{formatCurrency(getValue() as number)}</div>,
  },
];

export default function SOASummaryPage() {
  const [data, setData] = useState<SOARecord[]>([]);
  const [stats, setStats] = useState({
    feesReceivable: 0,
    feesCollected: 0,
    feesDue: 0,
    royaltyDue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState('');

  const fetchSOA = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/soa/summary', { params: { month: month || undefined } });
      if (res.data.success) {
        setStats(res.data.data.feeRoyaltyStatement);
        
        const apiData = res.data.data.soaEntries.map((item: any) => ({
          id: item.id,
          date: item.entryDate,
          description: item.particulars,
          debit: parseFloat(item.invoiceAmount) || 0,
          credit: parseFloat(item.receiptAmount) || 0,
          balance: parseFloat(item.balance) || 0,
          type: item.entryType,
        }));
        setData(apiData);
      }
    } catch (error) {
      console.error('Failed to fetch SOA', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSOA();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statement of Account (SOA)"
        description="Track all financial transactions, fee dues, payments, and royalty dues"
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Fees Billed" value={formatCurrency(stats.feesReceivable)} icon={FileText} color="blue" />
        <StatCard title="Total Collected" value={formatCurrency(stats.feesCollected)} icon={Wallet} color="green" />
        <StatCard title="Total Fee Outstanding" value={formatCurrency(stats.feesDue)} icon={IndianRupee} color="red" />
        <StatCard title="Royalty Due" value={formatCurrency(stats.royaltyDue)} icon={IndianRupee} color="violet" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground">Select Month (Optional Filter)</label>
              <Input type="month" className="h-10" value={month} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonth(e.target.value)} />
            </div>
            
            <Button className="w-full sm:w-auto h-10" onClick={fetchSOA} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Generate Statement
            </Button>
          </div>

          <div className="p-4">
            <DataTable
              columns={columns}
              data={data}
              searchPlaceholder="Search particulars..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
