import { useState, useEffect } from 'react';
import api from '@/api/client';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Eye, Printer, RotateCw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { showToast } from '@/lib/toast';

interface ExchangeOrder {
  id: string;
  exchangeNumber: string;
  poNumber: string;
  lrNumber: string;
  reportDate: string;
  reason: string;
  itemDescription: string;
  qty: number;
  status: 'PENDING' | 'APPROVED' | 'IN_PROCESS' | 'DISPATCHED' | 'DELIVERED' | 'REJECTED';
}

const mockExchangeOrders: ExchangeOrder[] = [
  {
    id: 'exc-1',
    exchangeNumber: 'EXC-2026-0001',
    poNumber: 'PO-2026-001',
    lrNumber: 'LR-519315',
    reportDate: '2026-06-10',
    reason: 'Size Mismatch (Ordered M, received S)',
    itemDescription: 'Summer Uniform - Sunoia Junior',
    qty: 5,
    status: 'IN_PROCESS',
  },
  {
    id: 'exc-2',
    exchangeNumber: 'EXC-2026-0002',
    poNumber: 'PO-2026-002',
    lrNumber: 'LR-519398',
    reportDate: '2026-06-12',
    reason: 'Damaged Kit Binding on transit',
    itemDescription: 'Nursery Welcome Kit Books',
    qty: 2,
    status: 'APPROVED',
  },
  {
    id: 'exc-3',
    exchangeNumber: 'EXC-2026-0003',
    poNumber: 'PO-2026-003',
    lrNumber: 'LR-520110',
    reportDate: '2026-06-14',
    reason: 'Wrong Program Materials Sent',
    itemDescription: 'Play Group Activity Kit Box',
    qty: 3,
    status: 'DELIVERED',
  },
];

