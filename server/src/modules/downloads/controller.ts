import { Request, Response, NextFunction } from 'express';
import { downloadService } from './service';

function sanitizeCell(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return str.replace(/"/g, '""');
}

/**
 * Shared helper — serialise a flat record[] to CSV and stream it.
 */
function sendCSV(res: Response, rows: Record<string, any>[], filename: string) {
  res.setHeader('X-Total-Count', String(rows ? rows.length : 0));
  if (!rows || rows.length === 0) {
    return res.status(200).json({ success: true, data: [], message: 'No data to export' });
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.map((h) => `"${sanitizeCell(h)}"`).join(','),
    ...rows.map((row) =>
      headers
        .map((h) => `"${sanitizeCell(row[h])}"`)
        .join(',')
    ),
  ];

  const csv = csvLines.join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.setHeader('Cache-Control', 'no-cache');
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
}

/**
 * Shared helper — return JSON payload.
 */
function sendJSON(res: Response, data: any, filename: string) {
  const total = Array.isArray(data) ? data.length : 1;
  res.setHeader('X-Total-Count', String(total));
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
  res.json({ success: true, data, total });
}

export class DownloadsController {

  async admissions(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.admissions(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'admissions');
      return sendCSV(res, rows, `admissions-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async enquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.enquiries(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'enquiries');
      return sendCSV(res, rows, `enquiries-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async receipts(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.receipts(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'receipts');
      return sendCSV(res, rows, `fee-receipts-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async invoices(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.invoices(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'invoices');
      return sendCSV(res, rows, `invoices-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async students(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.students(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'students');
      return sendCSV(res, rows, `students-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async attendance(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.attendance(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'attendance');
      return sendCSV(res, rows, `attendance-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async paymentDue(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.paymentDue(req.user!.schoolId!);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'payment-due');
      return sendCSV(res, rows, `payment-due-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async transfers(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.transfers(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'transfers');
      return sendCSV(res, rows, `transfers-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async feeCard(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.feeCard(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'fee-card');
      return sendCSV(res, rows, `fee-card-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async cancelledReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.cancelledReceipts(req.user!.schoolId!);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'cancelled-receipts');
      return sendCSV(res, rows, `cancelled-receipts-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async purchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.purchaseOrders(req.user!.schoolId!);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'purchase-orders');
      return sendCSV(res, rows, `purchase-orders-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async onlinePayments(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.onlinePayments(req.user!.schoolId!, req.query);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'online-payments');
      return sendCSV(res, rows, `online-payments-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async graduation(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.graduation(req.user!.schoolId!);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'graduation');
      return sendCSV(res, rows, `graduation-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async soaLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const { admissionId } = req.params;
      const rows = await downloadService.soaLedger(admissionId as string);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, `soa-${admissionId}`);
      return sendCSV(res, rows, `soa-ledger-${admissionId}-${Date.now()}`);
    } catch (err) { next(err); }
  }

  async quit(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await downloadService.quit(req.user!.schoolId!);
      const fmt = (req.query.format as string) || 'csv';
      if (fmt === 'json') return sendJSON(res, rows, 'quit-students');
      return sendCSV(res, rows, `quit-students-${Date.now()}`);
    } catch (err) { next(err); }
  }
}

export const downloadsController = new DownloadsController();
