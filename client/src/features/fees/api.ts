import apiClient from '@/lib/api-client';

export const feesApi = {
  calculate: (params: Record<string, any>) => apiClient.get('/fees/calculate', { params }),
  getReceipts: (admissionId: string) => apiClient.get(`/fees/receipts/${admissionId}`),
  getReceiptById: (receiptId: string) => apiClient.get(`/fees/receipt/${receiptId}`),
  createReceipt: (data: any) => apiClient.post('/fees/receipts', data),
  getCashReceipts: (params?: Record<string, string>) => apiClient.get('/fees/cash-receipts', { params }),
  getPendingDeposits: (params?: Record<string, string>) => apiClient.get('/fees/deposits/pending', { params }),
  createDeposit: (data: any) => apiClient.post('/fees/deposits', data),
  listDeposits: (params?: Record<string, string>) => apiClient.get('/fees/deposits', { params }),
  convertPayment: (data: any) => apiClient.post('/fees/convert-payment', data),
  convertBulkPayment: (data: any) => apiClient.post('/fees/convert-bulk', data),
  getFundsTransfer: (params?: Record<string, string>) => apiClient.get('/fees/funds-transfer', { params }),
  getHomebuddyReceipts: (params?: Record<string, string>) => apiClient.get('/fees/homebuddy', { params }),
  getOnlinePayments: (params?: Record<string, string>) => apiClient.get('/fees/online-payments', { params }),
};
