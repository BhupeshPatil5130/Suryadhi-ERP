import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { FileEdit, Eye, PlusCircle, Forward, X, Plane, Pen } from 'lucide-react';

interface AdmissionActionButtonsProps {
  id: string;
}

/**
 * Action Buttons as per ERP spec:
 * 1. Edit Admission
 * 2. View Receipt (Opens Page 1: View Receipt)
 * 3. Add Receipt (Opens Page 2: New Receipt)
 * 4. Transfer Student (Graduate to)
 * 5. Quit Admission
 * 6. Relocation / Transfer (Transfer Out)
 * 7. Name / DOB Change
 */
export function AdmissionActionButtons({ id }: AdmissionActionButtonsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-1 w-[80px]">
        {/* Row 1: Edit | View Receipt (Opens Page 1) */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/edit`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <FileEdit className="h-[14px] w-[14px] text-black stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Edit Admission</p></TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-[14px] bg-slate-300"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/receipt`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <Eye className="h-[14px] w-[14px] text-blue-700 stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">View (View Receipt)</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Row 2: Add Receipt (Opens Page 2) | Transfer Student (Graduate to) */}
        <div className="flex items-center justify-between relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/admissions/${id}/receipt?tab=new`}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-slate-200 rounded-none">
                  <PlusCircle className="h-[14px] w-[14px] text-emerald-700 stroke-[2.5]" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Add Receipt</p></TooltipContent>
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

        {/* Row 4: Name/DOB Change */}
        <div className="flex items-center relative">
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
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AdmissionActionButtons;
