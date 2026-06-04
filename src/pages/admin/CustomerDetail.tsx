import { AdminLayout } from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { Users } from "lucide-react";

export default function CustomerDetail() {
  return (
    <AdminLayout>
      <main className="container py-6 sm:py-10 space-y-6">
        <PageHeader
          title="Detail Pelanggan"
          subtitle="Fitur dalam pengembangan"
          backTo="/admin/customers"
        />

        <div className="surface-card border border-border/60 rounded-2xl p-8 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h3 className="font-display font-bold text-xl mb-2">Detail Pelanggan</h3>
          <p className="text-muted-foreground">Fitur dalam pengembangan</p>
        </div>
      </main>
    </AdminLayout>
  );
}