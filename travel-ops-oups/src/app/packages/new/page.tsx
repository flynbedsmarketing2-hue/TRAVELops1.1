'use client';

import AuthGuard from "../../../components/AuthGuard";
import { PackageEditor } from "../../../components/PackageEditor";

export default function NewPackagePage() {
  return (
    <AuthGuard allowRoles={["administrator", "travel_designer"]}>
      <PackageEditor mode="create" />
    </AuthGuard>
  );
}

