import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, MessageCircle, Forward, FileEdit, Download } from 'lucide-react';

interface EnquiryActionButtonsProps {
  id: string;
  studentName?: string;
  parentEmail?: string;
}

export default function EnquiryActionButtons({ id, studentName = 'Student', parentEmail = '' }: EnquiryActionButtonsProps) {
  const handleDownload = () => {
    const docContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Enquiry Document - ${studentName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #333; max-width: 800px; margin: 0 auto; }
    h2 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    td, th { border: 1px solid #ddd; padding: 10px; font-size: 13px; }
    th { background: #f8fafc; text-align: left; }
    .footer { margin-top: 30px; font-size: 11px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <h2>SŪNOIAKIDS™ Pre-School — Enquiry & Admission Form</h2>
  <table>
    <tr><th>Enquiry ID</th><td>${id}</td></tr>
    <tr><th>Student Name</th><td>${studentName}</td></tr>
    <tr><th>Parent / Enquirer Email</th><td>${parentEmail || 'N/A'}</td></tr>
    <tr><th>Document Type</th><td>Receipt / Enquiry Summary</td></tr>
    <tr><th>Amount</th><td>₹500.00 (Particular: Admission)</td></tr>
    <tr><th>Generated Date</th><td>${new Date().toLocaleDateString('en-GB')}</td></tr>
    <tr><th>Status</th><td>Registered</td></tr>
  </table>
  <br/>
  <p style="font-size: 12px; color: #555;">
    * This document certifies the enquiry registration and online admission form record under Suryadhi Education Management System.
  </p>
  <div class="footer">Generated from SEMS Portal — Suryadhi Learning Pvt. Ltd.</div>
</body>
</html>`;
    const blob = new Blob([docContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Enquiry_${studentName.replace(/\s+/g, '_')}_${id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-1 text-slate-600 whitespace-nowrap">
      {/* 1. View */}
      <Link to={`/enquiry/${id}/edit`}>
        <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-slate-100 text-slate-700 font-medium text-xs gap-1" title="View">
          <FileEdit className="h-[14px] w-[14px] text-black stroke-[2.5]" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>

      {/* 2. View Receipt (renamed from Fees Receipt, icon changed to Eye to match Admission Form) */}
      <Link to={`/enquiry/${id}/receipts`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-blue-700" title="View Receipt">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>

      {/* 3. Graduate To (Convert to Admission) */}
      <Link to={`/enquiry/${id}/convert`}>
        <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-blue-50 text-blue-700 font-medium text-xs gap-1" title="Graduate To">
          <Forward className="h-[14px] w-[14px] text-black stroke-[2.5]" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>

      {/* 4. Follow Up */}
      <Link to={`/enquiry/${id}/follow-up`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-amber-700" title="Follow Up">
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>

      {/* 5. Download Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-slate-100 text-blue-700"
        title="Download"
        onClick={handleDownload}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
