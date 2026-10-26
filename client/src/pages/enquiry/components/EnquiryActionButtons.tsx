import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, Share, Banknote, MessageCircle } from 'lucide-react';

interface EnquiryActionButtonsProps {
  id: string;
}

export default function EnquiryActionButtons({ id }: EnquiryActionButtonsProps) {
  return (
    <div className="flex items-center gap-1 text-slate-600">
      <Link to={`/enquiry/${id}/edit`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100">
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>
      <Link to={`/enquiry/${id}/receipts`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="Fees/Receipts">
          <Banknote className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>
      <Link to={`/enquiry/${id}/convert`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="Convert to Admission">
          <Share className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>
      <Link to={`/enquiry/${id}/follow-up`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="Follow Up">
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
