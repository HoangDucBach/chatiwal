// Import Zod library
import { z } from 'zod';

// Define the schema for Metadata Group
export const MetadataGroupSchema = z.object({
    name: z.string().min(1, { message: "Name cannot be empty." }).optional(),
    description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).optional(),
    tags: z.array(z.string()).optional(),
});

export type MetadataGroup = z.infer<typeof MetadataGroupSchema>;