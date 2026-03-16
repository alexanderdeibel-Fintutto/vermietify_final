import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MaintenanceTask {
    id: string;
    titel: string;
    beschreibung?: string;
    status: 'Offen' | 'In Bearbeitung' | 'Erledigt';
    prioritaet: 'Niedrig' | 'Mittel' | 'Hoch';
    building_id?: string;
    building_name?: string;
    erstellt_am: string;
}

const DEMO_TASKS: MaintenanceTask[] = [
    { id: '1', titel: 'Heizungsanlage warten', beschreibung: 'Jährliche Wartung', status: 'Offen', prioritaet: 'Hoch', building_name: 'Musterhaus 1', erstellt_am: '2025-03-01' },
    { id: '2', titel: 'Treppenhausreinigung', status: 'In Bearbeitung', prioritaet: 'Mittel', building_name: 'Musterhaus 2', erstellt_am: '2025-03-05' },
    { id: '3', titel: 'Rauchmelder prüfen', status: 'Erledigt', prioritaet: 'Hoch', building_name: 'Musterhaus 1', erstellt_am: '2025-02-20' },
    { id: '4', titel: 'Dachrinne reinigen', status: 'Offen', prioritaet: 'Niedrig', building_name: 'Musterhaus 3', erstellt_am: '2025-03-10' },
];

export default function MaintenanceManager() {
    const [tasks] = useState<MaintenanceTask[]>(DEMO_TASKS);

    const openTasks = tasks.filter(t => t.status === 'Offen');
    const inProgressTasks = tasks.filter(t => t.status === 'In Bearbeitung');
    const completedTasks = tasks.filter(t => t.status === 'Erledigt');
    const urgentTasks = tasks.filter(t => t.prioritaet === 'Hoch' && t.status === 'Offen');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Wartungsmanagement</h1>
                    <p className="vf-page-subtitle">{tasks.length} Aufgaben</p>
                </div>
                <div className="vf-page-actions">
                    <Button className="vf-btn-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Neue Aufgabe
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Wrench className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold">{tasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Aufgaben gesamt</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="text-3xl font-bold text-orange-700">{openTasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Offen</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">{urgentTasks.length}</div>
                        <div className="text-sm text-gray-600 mt-1">Dringend</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">{completedTasks.length}</div>
                        <div className="text-sm opacity-90 mt-1">Abgeschlossen</div>
                    </CardContent>
                </Card>
            </div>

            {urgentTasks.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            Dringende Aufgaben ({urgentTasks.length})
                        </h3>
                        <div className="space-y-2">
                            {urgentTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="p-3 bg-white rounded-lg border border-red-200">
                                    <div className="font-semibold text-sm">{task.titel}</div>
                                    <div className="text-xs text-gray-600 mt-1">{task.building_name}</div>
                                    <Badge className="mt-2 vf-badge-error text-xs">Dringend</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Offene Aufgaben ({openTasks.length})</h3>
                        <div className="space-y-2">
                            {openTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="font-semibold text-sm">{task.titel}</div>
                                    <Badge className="mt-2 vf-badge-warning text-xs">Offen</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">In Bearbeitung ({inProgressTasks.length})</h3>
                        <div className="space-y-2">
                            {inProgressTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="font-semibold text-sm">{task.titel}</div>
                                    <Badge className="mt-2 vf-badge-primary text-xs">In Bearbeitung</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Abgeschlossen ({completedTasks.length})</h3>
                        <div className="space-y-2">
                            {completedTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="font-semibold text-sm">{task.titel}</div>
                                    <Badge className="mt-2 vf-badge-success text-xs">Erledigt</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
