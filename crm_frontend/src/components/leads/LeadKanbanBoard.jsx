import { pipelineStages } from "../../services/mockData";
import { formatCurrency, formatDate } from "../../utils/format";
import { Avatar } from "../common";
import { Mail, Phone, Calendar, DollarSign } from "lucide-react";

export default function LeadKanbanBoard({ leads, onStatusChange, setViewing }) {
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      const lead = leads.find((l) => (l.id || l._id) === leadId);
      if (lead && lead.status !== stage) {
        onStatusChange(lead, stage);
      }
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x h-full min-h-[600px] w-full">
      {pipelineStages.map((stage) => {
        const stageLeads = leads.filter((l) => l.status === stage);
        return (
          <div
            key={stage}
            className="flex-shrink-0 w-72 sm:w-80 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 snap-start flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="flex justify-between items-center mb-3 px-1">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                {stage}
                <span className="text-xs font-medium bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500">
                  {stageLeads.length}
                </span>
              </h4>
              <p className="text-xs font-semibold text-slate-400">
                {formatCurrency(stageLeads.reduce((acc, l) => acc + (l.budget || 0), 0))}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id || lead._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id || lead._id)}
                  onClick={() => setViewing(lead)}
                  className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:border-primary-200 dark:hover:border-primary-900/50 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={lead.name} size="xs" className="h-6 w-6 text-[10px]" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                          {lead.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{lead.company}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {lead.email && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Phone size={12} className="shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <DollarSign size={12} className="text-emerald-500" />
                      {formatCurrency(lead.budget)}
                    </div>
                    {lead.nextFollowUp && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                        <Calendar size={10} />
                        {formatDate(lead.nextFollowUp)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {stageLeads.length === 0 && (
                <div className="h-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-xs font-medium text-slate-400">
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
