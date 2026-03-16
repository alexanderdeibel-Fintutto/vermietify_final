 import { formatCurrency, formatDate } from '@/lib/invoiceUtils';
 
 export interface InvoiceItem {
   description: string;
   quantity: number;
   unit: string;
   price: number;
   vatRate: number;
 }
 
 export interface InvoiceData {
   number: string;
   date: string;
   dueDate: string;
   servicePeriodFrom?: string;
   servicePeriodTo?: string;
   customer: { name: string; address: string };
   company: { name: string; address: string; taxId: string; bankAccount: string };
   items: InvoiceItem[];
 }
 
 interface InvoicePreviewProps {
   invoice: InvoiceData;
 }
 
 export function InvoicePreview({ invoice }: InvoicePreviewProps) {
   const netTotal = invoice.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
   
   // Group VAT by rate
   const vatByRate = invoice.items.reduce((acc, item) => {
     const vatAmount = item.quantity * item.price * item.vatRate / 100;
     if (!acc[item.vatRate]) acc[item.vatRate] = 0;
     acc[item.vatRate] += vatAmount;
     return acc;
   }, {} as Record<number, number>);
   
   const vatTotal = Object.values(vatByRate).reduce((sum, v) => sum + v, 0);
 
   return (
     <div className="bg-white text-black p-8 shadow-lg max-w-[210mm] mx-auto" id="invoice-pdf">
       {/* Header mit Firmenlogo */}
       <div className="flex justify-between mb-8">
         <div>
           <h1 className="text-2xl font-bold text-gray-900">{invoice.company.name}</h1>
           <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.company.address}</p>
         </div>
         <div className="text-right">
           <p className="text-3xl font-bold text-blue-600">RECHNUNG</p>
           <p className="text-lg text-gray-800">{invoice.number}</p>
         </div>
       </div>
 
       {/* Kundenadresse */}
       <div className="mb-8">
         <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
         <p className="whitespace-pre-line text-gray-700">{invoice.customer.address}</p>
       </div>
 
       {/* Rechnungsdetails */}
       <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
         <div>
           <span className="text-gray-600">Rechnungsdatum:</span>{' '}
           <span className="text-gray-900">{invoice.date}</span>
         </div>
         <div>
           <span className="text-gray-600">Leistungszeitraum:</span>{' '}
           <span className="text-gray-900">
             {invoice.servicePeriodFrom && invoice.servicePeriodTo
               ? `${invoice.servicePeriodFrom} - ${invoice.servicePeriodTo}`
               : invoice.date}
           </span>
         </div>
         <div>
           <span className="text-gray-600">Fällig bis:</span>{' '}
           <span className="text-gray-900">{invoice.dueDate}</span>
         </div>
       </div>
 
       {/* Positionen-Tabelle */}
       <table className="w-full mb-8">
         <thead className="border-b-2 border-gray-300">
           <tr className="text-left text-sm text-gray-600">
             <th className="py-2 w-12">Pos.</th>
             <th>Beschreibung</th>
             <th className="text-right w-24">Menge</th>
             <th className="text-right w-28">Einzelpreis</th>
             <th className="text-right w-20">USt.</th>
             <th className="text-right w-28">Gesamt</th>
           </tr>
         </thead>
         <tbody>
           {invoice.items.map((item, i) => (
             <tr key={i} className="border-b border-gray-200">
               <td className="py-2 text-gray-900">{i + 1}</td>
               <td className="text-gray-900">{item.description}</td>
               <td className="text-right text-gray-900">
                 {item.quantity} {item.unit}
               </td>
               <td className="text-right text-gray-900">{item.price.toFixed(2)} €</td>
               <td className="text-right text-gray-600">{item.vatRate}%</td>
               <td className="text-right text-gray-900">{(item.quantity * item.price).toFixed(2)} €</td>
             </tr>
           ))}
         </tbody>
       </table>
 
       {/* Summen */}
       <div className="flex justify-end">
         <div className="w-72">
           <div className="flex justify-between py-1 text-gray-700">
             <span>Nettobetrag:</span>
             <span>{netTotal.toFixed(2)} €</span>
           </div>
           {Object.entries(vatByRate).map(([rate, amount]) => (
             <div key={rate} className="flex justify-between py-1 text-gray-700">
               <span>USt. {rate}%:</span>
               <span>{amount.toFixed(2)} €</span>
             </div>
           ))}
           <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-lg text-gray-900">
             <span>Gesamtbetrag:</span>
             <span>{(netTotal + vatTotal).toFixed(2)} €</span>
           </div>
         </div>
       </div>
 
       {/* Footer */}
       <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-gray-600">
         <p>Bitte überweisen Sie den Betrag bis zum {invoice.dueDate} auf folgendes Konto:</p>
         <p className="font-mono mt-2 text-gray-800">{invoice.company.bankAccount}</p>
         <p className="mt-4">USt-IdNr.: {invoice.company.taxId}</p>
       </div>
     </div>
   );
 }