import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, FileText, Edit, Trash2, Download, Eye } from 'lucide-react';
import { UnifiedProject } from '../../types/database';
import NewBudgetManager from './NewBudgetManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

interface BudgetManagerProps {
  project: UnifiedProject;
}

const BudgetManager = ({ project }: BudgetManagerProps) => {
  // Delegamos completamente al nuevo sistema de presupuestos
  return (
    <div className="space-y-4">
      {/* Información de migración */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-blue-700">
              <strong>Sistema Migrado:</strong> Ahora usando las nuevas tablas de presupuestos con funcionalidad mejorada.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Nuevo sistema de presupuestos */}
      <NewBudgetManager project={project} />
    </div>
  );
};

export default BudgetManager;
