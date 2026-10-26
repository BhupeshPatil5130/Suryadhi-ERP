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
  Download, Plus, Eye, Printer, CreditCard, Banknote, AlertTriangle, FileText,
  Package, Clock, Send, Truck, CheckCircle2, ChevronDown, Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { downloadAsPDF } from '@/lib/downloadUtils';
import { showToast } from '@/lib/toast';

interface PurchaseOrder {
  id: string;
  poNo: string;
  date: string;
  totalAmount: number;
  status: string;
  orderType: string;
  transporter: string;
  estimatedDeliveryDate: string;
  deliveryDate: string;
  noOfBoxes: number;
  supplier: string;
  program: string;
  remarks: string;
}

const ORDER_TYPES = [
  'Create WK',
  'Create Form',
  'Create Uniform',
  'Create Winter wear PO',
  'Create T-Shirts',
  'Create Equipment PO',
  'Create Individual Equipment PO',
] as const;

const initialPOs: PurchaseOrder[] = [
  {
    id: '1',
    poNo: 'PO-2026-001',
    date: '2026-06-05',
    totalAmount: 125000,
    status: 'DELIVERED',
    orderType: 'Create WK',
    transporter: 'Blue Dart / LR-519315',
    estimatedDeliveryDate: '2026-06-08',
    deliveryDate: '2026-06-08',
    noOfBoxes: 12,
    supplier: 'SunoiaKids HQ Supply',
    program: 'SUNOIA Junior',
    remarks: 'Delivered in good condition',
  },
  {
    id: '2',
    poNo: 'PO-2026-002',
    date: '2026-06-08',
    totalAmount: 30000,
    status: 'ORDER_DISPATCH',
    orderType: 'Create Form',
    transporter: 'DTDC / LR-884210',
    estimatedDeliveryDate: '2026-06-12',
    deliveryDate: '—',
    noOfBoxes: 4,
    supplier: 'SunoiaKids HQ Supply',
    program: 'Play Group',
    remarks: 'Dispatched on 09-06-2026',
  },
  {
    id: '3',
    poNo: 'PO-2026-003',
    date: '2026-06-10',
    totalAmount: 60000,
    status: 'ORDER_RECEIVED',
    orderType: 'Create Uniform',
    transporter: 'TCI Freight / LR-104921',
    estimatedDeliveryDate: '2026-06-15',
    deliveryDate: '—',
    noOfBoxes: 6,
    supplier: 'Learning Kits Ltd',
    program: 'Nursery',
    remarks: 'Awaiting HO Approval',
  },
  {
    id: '4',
    poNo: 'PO-2026-004',
    date: '2026-06-11',
    totalAmount: 85000,
    status: 'IN_TRANSIT',
    orderType: 'Create Winter wear PO',
    transporter: 'Trackon / LR-771890',
    estimatedDeliveryDate: '2026-06-18',
    deliveryDate: '—',
    noOfBoxes: 8,
    supplier: 'Uniforms & Co',
    program: 'SUNOIA Senior',
    remarks: 'Winter coats and sweaters batch',
  },
  {
    id: '5',
    poNo: 'PO-2026-005',
    date: '2026-06-12',
    totalAmount: 48000,
    status: 'IN_PROCESS',
    orderType: 'Create Equipment PO',
    transporter: 'VRL Logistics / LR-992341',
    estimatedDeliveryDate: '2026-06-20',
    deliveryDate: '—',
    noOfBoxes: 5,
    supplier: 'Sports & Play Equipment',
    program: 'All Programs',
    remarks: 'Play area toys & gym mats',
  },
];

