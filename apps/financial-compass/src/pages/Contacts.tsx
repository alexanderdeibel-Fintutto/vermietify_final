import { useState, useEffect } from 'react';
import { Plus, Search, Users, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

const typeLabels: Record<string, string> = {
  customer: 'Kunde',
  supplier: 'Lieferant',
  both: 'Kunde & Lieferant',
};

export default function Contacts() {
  const { currentCompany } = useCompany();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      fetchContacts();
    }
  }, [currentCompany]);

  const fetchContacts = async () => {
    if (!currentCompany) return;

    setLoading(true);
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', currentCompany.id)
      .order('name');

    if (data) {
      setContacts(data);
    }
    setLoading(false);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Bitte wählen Sie eine Firma aus.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kontakte</h1>
          <p className="text-muted-foreground">Kunden und Lieferanten verwalten</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Kontakt
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kontakt suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50"
        />
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Laden...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">Keine Kontakte vorhanden</p>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Ersten Kontakt hinzufügen
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="glass rounded-xl p-5 hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {contact.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{contact.name}</p>
                  <Badge variant="outline" className="mt-1">
                    {typeLabels[contact.type] || contact.type}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {contact.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
