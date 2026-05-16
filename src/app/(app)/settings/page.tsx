import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="container mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your preferences and application settings
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
