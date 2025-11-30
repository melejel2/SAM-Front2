import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/api/api';
import { z } from 'zod';

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  // Add other project fields as needed
});

const projectsResponseSchema = z.array(projectSchema);

export type Project = z.infer<typeof projectSchema>;

const fetchProjects = async (): Promise<Project[]> => {
  const response = await apiRequest({ endpoint: '/projects', method: 'GET' });
  return projectsResponseSchema.parse(response);
};

export function useProjects() {
  return useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
}
