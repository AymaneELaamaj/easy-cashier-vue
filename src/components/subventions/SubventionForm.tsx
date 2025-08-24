import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubventionDTO } from "@/types/entities";
import { useQuery } from "@tanstack/react-query";
import { articlesAPI } from "@/services/api/articles.api";
import { categorieEmployesAPI } from "@/services/api/categorie-employes.api";

const schema = z.object({
  taux: z.coerce.number().min(0).max(100, "Max 100%"),
  articleId: z.coerce.number().int().positive("Article requis"),
  plafondJour: z.coerce.number().min(0),
  plafondSemaine: z.coerce.number().min(0),
  plafondMois: z.coerce.number().min(0),
  actif: z.boolean(),
  categorieEmployesId: z.coerce.number().int().positive("Catégorie requise"),
});
export type SubventionFormValues = z.infer<typeof schema>;

type Lite = { id: number; libelle?: string; name?: string; designation?: string; code?: string };
const labelOf = (o: Lite) => o.libelle ?? o.designation ?? o.name ?? o.code ?? `#${o.id}`;

export function SubventionForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Enregistrer",
}: {
  defaultValues?: Partial<SubventionDTO>;
  onSubmit: (values: SubventionFormValues) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<SubventionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      taux: 10,
      articleId: defaultValues?.articleId ?? 0,
      plafondJour: 0,
      plafondSemaine: 0,
      plafondMois: 0,
      actif: true,
      categorieEmployesId: defaultValues?.categorieEmployesId ?? 0,
      ...defaultValues,
    },
  });

  // Fetch listes
  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ["articles", "lite"],
    queryFn: articlesAPI.getAllLite,
    staleTime: 5 * 60 * 1000,
  });
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categoriesEmployes", "lite"],
    queryFn: categorieEmployesAPI.getAllLite,
    staleTime: 5 * 60 * 1000,
  });

  const actif = watch("actif");
  const articleId = watch("articleId");
  const categorieEmployesId = watch("categorieEmployesId");

  useEffect(() => {
    if (defaultValues) {
      reset({
        taux: defaultValues.taux ?? 10,
        articleId: defaultValues.articleId ?? 0,
        plafondJour: defaultValues.plafondJour ?? 0,
        plafondSemaine: defaultValues.plafondSemaine ?? 0,
        plafondMois: defaultValues.plafondMois ?? 0,
        actif: defaultValues.actif ?? true,
        categorieEmployesId: defaultValues.categorieEmployesId ?? 0,
      });
    }
  }, [defaultValues, reset]);

  const articleOptions = useMemo(() => articles, [articles]);
  const categorieOptions = useMemo(() => categories, [categories]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Taux */}
        <div>
          <Label>Taux (%)</Label>
          <Input type="number" step="0.1" {...register("taux")} />
          {errors.taux && <p className="text-sm text-red-500">{errors.taux.message}</p>}
        </div>

        {/* Article (dropdown) */}
        <div>
          <Label>Article</Label>
          <Select
            value={articleId ? String(articleId) : ""}
            onValueChange={(v) => setValue("articleId", Number(v), { shouldValidate: true })}
            disabled={loadingArticles}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingArticles ? "Chargement..." : "Sélectionner un article"} />
            </SelectTrigger>
            <SelectContent>
              {articleOptions.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.nom || labelOf(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.articleId && <p className="text-sm text-red-500">{errors.articleId.message}</p>}
        </div>

        {/* Plafonds */}
        <div>
          <Label>Plafond Jour</Label>
          <Input type="number" step="0.01" {...register("plafondJour")} />
          {errors.plafondJour && <p className="text-sm text-red-500">{errors.plafondJour.message}</p>}
        </div>
        <div>
          <Label>Plafond Semaine</Label>
          <Input type="number" step="0.01" {...register("plafondSemaine")} />
          {errors.plafondSemaine && <p className="text-sm text-red-500">{errors.plafondSemaine.message}</p>}
        </div>
        <div>
          <Label>Plafond Mois</Label>
          <Input type="number" step="0.01" {...register("plafondMois")} />
          {errors.plafondMois && <p className="text-sm text-red-500">{errors.plafondMois.message}</p>}
        </div>

        {/* Catégorie (dropdown) */}
        <div>
          <Label>Catégorie Employés</Label>
          <Select
            value={categorieEmployesId ? String(categorieEmployesId) : ""}
            onValueChange={(v) => setValue("categorieEmployesId", Number(v), { shouldValidate: true })}
            disabled={loadingCategories}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingCategories ? "Chargement..." : "Sélectionner une catégorie"} />
            </SelectTrigger>
            <SelectContent>
              {categorieOptions.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.cadre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categorieEmployesId && <p className="text-sm text-red-500">{errors.categorieEmployesId.message}</p>}
        </div>

        {/* Actif */}
        <div className="flex items-center space-x-2 mt-2">
          <Switch checked={actif} onCheckedChange={(v) => setValue("actif", v)} id="actif" />
          <Label htmlFor="actif">Actif</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
