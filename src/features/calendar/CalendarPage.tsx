import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Clock, MapPin, User, MoreHorizontal, Printer, 
  MessageSquare, AlertCircle, CheckCircle2, X, Trash2, Edit2,
  BadgeCheck
} from 'lucide-react';
import { usePanelStore } from '../../store/usePanelStore';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, addDays, parseISO, isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CalendarEvent } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { AgendaReport } from '../../services/pdf/AgendaReport';

export const CalendarPage: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, settings } = usePanelStore();
  const { user, isGuest } = useAuth();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);

  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    type: 'activity',
    status: 'scheduled',
    location: ''
  });

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: ptBR });
  const endDate = endOfWeek(monthEnd, { locale: ptBR });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setFormData(prev => ({ ...prev, date: format(day, 'yyyy-MM-dd') }));
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;

    if (editingEvent) {
      await updateEvent(editingEvent.id, formData);
      toast.success('Atividade atualizada!');
    } else {
      const newEvent: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: formData.title || 'Nova Atividade',
        description: formData.description,
        date: formData.date || format(new Date(), 'yyyy-MM-dd'),
        startTime: formData.startTime || '08:00',
        endTime: formData.endTime,
        type: formData.type as any || 'activity',
        status: formData.status as any || 'scheduled',
        organizer: user?.login || 'Admin',
        location: formData.location
      };
      await addEvent(newEvent);
      toast.success('Atividade agendada com sucesso!');
    }

    setIsAdding(false);
    setEditingEvent(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      type: 'activity',
      status: 'scheduled',
      location: ''
    });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(evt => isSameDay(parseISO(evt.date), day));
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'maintenance': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'visit': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Calendário de Atividades</h1>
          <p className="text-slate-500 text-sm font-medium italic">Gestão de agenda, reuniões e manutenções programadas.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <PDFDownloadLink
            document={
              <AgendaReport 
                events={events.filter(e => isSameMonth(parseISO(e.date), currentMonth))} 
                monthName={format(currentMonth, 'MMMM yyyy', { locale: ptBR })} 
                settings={settings} 
              />
            }
            fileName={`Agenda_${format(currentMonth, 'MM_yyyy')}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" className="h-11 px-6 font-bold gap-2 print:hidden" disabled={loading}>
                <Printer className="h-4 w-4" />
                {loading ? 'Preparando...' : 'Imprimir Agenda'}
              </Button>
            )}
          </PDFDownloadLink>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 shadow-xl font-bold gap-2"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Atividade
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / List View for Large Screens */}
        <Card className="lg:col-span-1 border-none shadow-xl print:hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.slice(0, 5).map(evt => (
              <div 
                key={evt.id} 
                className="group p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                onClick={() => setViewingEvent(evt)}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge className={cn("text-[8px] font-black uppercase px-2", getTypeStyle(evt.type))}>
                    {evt.type}
                  </Badge>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{format(parseISO(evt.date), 'dd MMM')}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase">{evt.title}</h4>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium">
                  <Clock className="h-3 w-3" />
                  <span>{evt.startTime} {evt.endTime && `- ${evt.endTime}`}</span>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="py-8 text-center bg-slate-50 rounded-xl">
                <CalendarIcon className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Agenda vazia</p>
              </div>
            )}
            <Button variant="ghost" className="w-full text-blue-600 font-bold uppercase text-[10px] tracking-widest">
              Ver todos os registros
            </Button>
          </CardContent>
        </Card>

        {/* Main Calendar Grid */}
        <Card className="lg:col-span-3 border-none shadow-2xl overflow-hidden print:shadow-none print:border">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:bg-white print:text-black print:border-b">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black uppercase tracking-tight">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <div className="flex items-center gap-1 print:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={prevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={nextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-[10px] font-bold uppercase border-white/20 hover:bg-white/10"
                onClick={() => setCurrentMonth(new Date())}
              >
                Hoje
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 print:bg-white">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[120px] print:auto-rows-auto">
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <div 
                  key={idx}
                  className={cn(
                    "relative p-2 border-r border-b border-slate-50 transition-colors group cursor-pointer print:min-h-[80px]",
                    !isCurrentMonth && "bg-slate-50/30 text-slate-300",
                    isToday(day) && "bg-blue-50/50",
                    isCurrentMonth && "hover:bg-slate-50"
                  )}
                  onClick={() => isCurrentMonth && handleDayClick(day)}
                >
                  <span className={cn(
                    "text-xs font-black tabular-nums mb-1 block",
                    isToday(day) ? "text-blue-600" : "text-slate-500",
                    !isCurrentMonth && "text-slate-200"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map(evt => (
                      <div 
                        key={evt.id}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold truncate border flex items-center gap-1",
                          getTypeStyle(evt.type)
                        )}
                        title={evt.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingEvent(evt);
                        }}
                      >
                        <div className={cn("w-1 h-1 rounded-full shrink-0", 
                          evt.type === 'meeting' ? "bg-purple-500" : 
                          evt.type === 'maintenance' ? "bg-blue-500" : 
                          "bg-emerald-500"
                        )} />
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] font-bold text-slate-400 px-1 italic">
                        + {dayEvents.length - 3} mais...
                      </div>
                    )}
                  </div>

                  {isCurrentMonth && (
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-3 w-3 text-blue-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* CRUD DIALOG */}
      <Dialog open={isAdding} onOpenChange={(val) => { setIsAdding(val); if(!val) { setEditingEvent(null); resetForm(); }}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase font-black tracking-tight">
              {editingEvent ? 'Editar Atividade' : 'Agendar Atividade'}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase text-slate-400">
              {editingEvent ? 'Ajuste os parâmetros da atividade na agenda.' : 'Preencha os dados técnicos para o cronograma.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título da Atividade / Reunião</Label>
              <Input 
                className="h-10 font-bold"
                placeholder="Ex: Reunião de Comissão, Manutenção..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Data</Label>
                <Input 
                  type="date"
                  className="h-10 font-bold text-xs"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Início</Label>
                <Input 
                  type="time"
                  className="h-10 font-bold text-xs"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val as any }))}>
                  <SelectTrigger className="h-10 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Atividade Geral</SelectItem>
                    <SelectItem value="meeting">Reunião Técnica</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="visit">Visita / Inspeção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Inicial</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as any }))}>
                  <SelectTrigger className="h-10 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="requested">Solicitado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Localização</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  className="pl-10 h-10 text-xs font-bold"
                  placeholder="Ex: Auditório principal, Copa..."
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notas Adicionais</Label>
              <textarea 
                className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                placeholder="Detalhes ou pauta da reunião..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs h-11 tracking-widest gap-2 shadow-lg shadow-blue-500/20">
                <BadgeCheck className="h-4 w-4" />
                {editingEvent ? 'Atualizar Atividade' : 'Agendar no Cronograma'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={!!viewingEvent} onOpenChange={(val) => !val && setViewingEvent(null)}>
        <DialogContent className="sm:max-w-md">
          {viewingEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={getTypeStyle(viewingEvent.type)}>
                    {viewingEvent.status === 'requested' ? 'SOLICITAÇÃO' : (viewingEvent?.type || '').toUpperCase()}
                  </Badge>
                  {viewingEvent.status === 'confirmed' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      CONFIRMADO
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  {viewingEvent.title}
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-500">
                  Organizado por: <span className="text-blue-600">{viewingEvent.organizer}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Data do Evento</Label>
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                      <span>{format(parseISO(viewingEvent.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Horário</Label>
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{viewingEvent.startTime} {viewingEvent.endTime && `- ${viewingEvent.endTime}`}</span>
                    </div>
                  </div>
                </div>

                {viewingEvent.location && (
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Escopo / Local</Label>
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{viewingEvent.location}</span>
                    </div>
                  </div>
                )}

                {viewingEvent.description && (
                  <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-600 text-sm">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest not-italic mb-2 block">Pauta e Notas</Label>
                    <p>{viewingEvent.description}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex items-center gap-2">
                  {!isGuest && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Deseja cancelar e remover esta atividade?')) {
                            deleteEvent(viewingEvent.id);
                            setViewingEvent(null);
                            toast.success('Atividade removida.');
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setEditingEvent(viewingEvent);
                          setFormData(viewingEvent);
                          setViewingEvent(null);
                          setIsAdding(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <Button 
                  className="bg-slate-900 hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest px-8"
                  onClick={() => setViewingEvent(null)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
