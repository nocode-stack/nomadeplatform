
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Eye } from "lucide-react";
import { UnifiedProject } from '../../types/database';
import { getStatusColor, getStatusText, formatDate } from '../../utils/projectUtils';
import { useNavigate } from 'react-router-dom';

interface ProjectsTableProps {
  projects: UnifiedProject[];
  title?: string;
}

const ProjectsTable = ({ projects, title = "Proyectos" }: ProjectsTableProps) => {
  const navigate = useNavigate();

  const handleViewProject = (projectId: string) => {
    navigate(`/proyectos/${projectId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <TableRow 
                    key={project.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewProject(project.id)}
                  >
                    <TableCell className="font-medium">
                      {project.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {project.new_clients?.name || 'Sin cliente'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.new_clients?.email || ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{project.model}</TableCell>
                    <TableCell>
                      <Badge 
                        className={`${getStatusColor(project.status)} text-white`}
                      >
                        {getStatusText(project.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={project.progress} 
                          className="w-[60px] h-2"
                        />
                        <span className="text-sm text-gray-600 min-w-[40px]">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(project.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProject(project.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay proyectos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsTable;
