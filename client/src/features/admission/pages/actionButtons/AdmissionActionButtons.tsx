import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { FileEdit, Eye, ReceiptText, FileText, Forward, X, Plane, Pen, Coins } from 'lucide-react';

interface AdmissionActionButtonsProps {
  id: string;
}

/**
 * Admission Action Buttons:
 * Row 1: Update Admission | View (View Receipt)
 * Row 2: Add Receipt | Invoice (Student Official Invoice)
 * Row 3: Graduate To | Quit Admission
 * Row 4: Transfer Out | Name/DOB Change
 * Row 5: Royalty Action Button
 */
export default function AdmissionActionButtons({ id }: AdmissionActionButtonsProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col gap-1 w-[80px]">
        {/* Row 1: Edit | View Receipt */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/edit`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Update Admission">
                  <FileEdit className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Update Admission</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/receipt`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="View">
                  <Eye className="h-[14px] w-[14px] text-blue-700 stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">View</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Row 2: Add Receipt | Invoice */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/receipt?tab=new`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Add Receipt">
                  <ReceiptText className="h-[14px] w-[14px] text-emerald-700 stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Add Receipt</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/invoice`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Invoice">
                  <FileText className="h-[14px] w-[14px] text-blue-800 stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Invoice</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Row 3: Graduate To | Quit Admission */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/graduation?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Graduate To">
                  <Forward className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Graduate To</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/quit-admission?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Quit Admission">
                  <X className="h-[14px] w-[14px] text-red-600 stroke-[3.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Quit Admission</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Row 4: Transfer Out | Name/DOB Change */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/transfer-out?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Transfer Out">
                  <Plane className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Transfer Out</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/name-change?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Name/DOB Change">
                  <Pen className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Name/DOB Change</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Row 5: Royalty Action Button */}
        <div className="flex items-center relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/franchisee/royalty-forecast?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none" title="Royalty Action Button">
                  <Coins className="h-[14px] w-[14px] text-amber-600 stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Royalty Action Button</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

export { AdmissionActionButtons };
