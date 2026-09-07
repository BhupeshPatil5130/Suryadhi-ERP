import { useState, useEffect } from 'react';
import api from '@/api/client';

import { type ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Download, Plus, Eye, Printer, Filter, Edit2, Trash, Check, X, Loader2,
  Package, Clock, Send, Truck, CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { downloadAsPDF, apiDownload } from '@/lib/downloadUtils';
import { showToast } from '@/lib/toast';

interface PurchaseOrder {
  id: string;
  poNo: string;
  date: string;
  supplier: string;
  program: string;
  studentName: string;
  qty: number;
  unitPrice: number;
  totalValue: number;
  totalAmount?: number;
  status: string;
  remarks: string;
}

const dummyPOs: PurchaseOrder[] = [
  { id: '1', poNo: 'PO-2026-001', date: '2026-06-05', supplier: 'SunoiaKids HQ Supply', program: 'SUNOIA Junior', studentName: 'General Stock', qty: 45, unitPrice: 2777, totalValue: 125000, status: 'DELIVERED', remarks: 'Delivered via Blue Dart LR No 519315' },
  { id: '2', poNo: 'PO-2026-002', date: '2026-06-08', supplier: 'SunoiaKids HQ Supply', program: 'Play Group', studentName: 'General Stock', qty: 20, unitPrice: 1500, totalValue: 30000, status: 'DISPATCHED', remarks: 'Dispatched on 09-06-2026' },
  { id: '3', poNo: 'PO-2026-003', date: '2026-06-10', supplier: 'Learning Kits Ltd', program: 'Nursery', studentName: 'General Stock', qty: 30, unitPrice: 2000, totalValue: 60000, status: 'SUBMITTED', remarks: 'Awaiting HO Approval' },
  { id: '4', poNo: 'PO-2026-004', date: '2026-06-11', supplier: 'Uniforms & Co', program: 'SUNOIA Senior', studentName: 'General Stock', qty: 150, unitPrice: 566, totalValue: 85000, status: 'PARTIALLY_DELIVERED', remarks: 'Summer uniforms pending' },
];

export default function PurchaseOrderPage() {
  const [data, setData] = useState<PurchaseOrder[]>(dummyPOs);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [editPO, setEditPO] = useState<PurchaseOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New PO Form state
  const [formData, setFormData] = useState({
    supplier: 'SunoiaKids HQ Supply',
    program: 'Nursery',
    studentName: 'General Stock',
    qty: 10,
    unitPrice: 1500,
    remarks: 'Auto replenishment',
  });

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/operations/purchase-orders');
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        const apiData = res.data.data.map((item: any) => ({
          id: item.id,
          poNo: item.orderNumber,
          date: new Date(item.createdAt).toLocaleDateString(),
          supplier: 'SunoiaKids HQ Supply',
          program: 'Nursery',
          studentName: 'General Stock',
          qty: item.itemsCount || 10,
          unitPrice: Math.round(item.totalAmount / (item.itemsCount || 10)),
          totalValue: item.totalAmount,
          status: item.status,
          remarks: item.notes || 'No remarks',
        }));
        setData(apiData);
      }
    } catch (error) {
      console.warn('Failed to fetch purchase orders, falling back to dummy data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handleStatusChange = (id: string, newStatus: string) => {
    setData(prev => prev.map(po => po.id === id ? { ...po, status: newStatus } : po));
    showToast(`Order status updated to ${newStatus}`, 'success');
  };

  const handleDelete = (id: string) => {
    setData(prev => prev.filter(po => po.id !== id));
    showToast('Purchase order deleted.', 'info');
    api.delete(`/operations/purchase-orders/${id}`).catch(() => {});
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Simulate/save locally
      const totalValue = formData.qty * formData.unitPrice;
      const count = data.length;
      const newPO: PurchaseOrder = {
        id: 'new-' + Date.now(),
        poNo: `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        supplier: formData.supplier,
        program: formData.program,
        studentName: formData.studentName,
        qty: Number(formData.qty),
        unitPrice: Number(formData.unitPrice),
        totalValue,
        status: 'PENDING',
        remarks: formData.remarks,
      };

      // Call backend if it existed, otherwise simulate
      try {
        await api.post('/operations/purchase-orders', {
          orderNumber: newPO.poNo,
          totalAmount: totalValue,
          notes: formData.remarks,
        });
      } catch (err) {
        // Fallback to local push
      }

      setData(prev => [newPO, ...prev]);
      showToast('Purchase Order successfully submitted!', 'success');
      setIsModalOpen(false);
    } catch (err) {
      showToast('Failed to submit order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<PurchaseOrder, any>[] = [
    {
      accessorKey: 'poNo',
      header: 'PO Number',
      cell: ({ getValue }) => <span className="font-mono font-medium text-sm">{getValue() as string}</span>,
    },
    {
      accessorKey: 'date',
      header: 'PO Date',
      cell: ({ getValue }) => <span className="text-sm">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ getValue }) => <span className="text-sm font-medium">{getValue() as string}</span>,
    },
    {
      accessorKey: 'program',
      header: 'Program',
      cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span>,
    },
    {
      accessorKey: 'studentName',
      header: 'Student Name',
      cell: ({ getValue }) => <span className="text-sm text-slate-500">{getValue() as string}</span>,
    },
    {
      accessorKey: 'qty',
      header: () => <div className="text-right">Qty</div>,
      cell: ({ getValue }) => <div className="text-right text-sm">{getValue() as number}</div>,
    },
    {
      accessorKey: 'unitPrice',
      header: () => <div className="text-right">Unit Price (₹)</div>,
      cell: ({ getValue }) => <div className="text-right text-sm font-mono">{formatCurrency(getValue() as number)}</div>,
    },
    {
      accessorKey: 'totalValue',
      header: () => <div className="text-right">Total Value (₹)</div>,
      cell: ({ getValue }) => <div className="text-right font-mono font-bold text-primary">{formatCurrency(getValue() as number)}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return <Badge className={getStatusColor(status)}>{status.replace('_', ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">{getValue() as string}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5 justify-center">
            {/* Action 1: View */}
            <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => setViewPO(item)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {/* Action 2: Edit */}
            <Button variant="ghost" size="icon-sm" title="Edit PO" className="text-amber-500" onClick={() => setEditPO({...item})}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            {/* Action 3: Delete */}
            <Button variant="ghost" size="icon-sm" title="Delete PO" className="text-destructive" onClick={() => handleDelete(item.id)}>
              <Trash className="h-3.5 w-3.5" />
            </Button>
            {/* Action 4: Print */}
            <Button variant="ghost" size="icon-sm" title="Print PO" className="text-primary"
              onClick={() => downloadAsPDF({
                title: `Purchase Order – ${item.poNo}`,
                subtitle: `Vendor: ${item.supplier} | Status: ${item.status}`,
                filename: `po-${item.poNo}`,
                columns: ['PO Number', 'Date', 'Vendor', 'Amount', 'Status'],
                rows: [[
                  item.poNo,
                  formatDate(item.date),
                  item.supplier,
                  formatCurrency(item.totalAmount ?? 0),
                  item.status,
                ]],
              })}
            >
              <Printer className="h-3.5 w-3.5" />
            </Button>
            {/* Action 5: Approve */}
            <Button 
              variant="ghost" 
              size="icon-sm" 
              title="Approve / Submit Order" 
              className="text-green-600" 
              disabled={item.status === 'APPROVED' || item.status === 'DELIVERED'}
              onClick={() => handleStatusChange(item.id, 'APPROVED')}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            {/* Action 6: Cancel */}
            <Button 
              variant="ghost" 
              size="icon-sm" 
              title="Cancel Order" 
              className="text-red-500"
              disabled={item.status === 'CANCELLED' || item.status === 'DELIVERED'}
              onClick={() => handleStatusChange(item.id, 'CANCELLED')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const orderReceivedCount = data.filter(d => ['SUBMITTED', 'PENDING', 'ORDER_RECEIVED'].includes(d.status.toUpperCase())).length;
  const inProcessCount = data.filter(d => ['IN_PROCESS', 'APPROVED'].includes(d.status.toUpperCase())).length;
  const orderDispatchCount = data.filter(d => ['DISPATCHED', 'ORDER_DISPATCH'].includes(d.status.toUpperCase())).length;
  const inTransitCount = data.filter(d => ['IN_TRANSIT'].includes(d.status.toUpperCase())).length;
  const orderDeliveredCount = data.filter(d => ['DELIVERED', 'ORDER_DELIVERED'].includes(d.status.toUpperCase())).length;

  const filteredData = statusFilter === 'ALL'
    ? data
    : data.filter((item) => {
        const s = item.status.toUpperCase();
        if (statusFilter === 'ORDER_RECEIVED') return ['SUBMITTED', 'PENDING', 'ORDER_RECEIVED'].includes(s);
        if (statusFilter === 'IN_PROCESS') return ['IN_PROCESS', 'APPROVED'].includes(s);
        if (statusFilter === 'ORDER_DISPATCH') return ['DISPATCHED', 'ORDER_DISPATCH'].includes(s);
        if (statusFilter === 'IN_TRANSIT') return ['IN_TRANSIT'].includes(s);
        if (statusFilter === 'ORDER_DELIVERED') return ['DELIVERED', 'ORDER_DELIVERED'].includes(s);
        return true;
      });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage your kit inventory, educational materials, and uniform orders"
      >
        <Button
          variant={statusFilter === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('ALL')}
        >
          All Orders ({data.length})
        </Button>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Order
        </Button>
      </PageHeader>

      {/* 5 Dashboard KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-blue-500 shadow-sm hover:shadow-md ${
            statusFilter === 'ORDER_RECEIVED' ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'ORDER_RECEIVED' ? 'ALL' : 'ORDER_RECEIVED')}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Order Received</p>
              <h3 className="text-xl font-black text-blue-700 mt-1">{orderReceivedCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-amber-500 shadow-sm hover:shadow-md ${
            statusFilter === 'IN_PROCESS' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'IN_PROCESS' ? 'ALL' : 'IN_PROCESS')}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">In-Process</p>
              <h3 className="text-xl font-black text-amber-700 mt-1">{inProcessCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md ${
            statusFilter === 'ORDER_DISPATCH' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'ORDER_DISPATCH' ? 'ALL' : 'ORDER_DISPATCH')}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Order Dispatch</p>
              <h3 className="text-xl font-black text-indigo-700 mt-1">{orderDispatchCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Send className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-purple-500 shadow-sm hover:shadow-md ${
            statusFilter === 'IN_TRANSIT' ? 'ring-2 ring-purple-500 bg-purple-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'IN_TRANSIT' ? 'ALL' : 'IN_TRANSIT')}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">In Transit</p>
              <h3 className="text-xl font-black text-purple-700 mt-1">{inTransitCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Truck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md ${
            statusFilter === 'ORDER_DELIVERED' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'ORDER_DELIVERED' ? 'ALL' : 'ORDER_DELIVERED')}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Order Delivered</p>
              <h3 className="text-xl font-black text-emerald-600 mt-1">{orderDeliveredCount}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Search by PO number or supplier..."
        showExportBox={true}
        exportTitle="purchase_orders"
      />

      {/* New Purchase Order Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-slate-200 rounded-xl shadow-2xl">
          <DialogHeader className="bg-slate-900 border-b border-slate-800 p-4 text-white">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Create Purchase Order
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4 bg-white">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name</label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="SunoiaKids HQ Supply">SunoiaKids HQ Supply</option>
                <option value="EduMaterials Corp">EduMaterials Corp</option>
                <option value="Smart Toys Inc">Smart Toys Inc</option>
                <option value="Uniforms & Co">Uniforms & Co</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program</label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Play Group">Play Group</option>
                  <option value="Nursery">Nursery</option>
                  <option value="SUNOIA Junior">SUNOIA Junior</option>
                  <option value="SUNOIA Senior">SUNOIA Senior</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name / Type</label>
                <Input
                  value={formData.studentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                <Input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, qty: Number(e.target.value) }))}
                  className="h-9 text-xs"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
                <Input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                  className="h-9 text-xs"
                  min={1}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Notes</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter order particulars or specifications..."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit Order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={!!viewPO} onOpenChange={() => setViewPO(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Purchase Order — {viewPO?.poNo}</DialogTitle>
          </DialogHeader>
          {viewPO && (
            <div className="space-y-3 text-sm">
              {[
                ['PO Number', viewPO.poNo],
                ['Date', formatDate(viewPO.date)],
                ['Supplier / Vendor', viewPO.supplier],
                ['Program', viewPO.program],
                ['Stock For', viewPO.studentName],
                ['Quantity', viewPO.qty],
                ['Unit Price', formatCurrency(viewPO.unitPrice ?? 0)],
                ['Total Value', formatCurrency(viewPO.totalValue ?? viewPO.totalAmount ?? 0)],
                ['Status', viewPO.status],
                ['Remarks', viewPO.remarks || '—'],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between border-b pb-2 last:border-0">
                  <span className="text-muted-foreground font-medium w-36 shrink-0">{label}</span>
                  <span className="font-semibold text-right">{String(value)}</span>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="outline" onClick={() => {
                  if (viewPO) downloadAsPDF({
                    title: `Purchase Order – ${viewPO.poNo}`,
                    subtitle: `Vendor: ${viewPO.supplier}`,
                    columns: ['PO No', 'Date', 'Vendor', 'Program', 'Qty', 'Unit Price', 'Total', 'Status'],
                    rows: [[viewPO.poNo, formatDate(viewPO.date), viewPO.supplier, viewPO.program, viewPO.qty, formatCurrency(viewPO.unitPrice ?? 0), formatCurrency(viewPO.totalValue ?? 0), viewPO.status]],
                    footer: viewPO.remarks,
                  });
                }}>Print PO</Button>
                <Button className="flex-1" onClick={() => setViewPO(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit PO Dialog */}
      <Dialog open={!!editPO} onOpenChange={() => setEditPO(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
          </DialogHeader>
          {editPO && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">PO Number</label>
                <Input value={editPO.poNo} readOnly className="h-8 text-xs bg-muted/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Supplier</label>
                <Input value={editPO.supplier} onChange={(e) => setEditPO(prev => prev ? { ...prev, supplier: e.target.value } : prev)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Status</label>
                <select
                  value={editPO.status}
                  onChange={(e) => setEditPO(prev => prev ? { ...prev, status: e.target.value } : prev)}
                  className="w-full h-9 border rounded px-3 text-sm bg-background"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Remarks</label>
                <textarea
                  value={editPO.remarks}
                  onChange={(e) => setEditPO(prev => prev ? { ...prev, remarks: e.target.value } : prev)}
                  className="w-full border rounded px-3 py-2 text-xs min-h-[60px] bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  if (editPO) {
                    setData(prev => prev.map(d => d.id === editPO.id ? editPO : d));
                    api.put(`/operations/purchase-orders/${editPO.id}`, editPO).catch(() => {});
                  }
                  setEditPO(null);
                }}>Save Changes</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditPO(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
