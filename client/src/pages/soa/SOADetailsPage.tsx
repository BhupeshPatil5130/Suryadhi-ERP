import { useState, useRef, useEffect } from 'react';
import api from '@/api/client';

import { type ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SOATransaction {
  id: string;
  date: string;
  particulars: string;
  receiptNo: string | null;
  mode: string | null;
  debit: number;
  credit: number;
  balance: number;
}

const columns: ColumnDef<SOATransaction, any>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ getValue }) => <span className="text-sm font-medium">{formatDate(getValue() as string)}</span>,
  },
  {
    accessorKey: 'particulars',
    header: 'Particulars',
    cell: ({ row }) => (
      <div>
        <p className="text-sm">{row.original.particulars}</p>
        {(row.original.receiptNo || row.original.mode) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {row.original.receiptNo} {row.original.mode && `• ${row.original.mode}`}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'debit',
    header: () => <div className="text-right">Debit / Invoice (₹)</div>,
    cell: ({ getValue }) => {
      const val = getValue() as number;
      return val > 0 ? <div className="text-right text-destructive font-mono">{formatCurrency(val)}</div> : <div className="text-right text-muted-foreground">-</div>;
    },
  },
  {
    accessorKey: 'credit',
    header: () => <div className="text-right">Credit / Receipt (₹)</div>,
    cell: ({ getValue }) => {
      const val = getValue() as number;
      return val > 0 ? <div className="text-right text-emerald-600 font-mono">{formatCurrency(val)}</div> : <div className="text-right text-muted-foreground">-</div>;
    },
  },
  {
    accessorKey: 'balance',
    header: () => <div className="text-right font-bold text-foreground">Balance (₹)</div>,
    cell: ({ getValue }) => <div className="text-right font-mono font-bold">{formatCurrency(getValue() as number)}</div>,
  },
];

export default function SOADetailsPage() {
  const [data, setData] = useState<SOATransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [admission, setAdmission] = useState<any>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get('/admissions', { params: { search: query, limit: 5 } });
      if (res.data.success) {
        setSearchResults(res.data.data);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectStudent = async (studentData: any) => {
    setAdmission(studentData);
    setSearchQuery(`${studentData.studentFirstName} ${studentData.studentLastName}`);
    setShowDropdown(false);
    
    // Fetch ledger data
    setIsLoadingLedger(true);
    try {
      const res = await api.get(`/fees/receipts/${studentData.id}`);
      if (res.data.success) {
        const { invoices, receipts } = res.data.data;
        
        const combined: any[] = [];
        
        // Push invoices
        invoices.forEach((inv: any) => {
          combined.push({
            id: inv.id,
            date: inv.createdAt || new Date().toISOString(), // Fallback if createdAt not selected
            particulars: `Fee Invoice ${inv.invoiceNumber}`,
            receiptNo: inv.invoiceNumber,
            mode: null,
            debit: parseFloat(inv.netAmount) || 0,
            credit: 0,
            timestamp: new Date(inv.createdAt || 0).getTime(),
          });
        });

        // Push receipts
        receipts.forEach((rcp: any) => {
          if (rcp.isCancelled) return;
          combined.push({
            id: rcp.id,
            date: rcp.receiptDate,
            particulars: `Payment Received`,
            receiptNo: rcp.receiptNumber,
            mode: rcp.paymentMode,
            debit: 0,
            credit: parseFloat(rcp.amount) || 0,
            timestamp: new Date(rcp.receiptDate).getTime(),
          });
        });

        // Sort chronologically
        combined.sort((a, b) => a.timestamp - b.timestamp);

        // Compute running balance
        let runningBalance = 0;
        const finalLedger = combined.map(item => {
          runningBalance += (item.debit - item.credit);
          return {
            ...item,
            balance: runningBalance
          };
        });

        setData(finalLedger);
      }
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Statement of Account Details"
        description="Detailed ledger view for individual students"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Find Student
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5 relative" ref={searchRef}>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Enter Name or UIN</label>
                <div className="relative">
                  <Input 
                    placeholder="Search..." 
                    className="h-9" 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  />
                  {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">...</div>}
                </div>
                
                {/* Dropdown Results */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 top-full bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((res: any) => (
                      <div 
                        key={res.id} 
                        className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => selectStudent(res)}
                      >
                        <div className="font-semibold text-sm text-slate-800">{res.studentFirstName} {res.studentLastName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{res.uin}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {admission && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Student Info</p>
                  <p className="font-bold text-base mt-1">{admission.studentFirstName} {admission.studentLastName}</p>
                  <p className="text-sm">{admission.program?.name}</p>
                  <Badge variant="outline" className="mt-2">{admission.status}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Transaction Ledger
              </CardTitle>
              <Button variant="outline" size="sm" disabled={!admission}>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 min-h-[300px]">
                {isLoadingLedger ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">Loading ledger...</div>
                ) : !admission ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">Select a student to view their ledger</div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={data}
                    searchPlaceholder="Search transactions..."
                    showColumnToggle={false}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
