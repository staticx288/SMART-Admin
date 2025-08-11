import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const nodes = pgTable("nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'raspberry_pi' | 'ai_server' | 'edge_device'
  ipAddress: text("ip_address").notNull(),
  sshPort: integer("ssh_port").default(22),
  capabilities: text("capabilities").array(),
  resources: jsonb("resources").$type<{
    cpuCores: number;
    ramGb: number;
    storageGb: number;
  }>(),
  status: text("status").notNull().default('offline'), // 'online' | 'offline' | 'error'
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: text("version"),
  path: text("path").notNull(),
  type: text("type").notNull(), // 'ai' | 'core' | 'system'
  description: text("description"),
  configuration: jsonb("configuration"),
  status: text("status").default('discovered'), // 'discovered' | 'loaded' | 'error'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const deployments = pgTable("deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: text("module_id").references(() => modules.id).notNull(),
  nodeId: text("node_id").references(() => nodes.id).notNull(),
  status: text("status").notNull().default('deploying'), // 'deploying' | 'deployed' | 'failed' | 'stopped'
  configuration: jsonb("configuration"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert schemas
export const insertNodeSchema = createInsertSchema(nodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDeploymentSchema = createInsertSchema(deployments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deployedAt: true
});

// Types
export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;

export type SystemStatus = {
  totalNodes: number;
  onlineNodes: number;
  totalModules: number;
  activeDeployments: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  cpuUsage: number;
  failedDeployments: number;
};
