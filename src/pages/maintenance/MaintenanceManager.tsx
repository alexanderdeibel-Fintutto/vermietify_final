import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MaintenanceManager() {
    const { data: tasks = [] } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list('-created_date')
    });

    const { data: buildings = [] } = useQuery({
        queryKey: ['buildings'],
        queryFn: () => base44.entities.Building.list()
    });

    const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'Offen');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'In Bearbeitung');
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'Erledigt');
    const urgentTasks = tasks.filter(t => (t.priority === 'high' || t.prioritaet === 'Hoch') && (t.status === 'open' || t.status === 'Offen'));

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
                            {urgentTasks.slice(0, 5).map((task) => {
                                const building = buildings.find(b => b.id === task.building_id);
                                return (
                                    <div key={task.id} className="p-3 bg-white rounded-lg border border-red-200">
                                        <div className="font-semibold text-sm">{task.titel}</div>
                                        <div className="text-xs text-gray-600 mt-1">{building?.name}</div>
                                        <Badge className="mt-2 vf-badge-error text-xs">Dringend</Badge>
                                    </div>
                                );
                            })}
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