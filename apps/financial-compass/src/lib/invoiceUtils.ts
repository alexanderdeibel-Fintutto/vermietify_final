 export function formatCurrency(amount: number): string {
   return new Intl.NumberFormat('de-DE', {
     style: 'currency',
     currency: 'EUR',
   }).format(amount);
 }
 
 export function formatDate(dateString: string | null): string {
   if (!dateString) return '-';
   return new Date(dateString).toLocaleDateString('de-DE');
 }
 
 export function generateInvoiceNumber(): string {
   const year = new Date().getFullYear();
   const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
   return `RE-${year}-${random}`;
 }
 
 export function calculateDueDate(invoiceDate: string, paymentTermDays: number): string {
   const date = new Date(invoiceDate);
   date.setDate(date.getDate() + paymentTermDays);
   return date.toISOString().split('T')[0];
 }