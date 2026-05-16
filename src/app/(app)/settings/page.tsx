import { SettingsForm } from "@/components/settings/settings-form";
import { APP_PAGE_CLASS } from "@/lib/layout";

export default function SettingsPage() {
  return (
    <div className={APP_PAGE_CLASS}>
      <SettingsForm />
    </div>
  );
}
