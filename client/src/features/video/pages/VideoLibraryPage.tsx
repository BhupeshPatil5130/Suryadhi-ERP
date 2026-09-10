
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayCircle, Clock, Search, BookOpen, Layers } from 'lucide-react';

const videos = [
  { id: '1', title: 'Suryadhi SEMS — Pre-School Setup & Onboarding Guidelines', category: 'Operations', duration: '12:45', thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400&h=250', new: true },
  { id: '2', title: 'Admissions Module Training', category: 'Training', duration: '45:20', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400&h=250', new: false },
  { id: '3', title: 'Curriculum Implementation Q1', category: 'Academics', duration: '30:15', thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400&h=250', new: true },
  { id: '4', title: 'Fee Collection Best Practices', category: 'Finance', duration: '18:10', thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400&h=250', new: false },
  { id: '5', title: 'Parent Communication Strategies', category: 'Training', duration: '22:30', thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=400&h=250', new: false },
  { id: '6', title: 'Safety & Hygiene Protocols', category: 'Operations', duration: '15:00', thumbnail: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&q=80&w=400&h=250', new: false },
];

export default function VideoLibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Video Library"
        description="Access training materials, guidelines, and curriculum videos"
      >
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search videos..." className="pl-9" />
        </div>
      </PageHeader>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button variant="default" size="sm" className="rounded-full"><Layers className="h-4 w-4 mr-2" />All Videos</Button>
        <Button variant="outline" size="sm" className="rounded-full border-border bg-card hover:bg-muted"><BookOpen className="h-4 w-4 mr-2" />Academics</Button>
        <Button variant="outline" size="sm" className="rounded-full border-border bg-card hover:bg-muted">Training</Button>
        <Button variant="outline" size="sm" className="rounded-full border-border bg-card hover:bg-muted">Operations</Button>
        <Button variant="outline" size="sm" className="rounded-full border-border bg-card hover:bg-muted">Finance</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div key={video.id}>
            <Card className="overflow-hidden group cursor-pointer border-border hover:border-primary/30 hover:shadow-lg transition-all h-full flex flex-col">
              <div className="relative aspect-video overflow-hidden">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300" />
                </div>
                {video.new && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="shadow-sm">NEW</Badge>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-mono rounded font-medium backdrop-blur-sm">
                  {video.duration}
                </div>
              </div>
              <CardContent className="p-4 flex-1">
                <Badge variant="secondary" className="mb-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20">{video.category}</Badge>
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
              </CardContent>
              <CardFooter className="p-4 pt-0 border-t border-border/40 mt-auto flex items-center justify-between text-muted-foreground">
                <div className="flex items-center text-[11px] font-medium">
                  <Clock className="w-3 h-3 mr-1" /> Added recently
                </div>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
