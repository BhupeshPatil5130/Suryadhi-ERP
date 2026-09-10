import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { FileEdit, Banknote, CreditCard, Forward, X, Plane, Pen, Info } from 'lucide-react';

interface AdmissionActionButtonsProps {
  id: string;
}

/**
 * 8 Action Buttons as per ERP spec:
 * 1. Edit & View
 * 2. Receipt
 * 3. Add Online Payment (Invoice)
 * 4. Transfer Student (Graduate to)
 * 5. Quit Admission
 * 6. Relocation / Transfer (Transfer Out)
 * 7. Name / DOB Change
 * 8. Forecasted Royalty (View Royalty)
 */
export function AdmissionActionButtons({ id }: AdmissionActionButtonsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-1 w-[80px]">
        {/* Row 1: Edit & View | Receipt */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/edit`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <FileEdit className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Edit & View</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/receipt`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <Banknote className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Receipt</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Row 2: Add Online Payment (Invoice) | Transfer Student (Graduate to) */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/receipt?tab=new`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <CreditCard className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Add Online Payment</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/graduation?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <Forward className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Graduate to</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Row 3: Quit Admission | Relocation / Transfer (Transfer Out) */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/quit?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <X className="h-[14px] w-[14px] text-black stroke-[3.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Quit Admission</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/transfer-out?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <Plane className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Transfer Out</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Row 4: Name/DOB Change | Forecasted Royalty (View Royalty) */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/name-change?admissionId=${id}`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <Pen className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Name / DOB Change</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/royalty`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <Info className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">View Royalty</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
