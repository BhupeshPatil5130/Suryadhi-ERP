import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileEdit, Eye, PlusCircle, Forward, X, Plane, Pen, ReceiptText } from 'lucide-react';

interface AdmissionActionButtonsProps {
  id: string;
}

export default function AdmissionActionButtons({ id }: AdmissionActionButtonsProps) {
  return (
    <div className="flex flex-col gap-1 w-[80px]">
      {/* Row 1: Edit | View Receipt (Opens Page 1) */}
      <div className="flex items-center justify-between relative">
        <Link to={`/admissions/${id}/edit`}>
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Update Admission">
            <FileEdit className="h-[14px] w-[14px] text-black stroke-[2.5]" />
          </Button>
        </Link>
        <div className="w-[1px] h-[14px] bg-slate-300"></div>
        <Link to={`/admissions/${id}/receipt`}>
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="View (View Receipt)">
            <Eye className="h-[14px] w-[14px] text-blue-700 stroke-[2.5]" />
          </Button>
        </Link>
      </div>

      {/* Row 2: Add Receipt (Opens Page 2) | Graduate to */}
      <div className="flex items-center justify-between relative">
        <Link to={`/admissions/${id}/receipt?tab=new`}>
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Add Receipt">
            <ReceiptText className="h-[14px] w-[14px] text-emerald-700 stroke-[2.5]" />
          </Button>
        </Link>
        <div className="w-[1px] h-[14px] bg-slate-300"></div>
        <Link to={`/graduation?admissionId=${id}`}>
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title=
            "Graduate to">
            <Forward className="h-[14px] w-[14px] text-black stroke-[2.5]" />
          </Button>
        </Link>
      </div>

      {/* Row 3: Quit | Transfer Out */}
      <div className="flex items-center justify-between relative pl-1">
        <div className="w-[1px] h-[14px] bg-slate-300 absolute left-0"></div>
        <Link to={`/quit-admission?admissionId=${id}`}>
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Quit Admission">
            <X className="h-[14px] w-[14px] text-black stroke-[3.5]" />
          </Button>
        </Link>
        <div className="w-[1px] h-[14px] bg-slate-300"></div>
        <Link to={`/transfer-out?admissionId=${id}`}>
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Transfer Out">
            <Plane className="h-[14px] w-[14px] text-black stroke-[2.5]" />
          </Button>
        </Link>
      </div>

      {/* Row 4: Name/DOB Change */}
      <div className="flex items-center relative pl-1">
        <div className="w-[1px] h-[14px] bg-slate-300 absolute left-0"></div>
        <Link to={`/name-change?admissionId=${id}`}>
          <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Name/DOB Change">
            <Pen className="h-[14px] w-[14px] text-black stroke-[2.5]" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export { AdmissionActionButtons };
