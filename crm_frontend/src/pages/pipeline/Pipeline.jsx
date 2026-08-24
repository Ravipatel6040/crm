import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import DealCard from "../../components/pipeline/DealCard";
import { leads as initialLeads, pipelineStages } from "../../services/mockData";
import { useToast } from "../../components/common";
import { classNames } from "../../utils/format";

const stageAccent = {
  "New Lead": "border-t-sky-400",
  Contacted: "border-t-violet-400",
  Qualified: "border-t-amber-400",
  Meeting: "border-t-primary-400",
  "Proposal Sent": "border-t-primary-500",
  Negotiation: "border-t-amber-500",
  Won: "border-t-emerald-500",
  Lost: "border-t-red-400",
};

export default function Pipeline() {
  const [deals, setDeals] = useState(initialLeads);
  const [dragOverStage, setDragOverStage] = useState(null);
  const toast = useToast();

  const onDragStart = (e, id) => e.dataTransfer.setData("dealId", id);

  const onDrop = (e, stage) => {
    const id = e.dataTransfer.getData("dealId");
    setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, status: stage } : d)));
    setDragOverStage(null);
    toast?.push(`Deal moved to ${stage}`, "success");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)]">
      <PageHeader title="Sales Pipeline" subtitle="Drag deals across stages to update their status" />

      <div className="flex-1 overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
          {pipelineStages.map((stage) => {
            const stageDeals = deals.filter((d) => d.status === stage);
            const value = stageDeals.reduce((s, d) => s + (d.budget || 0), 0);
            return (
              <div
                key={stage}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => onDrop(e, stage)}
                className={classNames(
                  "w-[280px] shrink-0 flex flex-col rounded-2xl bg-slate-100/60 border-t-4",
                  stageAccent[stage] || "border-t-slate-300",
                  dragOverStage === stage && "ring-2 ring-primary-300 bg-primary-50/50"
                )}
              >
                <div className="px-3.5 pt-3.5 pb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{stage}</p>
                  <span className="text-xs font-medium text-slate-400 bg-white rounded-full px-2 py-0.5">
                    {stageDeals.length}
                  </span>
                </div>
                <p className="px-3.5 text-xs text-slate-400 mb-3">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0, notation: "compact" }).format(value)}
                </p>
                <div className="flex-1 overflow-y-auto px-3.5 pb-3.5 flex flex-col gap-3 no-scrollbar min-h-[120px]">
                  {stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onDragStart={onDragStart} onClick={() => {}} />
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-300 border-2 border-dashed border-slate-200 rounded-xl py-8">
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
