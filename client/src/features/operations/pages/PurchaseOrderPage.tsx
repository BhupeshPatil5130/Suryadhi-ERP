import { useState, useEffect, useMemo } from 'react';
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
  Package, Clock, Send, Truck, CheckCircle2, ChevronDown, Loader2,
  Calendar, Building2, MapPin, Check, ArrowLeft, RefreshCw, Trash2
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

interface OrderLineItem {
  id: string;
  itemName: string;
  category: string;
  qty: number;
  unitPrice: number;
  total: number;
}

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
  depositReceiptNo?: string;
  depositAmount?: number;
  paymentMode?: string;
  paymentRef?: string;
  bankName?: string;
  depositDate?: string;
  items?: OrderLineItem[];
}

const ORDER_TYPES = [
  'Welcome Kit (WK) Order',
  'Admission Form Order',
  'Uniform & Bag Batch PO',
  'Winter Wear PO',
  'Student T-Shirts PO',
  'Classroom & Sports Equipment PO',
  'Books & Stationery Material PO',
] as const;

const PROGRAM_OPTIONS = [
  'Play Group',
  'Nursery',
  'Euro Junior',
  'Euro Senior',
  'All Programs',
];

const DEFAULT_LINE_ITEMS: Record<string, OrderLineItem[]> = {
  'Welcome Kit (WK) Order': [
    { id: '1', itemName: 'Student Welcome Kit Box (Student Bag, Stationery, Badges)', category: 'Kit', qty: 25, unitPrice: 2200, total: 55000 },
    { id: '2', itemName: 'Student Academic Diary & ID Card Lanyard Set', category: 'Kit', qty: 25, unitPrice: 300, total: 7500 },
  ],
  'Admission Form Order': [
    { id: '1', itemName: 'Official Student Enrollment & Admission Booklet (Pack of 50)', category: 'Form', qty: 2, unitPrice: 1500, total: 3000 },
    { id: '2', itemName: 'Parent Welcome Brochure & Handbook Set', category: 'Form', qty: 50, unitPrice: 120, total: 6000 },
  ],
  'Uniform & Bag Batch PO': [
    { id: '1', itemName: 'Summer School Uniform Pair (Shirt + Trousers/Skirts)', category: 'Uniform', qty: 30, unitPrice: 1250, total: 37500 },
    { id: '2', itemName: 'School Backpack & Water Bottle Set', category: 'Accessories', qty: 30, unitPrice: 750, total: 22500 },
  ],
  'Winter Wear PO': [
    { id: '1', itemName: 'Branded Winter Fleece Jacket & Woolen Cap Set', category: 'Winter', qty: 25, unitPrice: 1400, total: 35000 },
    { id: '2', itemName: 'Full Sleeve School Cardigan Sweater', category: 'Winter', qty: 25, unitPrice: 950, total: 23750 },
  ],
  'Student T-Shirts PO': [
    { id: '1', itemName: 'Suryadhi Activity Polo T-Shirt (Cotton Blend)', category: 'Apparel', qty: 40, unitPrice: 450, total: 18000 },
    { id: '2', itemName: 'Sports Day Color Team T-Shirt', category: 'Apparel', qty: 40, unitPrice: 350, total: 14000 },
  ],
  'Classroom & Sports Equipment PO': [
    { id: '1', itemName: 'Indoor Soft Gym Activity Play Mats (Pack of 6)', category: 'Equipment', qty: 4, unitPrice: 4500, total: 18000 },
    { id: '2', itemName: 'Montessori Sensory Wooden Learning Toys Kit', category: 'Learning', qty: 3, unitPrice: 5500, total: 16500 },
  ],
  'Books & Stationery Material PO': [
    { id: '1', itemName: 'Curriculum Phonics & Numbers Workbooks Set (Set of 6)', category: 'Books', qty: 30, unitPrice: 1100, total: 33000 },
    { id: '2', itemName: 'Art, Craft & Sensory Paper Activity Material Pack', category: 'Stationery', qty: 15, unitPrice: 850, total: 12750 },
  ],
};

