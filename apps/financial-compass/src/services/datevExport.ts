 interface DatevBooking {
   umsatz: number;
   sollHaben: 'S' | 'H';
   kontoSoll: string;
   kontoHaben: string;
   belegDatum: string;
   belegfeld1: string;
   buchungstext: string;
 }
 
 export function generateDatevCSV(transactions: any[], companyInfo: any): string {
   // DATEV Header gemäß DATEV-Format-Spezifikation
   const header = [
     '"EXTF"', '510', '21', 'Buchungsstapel', '7',
     new Date().toISOString().slice(0, 10).replace(/-/g, ''),
     '', '', '', companyInfo?.taxId || '', '',
     new Date().getFullYear().toString().slice(-2) + '0101',
     '4', new Date().toISOString().slice(0, 10).replace(/-/g, ''),
     '', '', '', '', '', '', ''
   ].join(';');
 
   // Spaltenüberschriften nach DATEV-Standard
   const columns = [
     'Umsatz', 'Soll/Haben', 'Konto', 'Gegenkonto',
     'Belegdatum', 'Belegfeld 1', 'Buchungstext'
   ].join(';');
 
   // Buchungszeilen mit SKR03 Kontenrahmen
   const rows = transactions.map(t => {
     const isIncome = t.type === 'income';
     return [
       Math.abs(t.amount).toFixed(2).replace('.', ','),
       isIncome ? 'H' : 'S',
       isIncome ? '8400' : getCategoryAccount(t.category), // Erlöse 19% / Kategorie-Konto
       '1200', // Bank
       new Date(t.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }).replace(/\./g, ''),
       t.id.slice(0, 12),
       `"${(t.description || '').replace(/"/g, '""')}"`
     ].join(';');
   });
 
   return [header, columns, ...rows].join('\r\n');
 }
 
 // SKR03 Kontenrahmen Zuordnung
 function getCategoryAccount(category: string | null): string {
   const accountMapping: Record<string, string> = {
     'Gehälter': '4100',
     'Miete': '4210',
     'Büromaterial': '4930',
     'Marketing': '4600',
     'Reisekosten': '4660',
     'Versicherungen': '4360',
     'Telekommunikation': '4920',
     'Einnahmen': '8400',
     'Sonstiges': '4900',
   };
   return accountMapping[category || 'Sonstiges'] || '4900';
 }
 
 export function downloadDatevFile(content: string, filename: string) {
   // BOM für korrekte UTF-8 Darstellung in Excel
   const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   a.click();
   URL.revokeObjectURL(url);
 }
 
 export function getDatevFilename(companyName: string, period: string): string {
   const sanitizedName = companyName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
   const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
   return `EXTF_${sanitizedName}_${period}_${date}.csv`;
 }