export default function PurchaseOrderPage() {
  const [data, setData] = useState<PurchaseOrder[]>(initialPOs);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<string>('Create WK');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dialog states for the 7 actions
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // New PO Form state
  const [formData, setFormData] = useState({
    supplier: 'SunoiaKids HQ Supply',
    program: 'Nursery',
    qty: 10,
    unitPrice: 1500,
    transporter: 'Blue Dart / LR-102938',
    estimatedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    noOfBoxes: 2,
    remarks: '',
  });

  const handleOpenAddModal = (orderType: string) => {
    setSelectedOrderType(orderType);
    setIsAddMenuOpen(false);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const totalAmount = formData.qty * formData.unitPrice;
      const newPO: PurchaseOrder = {
        id: 'po-' + Date.now(),
        poNo: `PO-${new Date().getFullYear()}-${(data.length + 1).toString().padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        totalAmount,
        status: 'ORDER_RECEIVED',
        orderType: selectedOrderType,
        transporter: formData.transporter,
        estimatedDeliveryDate: formData.estimatedDeliveryDate,
        deliveryDate: '—',
        noOfBoxes: Number(formData.noOfBoxes),
        supplier: formData.supplier,
        program: formData.program,
        remarks: formData.remarks || `${selectedOrderType} batch request`,
      };

      setData(prev => [newPO, ...prev]);
      showToast(`${selectedOrderType} order placed successfully!`, 'success');
      setIsModalOpen(false);
    } catch {
      showToast('Failed to create purchase order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const orderReceivedCount = data.filter(d => ['ORDER_RECEIVED', 'SUBMITTED', 'PENDING'].includes(d.status.toUpperCase())).length;
  const inProcessCount = data.filter(d => ['IN_PROCESS', 'APPROVED'].includes(d.status.toUpperCase())).length;
  const orderDispatchCount = data.filter(d => ['ORDER_DISPATCH', 'DISPATCHED'].includes(d.status.toUpperCase())).length;
  const inTransitCount = data.filter(d => ['IN_TRANSIT'].includes(d.status.toUpperCase())).length;
  const orderDeliveredCount = data.filter(d => ['ORDER_DELIVERED', 'DELIVERED'].includes(d.status.toUpperCase())).length;

  const filteredData = statusFilter === 'ALL'
    ? data
    : data.filter((item) => {
        const s = item.status.toUpperCase();
        if (statusFilter === 'ORDER_RECEIVED') return ['ORDER_RECEIVED', 'SUBMITTED', 'PENDING'].includes(s);
        if (statusFilter === 'IN_PROCESS') return ['IN_PROCESS', 'APPROVED'].includes(s);
        if (statusFilter === 'ORDER_DISPATCH') return ['ORDER_DISPATCH', 'DISPATCHED'].includes(s);
        if (statusFilter === 'IN_TRANSIT') return ['IN_TRANSIT'].includes(s);
        if (statusFilter === 'ORDER_DELIVERED') return ['ORDER_DELIVERED', 'DELIVERED'].includes(s);
        return true;
      });

  const columns: ColumnDef<PurchaseOrder, any>[] = [
    {
      accessorKey: 'poNo',
      header: 'PO. Number',
      cell: ({ getValue }) => <span className="font-mono font-bold text-xs text-blue-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'date',
      header: 'PO Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'totalAmount',
      header: () => <div className="text-right">Total Amount (₹)</div>,
      cell: ({ getValue }) => <div className="text-right font-mono font-semibold text-xs text-slate-800">{formatCurrency(getValue() as number)}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return <Badge className={`${getStatusColor(status)} text-[10px] px-2 py-0.5`}>{status.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'orderType',
      header: 'Order Type',
      cell: ({ getValue }) => <span className="text-xs font-medium text-slate-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'transporter',
      header: 'Transporter/LR No',
      cell: ({ getValue }) => <span className="text-xs text-slate-600 font-mono">{getValue() as string}</span>,
    },
    {
      accessorKey: 'estimatedDeliveryDate',
      header: 'Est. Delivery Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'deliveryDate',
      header: 'Delivery Date',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return <span className="text-xs">{val && val !== '—' ? formatDate(val) : '—'}</span>;
      },
    },
    {
      accessorKey: 'noOfBoxes',
      header: () => <div className="text-center">No. Of Boxes</div>,
      cell: ({ getValue }) => <div className="text-center font-bold text-xs">{getValue() as number}</div>,
    },
    {
      id: 'actions',
      header: () => <div className="text-center font-bold">Action Buttons (07)</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1 justify-center flex-wrap max-w-[260px]">
            {/* 1. View Order */}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 bg-white hover:bg-slate-100"
              title="1. View Order"
              onClick={() => { setSelectedPO(item); setActiveDialog('view'); }}
            >
              <Eye className="h-3 w-3 text-blue-600" /> View
            </Button>

            {/* 2. Payment Details */}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 bg-white hover:bg-slate-100"
              title="2. Payment Details"
              onClick={() => { setSelectedPO(item); setActiveDialog('payment'); }}
            >
              <CreditCard className="h-3 w-3 text-emerald-600" /> Payment
            </Button>

            {/* 3. Deposit Details */}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 bg-white hover:bg-slate-100"
              title="3. Deposit Details"
              onClick={() => { setSelectedPO(item); setActiveDialog('deposit'); }}
            >
              <Banknote className="h-3 w-3 text-indigo-600" /> Deposit
            </Button>

            {/* 4. Shortage / Damages */}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 bg-white hover:bg-slate-100 text-rose-600"
              title="4. Shortage/Damages"
              onClick={() => { setSelectedPO(item); setActiveDialog('shortage'); }}
            >
              <AlertTriangle className="h-3 w-3" /> Shortage
            </Button>

            {/* 5. Download Package List */}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 bg-white hover:bg-slate-100"
              title="5. Download Package List"
              onClick={() => {
                downloadAsPDF({
                  title: `Package List — ${item.poNo}`,
                  subtitle: `Order Type: ${item.orderType} | Boxes: ${item.noOfBoxes} | Transporter: ${item.transporter}`,
                  filename: `package-list-${item.poNo}`,
                  columns: ['Box #', 'Item Description', 'Quantity', 'Status'],
                  rows: [
                    ['Box 1 of ' + item.noOfBoxes, `${item.orderType} Main Kit Items`, '10 sets', 'Packed'],
                    ['Box 2 of ' + item.noOfBoxes, `${item.orderType} Ancillary Materials`, '5 sets', 'Packed'],
                  ],
                });
                showToast('Package list downloaded successfully!', 'success');
              }}
            >
              <Download className="h-3 w-3 text-slate-700" /> Package
            </Button>

            {/* 6. View & Download HomeSunny Sale Invoice */}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 bg-white hover:bg-slate-100 text-amber-700"
              title="6. View & Download HomeSunny Sale Invoice"
              onClick={() => {
                downloadAsPDF({
                  title: `HomeSunny Sale Invoice — ${item.poNo}`,
                  subtitle: `Order Type: ${item.orderType} | Amount: ${formatCurrency(item.totalAmount)}`,
                  filename: `homesunny-invoice-${item.poNo}`,
                  columns: ['Invoice No', 'Date', 'Description', 'Amount (₹)', 'Tax (₹)', 'Total (₹)'],
                  rows: [[
                    `HS-INV-${item.poNo}`,
                    formatDate(item.date),
                    item.orderType,
                    formatCurrency(item.totalAmount * 0.82),
                    formatCurrency(item.totalAmount * 0.18),
                    formatCurrency(item.totalAmount),
                  ]],
                });
                showToast('HomeSunny Sale Invoice downloaded!', 'success');
              }}
            >
              <FileText className="h-3 w-3" /> HS Invoice
            </Button>

            {/* 7. View & Download Sale Invoice */}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-1.5 text-[10px] gap-1 bg-white hover:bg-slate-100 text-blue-700"
              title="7. View & Download Sale Invoice"
              onClick={() => {
                downloadAsPDF({
                  title: `Standard Sale Invoice — ${item.poNo}`,
                  subtitle: `Vendor: ${item.supplier} | Total Amount: ${formatCurrency(item.totalAmount)}`,
                  filename: `sale-invoice-${item.poNo}`,
                  columns: ['Item', 'Program', 'Boxes', 'Amount', 'LR No'],
                  rows: [[item.orderType, item.program, String(item.noOfBoxes), formatCurrency(item.totalAmount), item.transporter]],
                });
                showToast('Sale Invoice downloaded!', 'success');
              }}
            >
              <Printer className="h-3 w-3" /> Invoice
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Purchase Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage welcome kits, uniform batches, and equipment orders</p>
        </div>

        {/* Add Order with 7 Sub-Types Dropdown */}
        <div className="relative">
          <Button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Order <ChevronDown className="h-3.5 w-3.5" />
          </Button>

          {isAddMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-xl z-50 py-1.5">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Order Type
              </div>
              {ORDER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleOpenAddModal(type)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5 Dashboard KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-blue-500 shadow-sm hover:shadow-md ${
            statusFilter === 'ORDER_RECEIVED' ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'ORDER_RECEIVED' ? 'ALL' : 'ORDER_RECEIVED')}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Order Received</p>
              <h3 className="text-xl font-bold text-blue-700 mt-0.5">{orderReceivedCount}</h3>
            </div>
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-amber-500 shadow-sm hover:shadow-md ${
            statusFilter === 'IN_PROCESS' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'IN_PROCESS' ? 'ALL' : 'IN_PROCESS')}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">In-Process</p>
              <h3 className="text-xl font-bold text-amber-700 mt-0.5">{inProcessCount}</h3>
            </div>
            <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md ${
            statusFilter === 'ORDER_DISPATCH' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'ORDER_DISPATCH' ? 'ALL' : 'ORDER_DISPATCH')}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Order Dispatch</p>
              <h3 className="text-xl font-bold text-indigo-700 mt-0.5">{orderDispatchCount}</h3>
            </div>
            <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Send className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-purple-500 shadow-sm hover:shadow-md ${
            statusFilter === 'IN_TRANSIT' ? 'ring-2 ring-purple-500 bg-purple-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'IN_TRANSIT' ? 'ALL' : 'IN_TRANSIT')}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">In Transit</p>
              <h3 className="text-xl font-bold text-purple-700 mt-0.5">{inTransitCount}</h3>
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md ${
            statusFilter === 'ORDER_DELIVERED' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'ORDER_DELIVERED' ? 'ALL' : 'ORDER_DELIVERED')}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Order Delivered</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{orderDeliveredCount}</h3>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-4">
        <DataTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search by PO number, order type, or transporter..."
          showExportBox={true}
          exportTitle="purchase_orders"
        />
      </div>

      {/* Create Order Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-slate-200 rounded-lg shadow-2xl bg-white">
          <DialogHeader className="bg-slate-900 p-4 text-white">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              {selectedOrderType}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Vendor</label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program</label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                  className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="Play Group">Play Group</option>
                  <option value="Nursery">Nursery</option>
                  <option value="SUNOIA Junior">SUNOIA Junior</option>
                  <option value="SUNOIA Senior">SUNOIA Senior</option>
                  <option value="All Programs">All Programs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transporter / LR No</label>
                <Input
                  value={formData.transporter}
                  onChange={(e) => setFormData(prev => ({ ...prev, transporter: e.target.value }))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, qty: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.unitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">No. of Boxes</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.noOfBoxes}
                  onChange={(e) => setFormData(prev => ({ ...prev, noOfBoxes: Number(e.target.value) }))}
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Delivery Date</label>
              <Input
                type="date"
                value={formData.estimatedDeliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs flex justify-between items-center">
              <span className="font-semibold text-slate-600">Calculated Total Amount:</span>
              <span className="font-bold font-mono text-sm text-blue-700">{formatCurrency(formData.qty * formData.unitPrice)}</span>
            </div>

            <div className="border-t border-slate-100 pt-3 flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Confirm & Place Order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Action Dialogs */}
      {selectedPO && (
        <Dialog open={!!activeDialog} onOpenChange={() => setActiveDialog(null)}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">
                {activeDialog === 'view' && `Order Details — ${selectedPO.poNo}`}
                {activeDialog === 'payment' && `Payment Details — ${selectedPO.poNo}`}
                {activeDialog === 'deposit' && `Deposit Details — ${selectedPO.poNo}`}
                {activeDialog === 'shortage' && `Shortage / Damages Report — ${selectedPO.poNo}`}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2.5 text-xs pt-2">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Order Type:</span>
                <span className="font-semibold">{selectedPO.orderType}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-semibold font-mono">{formatCurrency(selectedPO.totalAmount)}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Transporter / LR No:</span>
                <span className="font-mono">{selectedPO.transporter}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">No. of Boxes:</span>
                <span className="font-semibold">{selectedPO.noOfBoxes} boxes</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Status:</span>
                <Badge className={getStatusColor(selectedPO.status)}>{selectedPO.status}</Badge>
              </div>

              {activeDialog === 'payment' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 mt-2 space-y-1 text-emerald-800">
                  <div className="font-bold">Payment Verified</div>
                  <div>Account: State Bank of India • Ref: TXN-{selectedPO.poNo.replace('-', '')}</div>
                </div>
              )}

              {activeDialog === 'deposit' && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2.5 mt-2 space-y-1 text-blue-800">
                  <div className="font-bold">Deposit Confirmation</div>
                  <div>Security deposit acknowledged against franchise PO ledger.</div>
                </div>
              )}

              {activeDialog === 'shortage' && (
                <div className="bg-rose-50 border border-rose-200 rounded p-2.5 mt-2 space-y-1 text-rose-800">
                  <div className="font-bold">Shortage / Damage Status</div>
                  <div>No open damage claims reported for this order. Click below to file a new report if required.</div>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <Button size="sm" onClick={() => setActiveDialog(null)} className="h-7 text-xs">Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
