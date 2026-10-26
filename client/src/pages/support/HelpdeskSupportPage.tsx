import { useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Search, Upload, Filter, Phone, Mail, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const dummyTickets = [
  { id: '1', ticketNo: 'Ticket no-338408', subject: 'T Shirt Replacement', date: '28-May-2026', status: 'Closed' },
  { id: '2', ticketNo: 'Ticket no-338407', subject: 'T shirt replacement', date: '28-May-2026', status: 'Closed' },
  { id: '3', ticketNo: 'Ticket no-332420', subject: 'Program Change', date: '01-May-2026', status: 'Closed' },
  { id: '4', ticketNo: 'Ticket no-332419', subject: 'Program Changes', date: '01-May-2026', status: 'Closed' },
  { id: '5', ticketNo: 'Ticket no-332421', subject: 'Program Change', date: '01-May-2026', status: 'Closed' },
  { id: '6', ticketNo: 'Ticket no-322179', subject: 'Quit admission', date: '24-Mar-2026', status: 'Closed' },
  { id: '7', ticketNo: 'Ticket no-303957', subject: 'name change reg', date: '15-Feb-2026', status: 'Resolved' },
  { id: '8', ticketNo: 'Ticket no-293134', subject: 'father name change', date: '10-Jan-2026', status: 'Open' },
];

export default function HelpdeskSupportPage() {
  const [view, setView] = useState<'home' | 'raise' | 'history'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTickets = useMemo(() => {
    let result = [...dummyTickets];

    if (searchQuery) {
      result = result.filter(t => 
        t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase());
    }

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      return 0;
    });

    return result;
  }, [searchQuery, sortBy, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Service Core"
        description="Manage your support tickets, raise new requests, and view history."
      />

      {view === 'home' && (
        <Card className="bg-white border-slate-200 shadow-sm mt-4">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-slate-700 mb-8 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24 text-slate-500">Email <span className="text-red-500">*</span></span>
                <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden h-9 w-full max-w-[250px]">
                  <Input defaultValue="SUNOIAkidarni@gmail.com" readOnly className="border-0 h-full rounded-none focus-visible:ring-0" />
                  <div className="bg-slate-50 border-l border-slate-200 h-full px-3 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24 text-slate-500">Phone <span className="text-red-500">*</span></span>
                <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden h-9 w-full max-w-[250px]">
                  <div className="bg-white border-r border-slate-200 h-full px-2 flex items-center justify-center gap-1 font-medium">
                    🇮🇳 +91
                  </div>
                  <Input defaultValue="98239 90362" readOnly className="border-0 h-full rounded-none focus-visible:ring-0" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold w-24 text-slate-500">Customer Id</span>
                <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden h-9 w-full max-w-[250px]">
                  <Input defaultValue="83049" readOnly className="border-0 h-full rounded-none focus-visible:ring-0 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button 
                className="bg-[#c0392b] hover:bg-[#a93226] text-white rounded-sm h-9 px-6 font-medium shadow-none transition-colors"
                onClick={() => setView('raise')}
              >
                Raise a Ticket
              </Button>
              <Button 
                className="bg-[#c0392b] hover:bg-[#a93226] text-white rounded-sm h-9 px-6 font-medium shadow-none transition-colors"
                onClick={() => setView('history')}
              >
                Ticket History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'raise' && (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView('home')} className="mb-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100">
            ← Back to Home
          </Button>
          <Card className="border-slate-200 shadow-md overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-xl text-slate-800 font-semibold">EPMS Raise Ticket</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Franchisee Name</label>
                    <Select defaultValue="yavatmal">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Franchisee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yavatmal">EK-Yavatmal-Arni_8...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Customer Id</label>
                    <Input defaultValue="83049" readOnly className="bg-slate-50 text-slate-500" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Name</label>
                    <Input placeholder="Enter Name" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                      <Input defaultValue="SUNOIAkidarni@gmail.com" type="email" />
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone</label>
                    <div className="flex gap-2">
                      <Select defaultValue="91">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="+91" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="91">🇮🇳 +91</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input defaultValue="98239 90362" className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Alternate Mobile No.</label>
                    <div className="flex gap-2">
                      <Select defaultValue="91">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="+91" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="91">🇮🇳 +91</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="81234 56789" className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Main Category <span className="text-red-500">*</span></label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="-Select-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academics">Academics</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Sub Category <span className="text-red-500">*</span></label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="-Select-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curriculum">Curriculum Query</SelectItem>
                        <SelectItem value="materials">Materials Missing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Subject <span className="text-red-500">*</span></label>
                    <Input placeholder="Enter subject line" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">File upload</label>
                    <div className="relative">
                      <Input type="file" className="pl-3 pr-10 pt-1.5" />
                      <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></label>
                    <Textarea placeholder="Describe your issue in detail..." className="h-32 resize-none" />
                  </div>

                </div>
              </form>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-center gap-4 py-4">
              <Button className="bg-[#2ecc71] hover:bg-[#27ae60] text-white px-8 h-10 shadow-sm transition-colors">
                Submit
              </Button>
              <Button variant="outline" className="px-8 h-10 bg-white shadow-sm hover:bg-slate-50">
                Reset
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView('home')} className="mb-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100">
            ← Back to Home
          </Button>
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 bg-white rounded-t-xl">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by ticket no or subject..." 
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] bg-white border-slate-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] bg-white border-slate-200">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow bg-white border-slate-200">
                    <CardContent className="p-5 flex flex-col h-full relative">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-bold text-slate-800 text-[15px] tracking-tight">{ticket.ticketNo}</span>
                        <a href="#" className="text-red-500 hover:text-red-700 font-semibold text-[13px] hover:underline transition-colors absolute bottom-5 right-5">
                          Feedback
                        </a>
                      </div>
                      <p className="text-slate-500 font-medium text-sm mb-6 line-clamp-2 pr-4 min-h-[40px]">
                        {ticket.subject}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-slate-700 font-semibold text-sm">{ticket.date}</span>
                        <Badge 
                          variant="secondary" 
                          className={`font-semibold mr-16 ${
                            ticket.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                            ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredTickets.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-slate-500 font-medium">No tickets found matching your filters.</p>
                    <Button 
                      variant="link" 
                      className="text-primary mt-2"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            
            <div className="bg-white border-t border-slate-200 p-4 rounded-b-xl">
              <p className="text-sm font-medium text-slate-600">
                Showing {filteredTickets.length} of {dummyTickets.length} tickets
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
