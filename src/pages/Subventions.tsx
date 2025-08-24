// pages/Subventions.tsx
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useSubventions } from "@/hooks/useSubventions";
import { SubventionDTO } from "@/types/entities";
import { Search, Plus, Percent, Clock, DollarSign } from "lucide-react";
import { CreateSubventionModal } from "@/components/subventions/CreateSubventionModal";
import { EditSubventionModal } from "@/components/subventions/EditSubventionModal";
import { DeleteSubventionModal } from "@/components/subventions/DeleteSubventionModal";

export default function Subventions() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSubvention, setSelectedSubvention] = useState<SubventionDTO | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: subventionsPage, isLoading, error } = useSubventions({ page, size: pageSize });
  const subventions = subventionsPage?.content ?? [];

  const filteredSubventions = useMemo(() => {
    const q = (search ?? "").trim();
    if (!q) return subventions;
    return subventions.filter((s) =>
      [s.taux, s.articleId, s.categorieEmployesId]
        .map((v) => (v ?? "").toString())
        .some((txt) => txt.includes(q))
    );
  }, [search, subventions]);

  const getStatusColor = (actif: boolean) => (actif ? "default" : "secondary");

  const columns = [
    {
      key: "articleId",
      header: "Article ID",
      render: (_: any, s: SubventionDTO) => <div className="font-medium">#{s.articleId}</div>,
    },
    {
      key: "categorieEmployesId",
      header: "Catégorie Employés",
      render: (_: any, s: SubventionDTO) => <div className="text-sm">#{s.categorieEmployesId}</div>,
    },
    {
      key: "taux",
      header: "Taux",
      render: (_: any, s: SubventionDTO) => <div className="font-medium text-success">{s.taux}%</div>,
    },
    {
      key: "plafondJour",
      header: "Plafond Jour",
      render: (_: any, s: SubventionDTO) => (
        <div className="text-sm">
          {(s.plafondJour ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "MAD" })}
        </div>
      ),
    },
    {
      key: "plafondSemaine",
      header: "Plafond Semaine",
      render: (_: any, s: SubventionDTO) => (
        <div className="text-sm">
          {(s.plafondSemaine ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "MAD" })}
        </div>
      ),
    },
    {
      key: "plafondMois",
      header: "Plafond Mois",
      render: (_: any, s: SubventionDTO) => (
        <div className="text-sm">
          {(s.plafondMois ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "MAD" })}
        </div>
      ),
    },
    {
      key: "actif",
      header: "Statut",
      render: (_: any, s: SubventionDTO) => (
        <Badge variant={getStatusColor(!!s.actif)}>{s.actif ? "Actif" : "Inactif"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, s: SubventionDTO) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => { setSelectedSubvention(s); setShowEditModal(true); }}>
            Modifier
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSelectedSubvention(s); setShowDeleteModal(true); }}>
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  const moyenneTaux =
    filteredSubventions.length > 0
      ? filteredSubventions.reduce((sum, s) => sum + (s.taux ?? 0), 0) / filteredSubventions.length
      : 0;

  const totalPlafondMois = filteredSubventions.reduce((sum, s) => sum + (s.plafondMois ?? 0), 0);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subventions</h1>
          <p className="text-muted-foreground">Gérez les subventions et plafonds de votre système.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Subvention
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subventions</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subventionsPage?.totalElements ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredSubventions.filter((s) => !!s.actif).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Moyen</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moyenneTaux.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plafond Total Mensuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPlafondMois.toLocaleString("fr-FR", { style: "currency", currency: "MAD" })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des subventions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Subventions</CardTitle>
          <CardDescription>Gérez toutes vos subventions et leurs plafonds.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSubventions}
            pagination={{
              page,
              size: pageSize,
              total: subventionsPage?.totalElements ?? 0,
              onPageChange: setPage,
              onSizeChange: setPageSize,
            }}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateSubventionModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <EditSubventionModal open={showEditModal} onClose={() => setShowEditModal(false)} subvention={selectedSubvention} />
      <DeleteSubventionModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} subvention={selectedSubvention} />
    </div>
  );
}