export default function ExchangeOrdersPage() {
  const [data, setData] = useState<ExchangeOrder[]>(mockExchangeOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ExchangeOrder | null>(null);

  // Add form state
  const [formData, setFormData] = useState({
    poNumber: 'PO-2026-001',
    lrNumber: '',
    reason: 'Size Mismatch',
    itemDescription: '',
    qty: 1,
  });

  useEffect(() => {
    const fetchExchangeOrders = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/operations/exchange-orders');
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped: ExchangeOrder[] = res.data.data.map((item: any) => ({
            id: item.id || `exc-${Math.random()}`,
            exchangeNumber: item.orderNumber || item.exchangeNumber || 'EXC-2026-0001',
            poNumber: item.poNumber || 'PO-2026-001',
            lrNumber: item.lrNumber || item.uin || 'LR-519315',
            reportDate: item.requestedAt ? item.requestedAt.split('T')[0] : (item.reportDate || '2026-06-10'),
            reason: item.reason || 'Size Mismatch',
            itemDescription: item.itemExchanged || item.itemDescription || 'Kit items',
            qty: item.qty || 1,
            status: item.status || 'PENDING',
          }));
          setData(mapped);
        }
      } catch (err) {
        console.warn('Could not load from API, using fallback exchange orders', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExchangeOrders();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lrNumber || !formData.itemDescription) {
      showToast('Please fill in LR Number and Item Description', 'error');
      return;
    }

    const newOrder: ExchangeOrder = {
      id: `exc-${Date.now()}`,
      exchangeNumber: `EXC-2026-${(data.length + 1).toString().padStart(4, '0')}`,
      poNumber: formData.poNumber,
      lrNumber: formData.lrNumber,
      reportDate: new Date().toISOString().split('T')[0],
      reason: formData.reason,
      itemDescription: formData.itemDescription,
      qty: Number(formData.qty),
      status: 'PENDING',
    };

    try {
      await api.post('/operations/exchange-orders', {
        studentName: 'Student',
        itemExchanged: formData.itemDescription,
        newItemRequested: `Exchange for ${formData.itemDescription}`,
        reason: formData.reason,
      });
    } catch {
      // offline/fallback
    }

    setData((prev) => [newOrder, ...prev]);
    showToast('Exchange Order created successfully!', 'success');
    setIsAddModalOpen(false);
    setFormData({ poNumber: 'PO-2026-001', lrNumber: '', reason: 'Size Mismatch', itemDescription: '', qty: 1 });
  };

  const handleStatusUpdate = (id: string, newStatus: ExchangeOrder['status']) => {
    setData((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    showToast(`Order status updated to ${newStatus}`, 'success');
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const getBadgeColor = (status: ExchangeOrder['status']) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-none';
      case 'APPROVED':
      case 'IN_PROCESS':
        return 'bg-blue-100 text-blue-800 border-none';
      case 'DISPATCHED':
        return 'bg-purple-100 text-purple-800 border-none';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-none';
      default:
        return 'bg-amber-100 text-amber-800 border-none';
    }
  };

  const columns: ColumnDef<ExchangeOrder>[] = [
    {
      accessorKey: 'exchangeNumber',
      header: 'Exchange Number',
      cell: ({ getValue }) => (
        <span className="font-mono font-bold text-xs text-blue-700">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'poNumber',
      header: 'PO Number',
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
    },
    {
      accessorKey: 'lrNumber',
      header: 'LR Number',
      cell: ({ getValue }) => <span className="font-mono text-xs text-slate-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'reportDate',
      header: 'Report Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'itemDescription',
      header: 'Item Details',
      cell: ({ row }) => (
        <div className="text-left text-xs max-w-[220px]">
          <span className="font-semibold text-slate-900 block">{row.original.itemDescription}</span>
          <span className="text-slate-500 block text-[11px]">Qty: {row.original.qty} pcs</span>
        </div>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'Exchange Reason',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground block max-w-[180px] truncate" title={row.original.reason}>
          {row.original.reason}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ getValue }) => {
        const s = getValue() as ExchangeOrder['status'];
        return (
          <div className="text-center">
            <Badge className={`text-xs font-semibold ${getBadgeColor(s)}`}>
              {s.replace(/_/g, ' ')}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Action Buttons</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-blue-700 hover:bg-blue-50 gap-1 px-2 bg-white"
            onClick={() => setSelectedOrder(row.original)}
            title="View Item Details"
          >
            <Eye className="w-3 h-3" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 gap-1 px-2 bg-white"
            onClick={() => {
              setData(prev => prev.map(o => o.id === row.original.id ? { ...o, status: 'APPROVED' } : o));
              showToast('Exchange item replacement approved!', 'success');
            }}
            title="Approve Replacement"
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
            title="Print Exchange Slip"
            onClick={() => {
              window.print();
            }}
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exchange Orders"
        description="Process kit item replacements, size exchanges, and shortage return requests"
      >
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Exchange Order
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Exchange Requests</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{data.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <RotateCw className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">In-Process / Approved</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {data.filter((d) => ['PENDING', 'APPROVED', 'IN_PROCESS'].includes(d.status)).length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Completed Exchanges</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {data.filter((d) => d.status === 'DELIVERED').length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search by exchange no, PO no, or LR no..."
            showExportBox={true}
            exportTitle="exchange_orders"
          />
        </CardContent>
      </Card>

      {/* Add Exchange Order Modal */}
      {isAddModalOpen && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">New Exchange Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Associated PO Number *</label>
                <select
                  value={formData.poNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, poNumber: e.target.value }))}
                  className="w-full border rounded h-8 px-2.5 text-xs bg-background"
                >
                  <option value="PO-2026-001">PO-2026-001 (Sunoia Junior Kits)</option>
                  <option value="PO-2026-002">PO-2026-002 (Play Group Uniforms)</option>
                  <option value="PO-2026-003">PO-2026-003 (Nursery Materials)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LR Number (Consignment) *</label>
                <Input
                  placeholder="e.g. LR-519315"
                  value={formData.lrNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, lrNumber: e.target.value }))}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exchange Reason *</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
                    className="w-full border rounded h-8 px-2.5 text-xs bg-background"
                  >
                    <option value="Size Mismatch">Size Mismatch</option>
                    <option value="Damaged in Transit">Damaged in Transit</option>
                    <option value="Wrong Item Sent">Wrong Item Sent</option>
                    <option value="Defective Material">Defective Material</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.qty}
                    onChange={(e) => setFormData((p) => ({ ...p, qty: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description / Specifications *</label>
                <Input
                  placeholder="e.g. Uniform Set - Navy Blue (Exchange for Size M)"
                  value={formData.itemDescription}
                  onChange={(e) => setFormData((p) => ({ ...p, itemDescription: e.target.value }))}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Submit Exchange Order
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View & Update Action Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Exchange Order — {selectedOrder.exchangeNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-sm">
              <div className="bg-muted/40 p-3 rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO Number:</span>
                  <span className="font-mono font-medium">{selectedOrder.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LR Number:</span>
                  <span className="font-mono font-medium">{selectedOrder.lrNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Date:</span>
                  <span>{formatDate(selectedOrder.reportDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.itemDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-bold">{selectedOrder.qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="text-red-600 font-medium">{selectedOrder.reason}</span>
                </div>
              </div>

              {/* Status Update Action */}
              <div className="border rounded-lg p-3 space-y-2">
                <label className="text-xs font-semibold block text-slate-700">Update Action Status:</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={selectedOrder.status === 'APPROVED' ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'APPROVED')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.status === 'IN_PROCESS' ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'IN_PROCESS')}
                  >
                    In-Process
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.status === 'DELIVERED' ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                  >
                    Delivered
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
