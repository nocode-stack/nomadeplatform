/**
 * Barrel re-export for backward compatibility.
 * 
 * The original 770-line hook has been split into:
 * - useProjectQueries.ts   — read-only queries (useProjectsList, useProject)
 * - useProjectMutations.ts — createProject + updateProject (useProjects)
 * - useProjectPhases.ts    — phase CRUD (useProjectPhases)
 * - useProjectBudgetHelpers.ts — shared budget logic (fetchBudgetOptions, findOptionId, etc.)
 */
export { useProjectsList, useProject } from './useProjectQueries';
export { useProjects } from './useProjectMutations';
export { useProjectPhases } from './useProjectPhases';
