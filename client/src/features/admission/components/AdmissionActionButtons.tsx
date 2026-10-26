import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileEdit, Banknote, FileText, Forward, X, Plane, Pen, Info } from 'lucide-react';

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
    <div className=flex flex-col gap-1 w-[80px]>
      {/* Row 1: Edit | View/Add Receipts */}
      <div className=flex items-center justify-between relative>
        <Link to={/admissions//edit}>
          <Button variant=ghost className=h-5 w-5 p-0 hover:bg-slate-200 rounded-none title=Update Admission>
            <FileEdit className=h-[14px] w-[14px] text-black stroke-[2.5] />
          </Button>
        </Link>
        <div className=w-[1px] h-[14px] bg-slate-300></div>
        <Link to={/admissions//receipt}>
          <Button variant=ghost className=h-5 w-5 p-0 hover:bg-slate-200 rounded-none title=View/Add Receipts>
            <Banknote className=h-[14px] w-[14px] text-black stroke-[2.5] />
          </Button>
        </Link>
      </div>

      {/* Row 2: Invoice (changed from Online Payment) | Transfer Student */}
      <div className=flex items-center justify-between relative>
        <Link to={/admissions//receipt}>
          <Button variant=ghost className=h-5 w-5 p-0 hover:bg-slate-200 rounded-none title=Invoice>
            <FileText className=h-[14px] w-[14px] text-black stroke-[2.5] />
          </Button>
        </Link>
        <div className=w-[1px] h-[14px] bg-slate-300></div>
        <Link to={/transfer-out?admissionId=}>
          <Button variant=ghost className=h-5 w-5 p-0 hover:bg-slate-200 rounded-none title=Transfer Student>
            <Forward className=h-[14px] w-[14px] text-black stroke-[2.5] />
          </Button>
        </Link>
      </div>

      {/* Row 3: Quit Admission | Relocation/Transfer */}
      <div className=flex items-center justify-between relative pl-1>
        <div className=w-[1px] h-[14px] bg-slate-300 absolute left-0></div>
        <Link to={/quit-admission?admissionId=}>
          <Button variant=ghost className=h-5 w-5 p-0 hover:bg-slate-200 rounded-none title=Quit Admission>
            <X className=h-[14px] w-[14px] text-black stroke-[3.5] />
          </Button>
        </Link>
        <div className=w-[1px] h-[14px] bg-slate-300></div>
        <Link to={/transfers/manage?admissionId=}>
          <Button variant=ghost className=h-5 w-5 p-0 hover:bg-slate-200 rounded-none title=Relocation/Transfer>
            <Plane className=h-[14px] w-[14px] text-black stroke-[2.5] />
          </Button>
        </Link>
      </div>

      {/* Row 4: Name/DOB Change | Forecasted Royalty */}
      <div className=flex items-center justify-between relative pl-1>
        <div className=w-[1px] h-[14px] bg-slate-300 absolute left-0></div>
        <Link to={/name-change?admissionId=}>
          <Button variant=ghost className=h-5 w-5 p-0 hover:bg-slate-200 rounded-none title=Name/DOB Change>
            <Pen className=h-[14px] w-[14px] text-black stroke-[2.5] />
          </Button>
        </Link>
        <div className=w-[1px] h-[14px] bg-slate-300></div>
        <Link to={/franchisee/royalty-forecast?admissionId=}>
          <Button variant=ghost className=h-5 w-5 p-0 hover:bg-slate-200 rounded-none title=Forecasted Royalty>
            <Info className=h-[14px] w-[14px] text-black stroke-[2.5] />
          </Button>
        </Link>
      </div>
    </TooltipProvider>
  );
}

export default AdmissionActionButtons;
