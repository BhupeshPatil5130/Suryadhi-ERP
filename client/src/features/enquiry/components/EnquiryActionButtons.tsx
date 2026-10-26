import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Banknote, Share2, MessageSquare, Printer, Edit } from 'lucide-react';

interface EnquiryActionButtonsProps {
  id: string;
}

export default function EnquiryActionButtons({ id }: EnquiryActionButtonsProps) {
  return (
    <div className="flex flex-col gap-1 w-[100px]">
      {/* Row 1: View | Edit */}
      <div className="flex items-center justify-between">
        <Link to={`/enquiry/${id}`} title="View Enquiry">
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
            <Eye className="h-[13px] w-[13px] text-black stroke-[2.5]" />
          </Button>
        </Link>
        <div className="w-[1px] h-[14px] bg-slate-300" />
        <Link to={`/enquiry/${id}/edit`} title="Edit Enquiry">
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
            <Edit className="h-[13px] w-[13px] text-black stroke-[2.5]" />
          </Button>
        </Link>
      </div>

      {/* Row 2: Fees Receipt | Convert to Admission */}
      <div className="flex items-center justify-between">
        <Link to={`/enquiry/${id}/receipts`} title="Fees Receipt">
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
            <Banknote className="h-[13px] w-[13px] text-black stroke-[2.5]" />
          </Button>
        </Link>
        <div className="w-[1px] h-[14px] bg-slate-300" />
        <Link to={`/enquiry/${id}/convert`} title="Convert to Admission">
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
            <Share2 className="h-[13px] w-[13px] text-black stroke-[2.5]" />
          </Button>
        </Link>
      </div>

      {/* Row 3: Follow Up | Print */}
      <div className="flex items-center justify-between">
        <Link to={`/enquiry/${id}/follow-up`} title="Follow Up">
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
            <MessageSquare className="h-[13px] w-[13px] text-black stroke-[2.5]" />
          </Button>
        </Link>
        <div className="w-[1px] h-[14px] bg-slate-300" />
        <Link to={`/enquiry/${id}/receipts`} title="Print Receipt">
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
            <Printer className="h-[13px] w-[13px] text-black stroke-[2.5]" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
