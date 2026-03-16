 interface UStVAData {
   zeitraum: { jahr: number; monat?: number; quartal?: number };
   kz81: number; // Umsätze 19%
   kz86: number; // Umsätze 7%
   kz66: number; // Vorsteuer
   kz83: number; // Vorauszahlung
 }
 
 interface Company {
   name: string;
   address?: string;
   zip?: string;
   city?: string;
   tax_id?: string;
 }
 
 export function generateUStVAXML(data: UStVAData, company: Company): string {
   const xml = `<?xml version="1.0" encoding="UTF-8"?>
 <Elster xmlns="http://www.elster.de/elsterxml/schema/v11">
   <TransferHeader version="11">
     <Verfahren>ElsterAnmeldung</Verfahren>
     <DatenArt>UStVA</DatenArt>
     <Vorgang>send-NoSig</Vorgang>
   </TransferHeader>
   <DatenTeil>
     <Nutzdatenblock>
       <Nutzdaten>
         <Anmeldungssteuern art="UStVA" version="202301">
           <DatenLieferant>
             <Name>${escapeXml(company.name)}</Name>
             <Strasse>${escapeXml(company.address || '')}</Strasse>
             <PLZ>${escapeXml(company.zip || '')}</PLZ>
             <Ort>${escapeXml(company.city || '')}</Ort>
           </DatenLieferant>
           <Steuerfall>
             <Umsatzsteuervoranmeldung>
               <Jahr>${data.zeitraum.jahr}</Jahr>
               <Zeitraum>${String(data.zeitraum.monat || data.zeitraum.quartal).padStart(2, '0')}</Zeitraum>
               <Kz81>${data.kz81.toFixed(2)}</Kz81>
               <Kz86>${data.kz86.toFixed(2)}</Kz86>
               <Kz66>${data.kz66.toFixed(2)}</Kz66>
               <Kz83>${data.kz83.toFixed(2)}</Kz83>
             </Umsatzsteuervoranmeldung>
           </Steuerfall>
         </Anmeldungssteuern>
       </Nutzdaten>
     </Nutzdatenblock>
   </DatenTeil>
 </Elster>`;
   return xml;
 }
 
 function escapeXml(str: string): string {
   return str
     .replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;');
 }
 
 export function calculateUStVA(transactions: Array<{ type: string; amount: number; category?: string }>): UStVAData {
   // Calculate net amounts from gross (assuming 19% VAT for standard rate)
   const incomeTransactions = transactions.filter(t => t.type === 'income');
   const expenseTransactions = transactions.filter(t => t.type === 'expense');
   
   // Gross to net conversion for 19%
   const bruttoUmsaetze19 = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
   const nettoUmsaetze19 = bruttoUmsaetze19 / 1.19;
   const ust19 = bruttoUmsaetze19 - nettoUmsaetze19;
   
   // Vorsteuer from expenses (assuming 19% VAT)
   const bruttoAusgaben = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
   const vorsteuer = bruttoAusgaben * 0.19 / 1.19;
   
   return {
     zeitraum: { jahr: new Date().getFullYear(), monat: new Date().getMonth() + 1 },
     kz81: nettoUmsaetze19,
     kz86: 0, // 7% rate - would need category distinction
     kz66: vorsteuer,
     kz83: ust19 - vorsteuer,
   };
 }
 
 export function downloadXML(content: string, filename: string) {
   const blob = new Blob([content], { type: 'application/xml' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
 }
 
 export async function submitToElster(xml: string, testMode: boolean): Promise<{ success: boolean; protocol?: string; error?: string }> {
   // Simulated ELSTER submission
   await new Promise(r => setTimeout(r, 2000));
   
   if (testMode) {
     return {
       success: true,
       protocol: `ELSTER Testübermittlung erfolgreich\nZeitstempel: ${new Date().toISOString()}\nTelenummer: TEST-${Date.now()}`
     };
   }
   
   // In production, this would connect to the actual ELSTER API
   return {
     success: true,
     protocol: `ELSTER Übermittlung erfolgreich\nZeitstempel: ${new Date().toISOString()}\nTelenummer: ${Date.now()}`
   };
 }
 
 export const FINANZAEMTER = [
   { code: '9201', name: 'Finanzamt München I' },
   { code: '9202', name: 'Finanzamt München II' },
   { code: '9203', name: 'Finanzamt München III' },
   { code: '2801', name: 'Finanzamt Berlin Mitte' },
   { code: '2802', name: 'Finanzamt Berlin Charlottenburg' },
   { code: '2227', name: 'Finanzamt Hamburg-Mitte' },
   { code: '5111', name: 'Finanzamt Köln-Mitte' },
   { code: '5112', name: 'Finanzamt Köln-Nord' },
   { code: '6111', name: 'Finanzamt Frankfurt am Main I' },
   { code: '6112', name: 'Finanzamt Frankfurt am Main II' },
   { code: '3046', name: 'Finanzamt Stuttgart I' },
   { code: '3047', name: 'Finanzamt Stuttgart II' },
   { code: '5382', name: 'Finanzamt Düsseldorf-Mitte' },
   { code: '5371', name: 'Finanzamt Dortmund-Ost' },
 ];
 
 export type { UStVAData, Company };