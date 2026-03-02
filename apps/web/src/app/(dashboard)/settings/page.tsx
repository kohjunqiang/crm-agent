import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KnowledgeBaseManager } from '@/components/settings/KnowledgeBaseManager';
import { AgentPersonaEditor } from '@/components/settings/AgentPersonaEditor';
import { ChannelConfig } from '@/components/settings/ChannelConfig';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
          <CardDescription>
            Add information your AI agent can reference when responding to
            customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KnowledgeBaseManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Persona</CardTitle>
          <CardDescription>
            Configure your AI agent&apos;s personality and behavior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentPersonaEditor />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channel Configuration</CardTitle>
          <CardDescription>
            Manage your messaging channel connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChannelConfig />
        </CardContent>
      </Card>
    </div>
  );
}
