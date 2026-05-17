
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, MapPin, Search, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface PoliceContact {
  id: string;
  city: string;
  commissioner_name: string;
  phone: string;
  email: string | null;
  address: string | null;
}

export default function PoliceContacts() {
  const [contacts, setContacts] = useState<PoliceContact[]>([]);
  const [filtered, setFiltered] = useState<PoliceContact[]>([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [loading, setLoading] = useState(true);

  const departments = [
    'Tous', 'Littoral', 'Atlantique', 'Ouémé', 'Plateau',
    'Mono', 'Couffo', 'Zou', 'Collines', 'Borgou',
    'Alibori', 'Donga', 'Atacora'
  ];

  useEffect(() => {
    supabase
      .from('police_contacts')
      .select('*')
      .order('city')
      .then(({ data }) => {
        setContacts(data ?? []);
        setFiltered(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = contacts;
    if (search) {
      result = result.filter(c =>
        c.city.toLowerCase().includes(search.toLowerCase()) ||
        c.commissioner_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (dept && dept !== 'Tous') {
      result = result.filter(c =>
        c.address?.toLowerCase().includes(dept.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, dept, contacts]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contacts de la Police Républicaine du Bénin',
    about: filtered.slice(0, 50).map((c) => ({
      '@type': 'LocalBusiness',
      name: `${c.city} — ${c.commissioner_name}`,
      telephone: c.phone,
      email: c.email ?? undefined,
      address: c.address ?? undefined,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Contacts Police Bénin — TraceIMEI-BJ</title>
        <meta name="description" content="Annuaire des commissariats de la Police Républicaine du Bénin : téléphone, adresse et e-mail pour signaler un vol de téléphone." />
        <link rel="canonical" href="https://trace-benin-secure.lovable.app/contacts-police" />
        <meta property="og:title" content="Contacts Police Bénin — TraceIMEI-BJ" />
        <meta property="og:description" content="Annuaire des commissariats de la Police Républicaine du Bénin pour signaler un vol de téléphone." />
        <meta property="og:url" content="https://trace-benin-secure.lovable.app/contacts-police" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Contacts de la Police Républicaine du Bénin
        </h1>
        <p className="mt-2 text-muted-foreground">
          {contacts.length} commissariats référencés sur les 77 communes du Bénin
        </p>
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="police-search" className="sr-only">Rechercher une ville ou un commissariat</label>
          <input
            id="police-search"
            type="text"
            placeholder="Rechercher une ville ou un commissariat..."
            aria-label="Rechercher une ville ou un commissariat"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <label htmlFor="police-dept" className="sr-only">Filtrer par département</label>
        <select
          id="police-dept"
          aria-label="Filtrer par département"
          value={dept}
          onChange={e => setDept(e.target.value)}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {departments.map(d => (
            <option key={d} value={d === 'Tous' ? '' : d}>{d}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucun résultat trouvé.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(contact => (
            <div key={contact.id} className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{contact.city}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{contact.commissioner_name}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{contact.address}</span>
              </div>
              <div className="space-y-2">
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  {contact.phone}
                </a>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <MapPin className="h-4 w-4" />
                    {contact.email}
                  </a>
                )}
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <Link to="/declare" className="flex w-full items-center justify-center rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 transition-colors">
                  Signaler un vol ici
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
