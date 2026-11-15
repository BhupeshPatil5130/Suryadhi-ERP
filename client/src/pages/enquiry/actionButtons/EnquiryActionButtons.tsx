import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, Share, Eye, MessageCircle, Download } from 'lucide-react';

interface EnquiryActionButtonsProps {
  id: string;
}

export default function EnquiryActionButtons({ id }: EnquiryActionButtonsProps) {
  return (
    <div className="flex items-center gap-1 text-slate-600">
      <Link to={`/enquiry/${id}/edit`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="Edit">
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <span className="text-slate-300">|</span>
      <Link to={`/enquiry/${id}/receipts`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-blue-700" title="View Receipt">
          <Eye className="h-3.5 w-3.5" />
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
      <span className="text-slate-300">|</span>
      <Link to={`/enquiry/${id}/receipts`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 text-blue-700" title="Download">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
