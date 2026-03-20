'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeBaseManager } from '@/components/settings/KnowledgeBaseManager';
import { AgentPersonaEditor } from '@/components/settings/AgentPersonaEditor';
import { ChannelConfig } from '@/components/settings/ChannelConfig';

export default function SettingsPage() {
  return (
    <Tabs defaultValue="knowledge" className="flex flex-col gap-4">
      <TabsList className="w-fit">
        <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        <TabsTrigger value="persona">Agent Persona</TabsTrigger>
        <TabsTrigger value="channels">Channels</TabsTrigger>
      </TabsList>

      <TabsContent value="knowledge" className="mt-0">
        <p className="mb-4 text-sm text-muted-foreground">
          Add information your AI agent can reference when responding to customers.
        </p>
        <KnowledgeBaseManager />
      </TabsContent>

      <TabsContent value="persona" className="mt-0">
        <p className="mb-4 text-sm text-muted-foreground">
          Configure your AI agent&apos;s personality and behavior.
        </p>
        <AgentPersonaEditor />
      </TabsContent>

      <TabsContent value="channels" className="mt-0">
        <p className="mb-4 text-sm text-muted-foreground">
          Manage your messaging channel connections.
        </p>
        <ChannelConfig />
      </TabsContent>
    </Tabs>
  );
}
