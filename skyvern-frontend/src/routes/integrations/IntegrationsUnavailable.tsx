import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function IntegrationsUnavailable() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Third-party integrations are available in Argide Cloud.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          <p>
            Connect your Google account and other providers in Argide Cloud.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export { IntegrationsUnavailable };
