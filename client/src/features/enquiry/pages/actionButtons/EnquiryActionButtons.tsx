import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Share, Banknote, MessageCircle, Printer } from 'lucide-react';

interface EnquiryActionButtonsProps {
  id: string;
  studentName?: string;
  parentEmail?: string;
}

export default function EnquiryActionButtons({ id, studentName = 'Student', parentEmail = '' }: EnquiryActionButtonsProps) {
  const handlePrintEmail = () => {
    // Navigate to receipts view or open print
    const printContent = `
      <html><head><title>Enquiry Summary - ${studentName}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h2{color:#1e3a8a}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style></head>
      <body>
        <h2>SŪNOIAKIDS™ Pre-School — Enquiry Details</h2>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Enquiry ID:</strong> ${id}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
        <br/>
        <p>Please visit the center or portal to complete admission.</p>
        <br/><p style="color:#888;font-size:11px">Generated from SEMS Portal.</p>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(printContent); win.document.close(); win.print(); }
  };

  return (
    <div className="flex items-center gap-1 text-slate-600">
      {/* 2.1 View */}
      <Link to={`/enquiry/${id}/edit`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-slate-700" title="1. View / Edit Enquiry">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>

      {/* 2.2 Fees Receipt */}
      <Link to={`/enquiry/${id}/receipts`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-emerald-700" title="2. Fees Receipt (View + Print + Delete)">
          <Banknote className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>

      {/* 2.3 Convert to Admission */}
      <Link to={`/enquiry/${id}/convert`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-blue-700" title="3. Convert to Admission">
          <Share className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>

      {/* 2.4 Follow Up */}
      <Link to={`/enquiry/${id}/follow-up`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-amber-700" title="4. Follow Up">
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>

      {/* 2.5 Print & Email */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-slate-100 text-purple-700"
        title="5. Print & Send Receipt Email"
        onClick={handlePrintEmail}
      >
        <Printer className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
