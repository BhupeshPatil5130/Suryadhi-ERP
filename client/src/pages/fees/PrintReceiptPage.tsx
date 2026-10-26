import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download, Receipt as ReceiptIcon, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PrintReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  if (!state || !state.receipt || !state.student) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-10 text-center">
        <p className="text-muted-foreground">Receipt not found. Please select a valid receipt to print.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const { receipt, student } = state;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader 
            title="Receipt Generated" 
            description="Fee receipt has been successfully recorded."
            className="mb-0"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> PDF</Button>
          <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-lg bg-white print:shadow-none print:border-none">
        {/* Print Header */}
        <div className="bg-primary/5 p-6 border-b border-primary/10 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-inner">
              <ReceiptIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Suryadhi Learning Pvt. Ltd.</h2>
              <p className="text-sm text-muted-foreground">Pre-School Management</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase text-muted-foreground mb-1">Receipt Number</p>
            <p className="text-2xl font-mono font-bold text-foreground">{receipt.receiptNumber}</p>
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 mt-2">
              <CheckCircle2 className="w-3 h-3 mr-1" /> PAID
            </Badge>
          </div>
        </div>

        <CardContent className="p-8 space-y-8 bg-card">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Received From</p>
              <p className="text-lg font-bold">{student.fatherName || student.motherName || 'Parent'}</p>
              <p className="text-sm text-muted-foreground">Parent of: {student.studentFirstName} {student.studentLastName} ({student.uin})</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="text-sm font-medium">{formatDate(receipt.receiptDate)}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y-2 border-border bg-muted/20">
                <th className="py-3 px-4 text-left font-semibold">Description</th>
                <th className="py-3 px-4 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-4 px-4">Fee Installment</td>
                <td className="py-4 px-4 text-right font-mono">{formatCurrency(receipt.amount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/10">
                <td className="py-4 px-4 font-bold text-right">Total Received</td>
                <td className="py-4 px-4 text-right font-mono font-bold text-lg">{formatCurrency(receipt.amount)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="bg-muted/30 p-4 rounded-lg space-y-2 border border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Mode:</span>
              <span className="font-semibold">{receipt.paymentMode}</span>
            </div>
            {receipt.transactionId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference No:</span>
                <span className="font-mono">{receipt.transactionId}</span>
              </div>
            )}
            {receipt.paymentMode === 'CHEQUE' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="font-semibold">{receipt.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cheque No:</span>
                  <span className="font-mono">{receipt.chequeNumber}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
              <span className="text-muted-foreground">Amount in Words:</span>
              <span className="font-medium italic">As per numerical value shown above</span>
            </div>
          </div>

          <div className="pt-8 text-center text-sm text-muted-foreground">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>;
}
