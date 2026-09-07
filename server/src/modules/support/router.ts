import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate, schoolScope } from '../../middleware';

const router = Router();
router.use(authenticate);
router.use(schoolScope);

// GET /api/support/tickets - Get helpdesk support tickets
router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId!;

    const tickets = [
      { id: '1', ticketNo: 'Ticket no-338408', subject: 'T Shirt Replacement', category: 'Operations', date: '28-May-2026', status: 'Closed', remarks: 'Replacement dispatched via courier.' },
      { id: '2', ticketNo: 'Ticket no-338407', subject: 'T shirt replacement', category: 'Operations', date: '28-May-2026', status: 'Closed', remarks: 'Size exchange processed.' },
      { id: '3', ticketNo: 'Ticket no-332420', subject: 'Program Change', category: 'Academics', date: '01-May-2026', status: 'Closed', remarks: 'Program updated from Play Group to Nursery.' },
      { id: '4', ticketNo: 'Ticket no-332419', subject: 'Program Changes', category: 'Academics', date: '01-May-2026', status: 'Closed', remarks: 'Batch allocation completed.' },
      { id: '5', ticketNo: 'Ticket no-332421', subject: 'Program Change', category: 'Academics', date: '01-May-2026', status: 'Closed', remarks: 'Approved by Zonal Manager.' },
      { id: '6', ticketNo: 'Ticket no-322179', subject: 'Quit admission', category: 'Admission', date: '24-Mar-2026', status: 'Closed', remarks: 'Refund cleared per policy.' },
      { id: '7', ticketNo: 'Ticket no-303957', subject: 'name change reg', category: 'Administration', date: '15-Feb-2026', status: 'Resolved', remarks: 'Name change certificate updated.' },
      { id: '8', ticketNo: 'Ticket no-293134', subject: 'father name change', category: 'Administration', date: '10-Jan-2026', status: 'Open', remarks: 'Verification documents pending.' },
    ];

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) { next(error); }
});

// POST /api/support/tickets - Create a new helpdesk ticket
router.post('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, mainCategory, subCategory, description, email, phone } = req.body;
    const ticketNo = `Ticket no-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket = {
      id: String(Date.now()),
      ticketNo,
      subject: subject || 'General Query',
      category: mainCategory || 'Support',
      subCategory: subCategory || 'General',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      status: 'Open',
      email,
      phone,
      description,
    };

    res.status(201).json({
      success: true,
      message: 'Support ticket raised successfully',
      data: newTicket,
    });
  } catch (error) { next(error); }
});

export default router;