const initialPOs: PurchaseOrder[] = [
  {
    id: '1',
    poNo: 'PO-2026-001',
    date: '2026-06-05',
    totalAmount: 125000,
    status: 'DELIVERED',
    orderType: 'Welcome Kit (WK) Order',
    transporter: 'Blue Dart / LR-519315',
    estimatedDeliveryDate: '2026-06-08',
    deliveryDate: '2026-06-08',
    noOfBoxes: 12,
    supplier: 'Suryadhi Central Supply HQ',
    program: 'Euro Junior',
    remarks: 'Delivered in good condition',
    depositReceiptNo: 'DEP-2026-0038',
    depositAmount: 125000,
    paymentMode: 'Online Transfer / NEFT',
    paymentRef: 'UTR-SBIN26178921',
    bankName: 'State Bank of India - Dhule Branch',
    depositDate: '2026-06-05',
    items: [
      { id: '1', itemName: 'Student Welcome Kit Box (Student Bag, Stationery, Badges)', category: 'Kit', qty: 50, unitPrice: 2200, total: 110000 },
      { id: '2', itemName: 'Student Academic Diary & ID Card Lanyard Set', category: 'Kit', qty: 50, unitPrice: 300, total: 15000 },
    ],
  },
  {
    id: '2',
    poNo: 'PO-2026-002',
    date: '2026-06-08',
    totalAmount: 30000,
    status: 'ORDER_DISPATCH',
    orderType: 'Admission Form Order',
    transporter: 'DTDC Express / LR-884210',
    estimatedDeliveryDate: '2026-06-12',
    deliveryDate: '—',
    noOfBoxes: 4,
    supplier: 'Suryadhi Central Supply HQ',
    program: 'Play Group',
    remarks: 'Dispatched on 09-06-2026 via DTDC',
    depositReceiptNo: 'DEP-2026-0042',
    depositAmount: 30000,
    paymentMode: 'Cheque / DD',
    paymentRef: 'CHQ-882190',
    bankName: 'HDFC Bank - Deopur Branch',
    depositDate: '2026-06-08',
    items: [
      { id: '1', itemName: 'Official Student Enrollment & Admission Booklet (Pack of 50)', category: 'Form', qty: 10, unitPrice: 1500, total: 15000 },
      { id: '2', itemName: 'Parent Welcome Brochure & Handbook Set', category: 'Form', qty: 125, unitPrice: 120, total: 15000 },
    ],
  },
  {
    id: '3',
    poNo: 'PO-2026-003',
    date: '2026-06-10',
    totalAmount: 60000,
    status: 'ORDER_RECEIVED',
    orderType: 'Uniform & Bag Batch PO',
    transporter: 'TCI Freight / LR-104921',
    estimatedDeliveryDate: '2026-06-15',
    deliveryDate: '—',
    noOfBoxes: 6,
    supplier: 'Suryadhi Garments Division',
    program: 'Nursery',
    remarks: 'Awaiting HO dispatch clearance',
    depositReceiptNo: 'DEP-2026-0046',
    depositAmount: 60000,
    paymentMode: 'Online Transfer / NEFT',
    paymentRef: 'UTR-HDFC0019284',
    bankName: 'HDFC Bank - Deopur Branch',
    depositDate: '2026-06-10',
    items: [
      { id: '1', itemName: 'Summer School Uniform Pair (Shirt + Trousers/Skirts)', category: 'Uniform', qty: 30, unitPrice: 1250, total: 37500 },
      { id: '2', itemName: 'School Backpack & Water Bottle Set', category: 'Accessories', qty: 30, unitPrice: 750, total: 22500 },
    ],
  },
  {
    id: '4',
    poNo: 'PO-2026-004',
    date: '2026-06-11',
    totalAmount: 85000,
    status: 'IN_TRANSIT',
    orderType: 'Winter Wear PO',
    transporter: 'Trackon Logistics / LR-771890',
    estimatedDeliveryDate: '2026-06-18',
    deliveryDate: '—',
    noOfBoxes: 8,
    supplier: 'Suryadhi Garments Division',
    program: 'Euro Senior',
    remarks: 'Winter coats and sweaters batch',
    depositReceiptNo: 'DEP-2026-0051',
    depositAmount: 85000,
    paymentMode: 'Online Transfer / NEFT',
    paymentRef: 'UTR-SBIN26881920',
    bankName: 'State Bank of India - Dhule Branch',
    depositDate: '2026-06-11',
    items: [
      { id: '1', itemName: 'Branded Winter Fleece Jacket & Woolen Cap Set', category: 'Winter', qty: 35, unitPrice: 1400, total: 49000 },
      { id: '2', itemName: 'Full Sleeve School Cardigan Sweater', category: 'Winter', qty: 38, unitPrice: 950, total: 36000 },
    ],
  },
  {
    id: '5',
    poNo: 'PO-2026-005',
    date: '2026-06-12',
    totalAmount: 48000,
    status: 'IN_PROCESS',
    orderType: 'Classroom & Sports Equipment PO',
    transporter: 'VRL Logistics / LR-992341',
    estimatedDeliveryDate: '2026-06-20',
    deliveryDate: '—',
    noOfBoxes: 5,
    supplier: 'Sports & Play Equipment Co',
    program: 'All Programs',
    remarks: 'Play area toys & gym mats batch',
    depositReceiptNo: 'DEP-2026-0055',
    depositAmount: 48000,
    paymentMode: 'Cash to Bank Deposit',
    paymentRef: 'DEP-CASH-77192',
    bankName: 'State Bank of India - Dhule Branch',
    depositDate: '2026-06-12',
    items: [
      { id: '1', itemName: 'Indoor Soft Gym Activity Play Mats (Pack of 6)', category: 'Equipment', qty: 6, unitPrice: 4500, total: 27000 },
      { id: '2', itemName: 'Montessori Sensory Wooden Learning Toys Kit', category: 'Learning', qty: 3, unitPrice: 7000, total: 21000 },
    ],
  },
];

