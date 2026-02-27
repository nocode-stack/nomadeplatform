// Utilities to help with data migration from old clients to clients

export function replaceAllClientReferences(text: string): string {
  // Replace all instances of .clients with .clients
  return text.replace(/\.clients\?/g, '.clients?');
}

// Helper to create a simple search and replace script
export function createMigrationScript() {
  const filesToUpdate = [
    'src/components/projects/ProjectKanban.tsx',
    'src/components/vehicles/AssignVehicleDialog.tsx', 
    'src/components/vehicles/VehicleDetailDialog.tsx',
    'src/pages/ProyectoDetalle.tsx',
    'src/pages/Proyectos.tsx',
    'src/components/production/AssignProjectDialog.tsx',
    'src/components/projects/ProjectAnalytics.tsx',
    'src/pages/Contratos.tsx'
  ];

  return filesToUpdate.map(file => ({
    file,
    action: 'Replace all instances of "project.clients?" with "project.clients?"'
  }));
}