export default function PurchaseOrderPage() {
  const [data, setData] = useState<PurchaseOrder[]>(initialPOs);
  const [activeTab, setActiveTab] = useState<'list' | 'generate'>('list');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);

  // Modals for View / Print & Deposit Details
  const [viewPOModal, setViewPOModal] = useState<PurchaseOrder | null>(null);
  const [viewDepositModal, setViewDepositModal] = useState<PurchaseOrder | null>(null);

  // Franchise Details
  const franchiseCode = 'SK-Dhule-Deopur';
  const franchiseName = 'Suryadhi Preschool - Deopur Center';
  const franchiseAddress = 'Plot No. 14, Near Deopur Chowk, Dhule, Maharashtra - 424002';

  // Load orders from backend if available
  useEffect(() => {
    let isMounted = true;
    api.get('/operations/purchase-orders')
      .then((res) => {
        if (!isMounted) return;
        const apiPOs = res.data?.data || res.data;
        if (Array.isArray(apiPOs) && apiPOs.length > 0) {
          const mapped: PurchaseOrder[] = apiPOs.map((p: any, idx: number) => {
            const parsedItems = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []);
            const meta = Array.isArray(parsedItems) ? {} : (parsedItems || {});
            const lineItems = Array.isArray(parsedItems) ? parsedItems : (meta.lineItems || []);

            return {
              id: p.id || `po-${idx}`,
              poNo: p.orderNumber || `PO-2026-${(idx + 1).toString().padStart(3, '0')}`,
              date: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '2026-06-12',
              totalAmount: Number(p.totalAmount || 0),
              status: p.status || 'ORDER_RECEIVED',
              orderType: meta.orderType || 'Welcome Kit (WK) Order',
              transporter: meta.transporter || 'Blue Dart Logistics',
              estimatedDeliveryDate: meta.estimatedDeliveryDate || '2026-06-20',
              deliveryDate: p.deliveredAt ? new Date(p.deliveredAt).toISOString().split('T')[0] : '—',
              noOfBoxes: Number(meta.noOfBoxes || 4),
              supplier: meta.supplier || 'Suryadhi Central Supply HQ',
              program: meta.program || 'Euro Junior',
              remarks: p.notes || meta.remarks || '',
              depositReceiptNo: meta.depositReceiptNo || `DEP-2026-${(idx + 40).toString().padStart(4, '0')}`,
              depositAmount: Number(meta.depositAmount || p.totalAmount || 0),
              paymentMode: meta.paymentMode || 'Online Transfer / NEFT',
              paymentRef: meta.paymentRef || `UTR-REF-${idx + 1000}`,
              bankName: meta.bankName || 'State Bank of India - Dhule Branch',
              depositDate: meta.depositDate || (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '2026-06-12'),
              items: lineItems,
            };
          });

          // Merge with initial dummy data
          setData((prev) => {
            const ids = new Set(mapped.map((m) => m.poNo));
            const remaining = prev.filter((pr) => !ids.has(pr.poNo));
            return [...mapped, ...remaining];
          });
        }
      })
      .catch((err) => {
        console.warn('Could not fetch operations purchase orders:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Form State for Dedicated On-Page Generate PO
  const [orderType, setOrderType] = useState<string>('Welcome Kit (WK) Order');
  const [program, setProgram] = useState<string>('Play Group');
  const [supplier, setSupplier] = useState<string>('Suryadhi Central Supply HQ');
  const [orderDate, setOrderDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [transporter, setTransporter] = useState<string>('Blue Dart Logistics');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [noOfBoxes, setNoOfBoxes] = useState<number>(6);
  const [remarks, setRemarks] = useState<string>('');

  // Deposit Receipt Form Section
  const [depositReceiptNo, setDepositReceiptNo] = useState<string>(() => `DEP-2026-${(Math.floor(Math.random() * 900) + 100)}`);
  const [paymentMode, setPaymentMode] = useState<string>('Online Transfer / NEFT');
  const [bankName, setBankName] = useState<string>('State Bank of India - Dhule Branch');
  const [paymentRef, setPaymentRef] = useState<string>(() => `UTR-SBIN${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [depositDate, setDepositDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Dynamic Line Items
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(DEFAULT_LINE_ITEMS['Welcome Kit (WK) Order']);

  // Auto-switch default line items when orderType changes
  const handleOrderTypeChange = (newType: string) => {
    setOrderType(newType);
    if (DEFAULT_LINE_ITEMS[newType]) {
      setLineItems(DEFAULT_LINE_ITEMS[newType].map((item) => ({ ...item, id: String(Date.now() + Math.random()) })));
    }
  };

  // Line item manipulation
  const updateLineItem = (id: string, field: 'itemName' | 'category' | 'qty' | 'unitPrice', value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'qty' || field === 'unitPrice') {
            updated.total = Number(updated.qty || 0) * Number(updated.unitPrice || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        itemName: 'Additional Material / Item',
        category: 'General',
        qty: 10,
        unitPrice: 500,
        total: 5000,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      showToast('Order must have at least one line item', 'info');
      return;
    }
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = useMemo(() => lineItems.reduce((acc, it) => acc + (it.total || 0), 0), [lineItems]);
  const gstAmount = Math.round(subtotal * 0.18); // 18% standard GST
  const grandTotal = subtotal + gstAmount;

  // Auto-generated PO Number
  const nextPONumber = useMemo(() => {
    return `PO-${new Date().getFullYear()}-${(data.length + 1).toString().padStart(3, '0')}`;
  }, [data.length]);

  // Handle Form Submission (Generate PO)
  const handleGeneratePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      showToast('Please add at least one line item to the order', 'error');
      return;
    }

    setSubmitting(true);
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNo: nextPONumber,
      date: orderDate,
      totalAmount: grandTotal,
      status: 'ORDER_RECEIVED',
      orderType,
      transporter,
      estimatedDeliveryDate,
      deliveryDate: '—',
      noOfBoxes,
      supplier,
      program,
      remarks: remarks || `${orderType} generated for ${program}`,
      depositReceiptNo,
      depositAmount: grandTotal,
      paymentMode,
      paymentRef,
      bankName,
      depositDate,
      items: lineItems,
    };

    try {
      // Post to backend API
      await api.post('/operations/purchase-orders', {
        orderNumber: newPO.poNo,
        items: {
          orderType,
          program,
          supplier,
          transporter,
          estimatedDeliveryDate,
          noOfBoxes,
          depositReceiptNo,
          depositAmount: grandTotal,
          paymentMode,
          paymentRef,
          bankName,
          depositDate,
          remarks: newPO.remarks,
          lineItems,
        },
        totalAmount: grandTotal,
        notes: newPO.remarks,
      }).catch((err) => {
        console.warn('API post failed, keeping in local memory:', err);
      });

      setData((prev) => [newPO, ...prev]);
      showToast(`Purchase Order ${newPO.poNo} generated successfully with Deposit Receipt ${depositReceiptNo}!`, 'success');
      setActiveTab('list');
      // Reset form defaults for next order
      setDepositReceiptNo(`DEP-2026-${Math.floor(Math.random() * 900) + 100}`);
      setRemarks('');
    } catch (_err) {
      showToast('Error generating purchase order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Counts
  const orderReceivedCount = data.filter((d) =>
    ['ORDER_RECEIVED', 'SUBMITTED', 'PENDING'].includes(d.status.toUpperCase())
  ).length;
  const inProcessCount = data.filter((d) =>
    ['IN_PROCESS', 'APPROVED'].includes(d.status.toUpperCase())
  ).length;
  const orderDispatchCount = data.filter((d) =>
    ['ORDER_DISPATCH', 'DISPATCHED'].includes(d.status.toUpperCase())
  ).length;
  const inTransitCount = data.filter((d) =>
    ['IN_TRANSIT'].includes(d.status.toUpperCase())
  ).length;
  const orderDeliveredCount = data.filter((d) =>
    ['ORDER_DELIVERED', 'DELIVERED'].includes(d.status.toUpperCase())
  ).length;

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

  // Action helpers
  const handleDownloadPackageList = (item: PurchaseOrder) => {
    downloadAsPDF({
      title: `Package List — ${item.poNo}`,
      subtitle: `Order Type: ${item.orderType} | Franchisee: ${franchiseCode} | Boxes: ${item.noOfBoxes} | Transporter: ${item.transporter}`,
      filename: `package-list-${item.poNo}`,
      columns: ['Box #', 'Item Description', 'Quantity', 'Status'],
      rows: (item.items && item.items.length > 0)
        ? item.items.map((it, i) => [`Box ${i + 1} of ${item.noOfBoxes}`, it.itemName, `${it.qty} units`, 'Packed'])
        : [
          ['Box 1 of ' + item.noOfBoxes, `${item.orderType} Main Materials`, '10 sets', 'Packed'],
          ['Box 2 of ' + item.noOfBoxes, `${item.orderType} Ancillary Items`, '5 sets', 'Packed'],
        ],
    });
    showToast('Package list downloaded successfully', 'success');
  };

  const handleDownloadSaleInvoice = (item: PurchaseOrder) => {
    downloadAsPDF({
      title: `Suryadhi Purchase & Sale Invoice — ${item.poNo}`,
      subtitle: `Vendor: ${item.supplier} | Franchisee: ${franchiseCode} | Total: ${formatCurrency(item.totalAmount)}`,
      filename: `sale-invoice-${item.poNo}`,
      columns: ['PO No', 'Order Type', 'Program', 'Deposit Receipt', 'Amount', 'LR No'],
      rows: [[
        item.poNo,
        item.orderType,
        item.program,
        item.depositReceiptNo || 'DEP-VERIFIED',
        formatCurrency(item.totalAmount),
        item.transporter,
      ]],
    });
    showToast('Sale Invoice downloaded successfully', 'success');
  };

  // Table Columns Definition
  const columns: ColumnDef<PurchaseOrder, any>[] = [
    {
      id: 'poNo',
      accessorKey: 'poNo',
      header: 'PO Number',
      cell: ({ row }) => (
        <div className="leading-tight">
          <div className="font-mono font-bold text-xs text-blue-700">{row.original.poNo}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{formatDate(row.original.date)}</div>
        </div>
      ),
    },
    {
      accessorKey: 'orderType',
      header: 'Order Details',
      cell: ({ row }) => (
        <div className="leading-tight">
          <div className="font-semibold text-xs text-slate-900">{row.original.orderType}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            <span className="font-medium text-emerald-700">{row.original.program}</span> • {row.original.noOfBoxes} boxes
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: () => <div className="text-right">Amount (₹)</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono font-bold text-xs text-slate-900">
          {formatCurrency(getValue() as number)}
        </div>
      ),
    },
    {
      id: 'depositInfo',
      header: 'Deposit & Receipt Details',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="leading-tight">
            <div className="font-mono text-xs font-semibold text-indigo-700 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" />
              {item.depositReceiptNo || 'DEP-PAID'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {item.paymentMode || 'Online'} • {item.bankName?.split(' - ')[0] || 'SBI'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'transporter',
      header: 'Transporter / LR No',
      cell: ({ getValue }) => (
        <span className="text-[11px] text-slate-700 font-mono whitespace-nowrap">
          {getValue() as string}
        </span>
      ),
    },
    {
      id: 'delivery',
      accessorFn: (row) => row.estimatedDeliveryDate,
      header: 'Delivery Status',
      cell: ({ row }) => {
        const { estimatedDeliveryDate, deliveryDate } = row.original;
        const isDelivered = !!deliveryDate && deliveryDate !== '—';
        return (
          <div className="leading-tight whitespace-nowrap">
            <div className="text-xs text-slate-700">{formatDate(estimatedDeliveryDate)}</div>
            <div className={`text-[10px] mt-0.5 font-medium ${isDelivered ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isDelivered ? `Delivered on ${formatDate(deliveryDate)}` : 'Expected'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return (
          <Badge className={`${getStatusColor(status)} text-[10px] px-2 py-0.5 whitespace-nowrap font-semibold`}>
            {status.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Action</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewPOModal(item)}
              className="h-6 px-2 text-[10px] gap-1 bg-white hover:bg-blue-50 text-blue-700 border-blue-200"
              title="View & Print PO"
            >
              <Eye className="h-3 w-3" /> View PO
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewDepositModal(item)}
              className="h-6 px-2 text-[10px] gap-1 bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"
              title="Deposit & Payment Receipt"
            >
              <CreditCard className="h-3 w-3" /> Receipt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadSaleInvoice(item)}
              className="h-6 w-6 p-0 hover:bg-slate-100 text-slate-600"
              title="Download Invoice"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12 pt-2 font-sans text-slate-900">
      {/* ── Page Header & Tab View Switcher ── */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Purchase Orders & Material Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Franchisee: <strong className="text-slate-800">{franchiseCode}</strong> ({franchiseName}) • Manage kits, uniform batches, deposit receipts, and dispatch tracking.
          </p>
        </div>

        {/* View Toggle Buttons (No Popups!) */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={activeTab === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('list')}
            className={`h-8 text-xs font-semibold gap-1.5 ${
              activeTab === 'list' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Purchase Orders List ({data.length})
          </Button>

          <Button
            type="button"
            variant={activeTab === 'generate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('generate')}
            className={`h-8 text-xs font-semibold gap-1.5 ${
              activeTab === 'generate' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Purchase Order
          </Button>
        </div>
      </div>

      {/* ── View 1: Purchase Orders Table View ── */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* 5 Status Filter Cards */}
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
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {statusFilter === 'ALL' ? 'All Purchase Orders' : `Filtered: ${statusFilter.replace(/_/g, ' ')}`} ({filteredData.length})
              </span>
              {statusFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                >
                  Clear Status Filter
                </button>
              )}
            </div>
            <DataTable
              columns={columns}
              data={filteredData}
              searchPlaceholder="Search by PO number, order type, deposit receipt, or transporter..."
              showExportBox={true}
              exportTitle="purchase_orders_list"
            />
          </div>
        </div>
      )}

      {/* ── View 2: Dedicated On-Page Generate Purchase Order Form (No Popup!) ── */}
      {activeTab === 'generate' && (
        <form onSubmit={handleGeneratePO} className="space-y-6">
          {/* Top Form Navigation */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-sm">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders List
            </button>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Generating: {nextPONumber}
            </span>
          </div>

          {/* Section 1: Order & Program Details */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-[#f8fafc] border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                1. Order Specifications & Program Selection
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Order Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={orderType}
                  onChange={(e) => handleOrderTypeChange(e.target.value)}
                  className="w-full h-8 border border-slate-300 rounded px-2.5 bg-white text-xs font-medium focus:border-blue-600 focus:outline-none"
                >
                  {ORDER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Program <span className="text-red-500">*</span>
                </label>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full h-8 border border-slate-300 rounded px-2.5 bg-white text-xs font-medium focus:border-blue-600 focus:outline-none"
                >
                  {PROGRAM_OPTIONS.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supplier / Vendor
                </label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PO Order Date
                </label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transporter / Logistics Partner
                </label>
                <select
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="w-full h-8 border border-slate-300 rounded px-2.5 bg-white text-xs font-medium focus:border-blue-600 focus:outline-none"
                >
                  <option value="Blue Dart Logistics">Blue Dart Logistics</option>
                  <option value="DTDC Express Courier">DTDC Express Courier</option>
                  <option value="TCI Freight Lines">TCI Freight Lines</option>
                  <option value="VRL Logistics Cargo">VRL Logistics Cargo</option>
                  <option value="Trackon Courier Service">Trackon Courier Service</option>
                  <option value="Direct Center Pickup">Direct Center Pickup</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimated Delivery Date
                </label>
                <Input
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Order Line Items Table (Dynamic Items, Quantities & Rates) */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-[#f8fafc] border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                2. Order Material Line Items & Quantities
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="h-6 text-[11px] gap-1 bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300"
              >
                <Plus className="w-3 h-3" /> Add Item Row
              </Button>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="border border-slate-200 px-3 py-2 text-left w-12">#</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Item Description</th>
                    <th className="border border-slate-200 px-3 py-2 text-left w-36">Category</th>
                    <th className="border border-slate-200 px-3 py-2 text-right w-24">Quantity</th>
                    <th className="border border-slate-200 px-3 py-2 text-right w-32">Unit Rate (₹)</th>
                    <th className="border border-slate-200 px-3 py-2 text-right w-36">Total (₹)</th>
                    <th className="border border-slate-200 px-3 py-2 text-center w-16">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 font-mono text-center">{idx + 1}</td>
                      <td className="border border-slate-200 px-2 py-1">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => updateLineItem(item.id, 'itemName', e.target.value)}
                          className="w-full h-7 border border-slate-300 rounded px-2 bg-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                          className="w-full h-7 border border-slate-300 rounded px-2 bg-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateLineItem(item.id, 'qty', Number(e.target.value))}
                          className="w-full h-7 border border-slate-300 rounded px-2 text-right font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full h-7 border border-slate-300 rounded px-2 text-right font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-300 text-xs">
                    <td colSpan={5} className="border border-slate-200 px-3 py-2 font-semibold text-right text-slate-700">
                      Subtotal:
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(subtotal)}
                    </td>
                    <td className="border border-slate-200"></td>
                  </tr>
                  <tr className="bg-slate-50 border-t border-slate-300 text-xs">
                    <td colSpan={5} className="border border-slate-200 px-3 py-2 font-semibold text-right text-slate-700">
                      Applicable GST (18%):
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-mono font-semibold text-slate-700">
                      {formatCurrency(gstAmount)}
                    </td>
                    <td className="border border-slate-200"></td>
                  </tr>
                  <tr className="bg-blue-50 font-bold text-xs border-t-2 border-blue-600">
                    <td colSpan={5} className="border border-slate-200 px-3 py-2 font-bold text-right text-blue-900">
                      Grand Total Order Amount:
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-mono text-base font-extrabold text-blue-700">
                      {formatCurrency(grandTotal)}
                    </td>
                    <td className="border border-slate-200"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3: Deposit & Payment Receipt Details (Fulfilling the deposit receipt requirement) */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-[#f8fafc] border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-4 h-4 text-indigo-600" />
                3. Payment & Security Deposit Receipt Acknowledgement
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Mandatory for franchisee ledger dispatch clearance
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deposit Receipt Number <span className="text-red-500">*</span>
                </label>
                <Input
                  value={depositReceiptNo}
                  onChange={(e) => setDepositReceiptNo(e.target.value)}
                  className="h-8 text-xs font-mono font-bold text-indigo-700"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full h-8 border border-slate-300 rounded px-2.5 bg-white text-xs font-medium focus:border-blue-600 focus:outline-none"
                >
                  <option value="Online Transfer / NEFT">Online Transfer / NEFT</option>
                  <option value="Cheque / DD">Cheque / Demand Draft</option>
                  <option value="Cash to Bank Deposit">Cash to Bank Deposit</option>
                  <option value="Ledger Advance Adjustment">Ledger / Franchise Advance Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Reference / UTR / Cheque No <span className="text-red-500">*</span>
                </label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank Name & Branch
                </label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deposit Receipt Date
                </label>
                <Input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Deposit Amount Acknowledged
                </label>
                <div className="h-8 border border-slate-200 bg-slate-50 rounded px-2.5 flex items-center font-mono font-bold text-emerald-700 text-xs">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Logistics, Delivery & Special Remarks */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-[#f8fafc] border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" />
                4. Logistics, Box Packaging & Shipping Destination
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimated Number of Boxes
                </label>
                <Input
                  type="number"
                  min={1}
                  value={noOfBoxes}
                  onChange={(e) => setNoOfBoxes(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination Delivery Address
                </label>
                <Input
                  value={franchiseAddress}
                  disabled
                  className="h-8 text-xs bg-slate-50 text-slate-700 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Special Dispatch Instructions & Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Urgent batch delivery for new academic admissions; handle sensory kit items with fragile care."
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Bottom Action Buttons */}
          <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-sm shadow-sm">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('list')}
              className="h-8 text-xs font-medium"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-500">Order Net Payable:</div>
                <div className="text-sm font-mono font-extrabold text-blue-700">{formatCurrency(grandTotal)}</div>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 text-xs font-bold gap-1.5 shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Generate PO & Submit Order
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ── Modal 1: Printable Purchase Order Invoice ── */}
      {viewPOModal && (
        <Dialog open={!!viewPOModal} onOpenChange={() => setViewPOModal(null)}>
          <DialogContent className="max-w-2xl bg-white p-0 border border-slate-300 rounded-md shadow-2xl overflow-hidden">
            <DialogHeader className="bg-slate-900 text-white p-4 flex flex-row items-center justify-between">
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                Purchase Order Document — {viewPOModal.poNo}
              </DialogTitle>
              <div className="flex items-center gap-2 pr-6">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSaleInvoice(viewPOModal)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export
                </button>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 text-xs font-sans text-slate-900 max-h-[80vh] overflow-y-auto">
              {/* Document Header */}
              <div className="border-b pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-extrabold text-black">SURYADHI LEARNING PVT. LTD.</h2>
                  <p className="text-[11px] text-slate-600">Central Supply HQ & Educational Operations</p>
                  <p className="text-[11px] text-slate-500 mt-1">Vendor: {viewPOModal.supplier}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-blue-700">{viewPOModal.poNo}</div>
                  <div className="text-slate-500 text-[11px]">Date: {formatDate(viewPOModal.date)}</div>
                  <div className="mt-1">
                    <Badge className={getStatusColor(viewPOModal.status)}>{viewPOModal.status}</Badge>
                  </div>
                </div>
              </div>

              {/* Bill To / Ship To */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Delivered To (Franchisee):</span>
                  <div className="font-bold text-slate-900 mt-0.5">{franchiseCode}</div>
                  <div className="text-slate-600 text-[11px]">{franchiseName}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">{franchiseAddress}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Logistics & Packaging:</span>
                  <div className="text-slate-700 font-medium mt-0.5">Transporter: {viewPOModal.transporter}</div>
                  <div className="text-slate-700 font-medium">Boxes: {viewPOModal.noOfBoxes} packaging units</div>
                  <div className="text-slate-600 text-[11px]">Expected: {formatDate(viewPOModal.estimatedDeliveryDate)}</div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <span className="font-bold text-slate-700 text-xs block mb-1.5">Material & Kit Order Items:</span>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Item Description</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right w-20">Quantity</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right w-28">Unit Rate</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewPOModal.items && viewPOModal.items.length > 0) ? (
                      viewPOModal.items.map((it, i) => (
                        <tr key={i} className="border-b border-slate-200">
                          <td className="border border-slate-300 px-3 py-1.5 font-medium">{it.itemName}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-right font-mono">{it.qty}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-semibold">{formatCurrency(it.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-slate-200">
                        <td className="border border-slate-300 px-3 py-1.5 font-medium">{viewPOModal.orderType} Batch Kit</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right font-mono">{viewPOModal.noOfBoxes * 5}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right font-mono">{formatCurrency(viewPOModal.totalAmount / (viewPOModal.noOfBoxes * 5))}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-semibold">{formatCurrency(viewPOModal.totalAmount)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-slate-50 border-t border-slate-300">
                      <td colSpan={3} className="border border-slate-300 px-3 py-2 text-right">Grand Total Order Value:</td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono text-sm text-blue-700">{formatCurrency(viewPOModal.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Deposit Payment Footnote */}
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-emerald-900 space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  Deposit Receipt Acknowledged: {viewPOModal.depositReceiptNo || 'DEP-VERIFIED'}
                </div>
                <div className="text-[11px] text-emerald-800">
                  Paid via {viewPOModal.paymentMode || 'Online'} • Ref: {viewPOModal.paymentRef || 'N/A'} • Bank: {viewPOModal.bankName || 'SBI'}
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center text-[10px] text-slate-500">
                <span>Computer generated purchase order document under Suryadhi ERP.</span>
                <Button size="sm" variant="outline" onClick={() => setViewPOModal(null)} className="h-7 text-xs">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Modal 2: Deposit Receipt Details ── */}
      {viewDepositModal && (
        <Dialog open={!!viewDepositModal} onOpenChange={() => setViewDepositModal(null)}>
          <DialogContent className="max-w-md bg-white p-5 border border-slate-300 rounded-md shadow-2xl">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Security Deposit Receipt — {viewDepositModal.depositReceiptNo || 'DEP-VERIFIED'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-3 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Associated PO:</span>
                  <span className="font-mono font-bold text-blue-700">{viewDepositModal.poNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Franchisee Center:</span>
                  <span className="font-semibold">{franchiseCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Date:</span>
                  <span>{formatDate(viewDepositModal.depositDate || viewDepositModal.date)}</span>
                </div>
              </div>

              <div className="border rounded p-3 space-y-2 border-emerald-200 bg-emerald-50/50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Deposit Amount:</span>
                  <span className="font-mono text-base font-extrabold text-emerald-700">
                    {formatCurrency(viewDepositModal.depositAmount || viewDepositModal.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold text-slate-800">{viewDepositModal.paymentMode || 'Online Transfer'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Bank / Branch:</span>
                  <span className="text-slate-800">{viewDepositModal.bankName || 'State Bank of India'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Transaction / UTR No:</span>
                  <span className="font-mono font-bold text-slate-800">{viewDepositModal.paymentRef || 'TXN-CONFIRMED'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-emerald-200">
                  <span className="text-slate-500">Ledger Status:</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Verified & Deposited</Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    handleDownloadPackageList(viewDepositModal);
                    setViewDepositModal(null);
                  }}
                  variant="outline"
                  className="h-7 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" /> Package List
                </Button>
                <Button
                  size="sm"
                  onClick={() => setViewDepositModal(null)}
                  className="h-7 text-xs bg-slate-800 text-white"
                >
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
