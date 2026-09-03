import { useState } from "react";
import { useGetLeadActivitiesQuery, useCreateLeadActivityMutation, useUpdateLeadActivityMutation, useDeleteLeadActivityMutation } from "../../store/api/apiSlice";
import { Button, Avatar, useToast, ConfirmDialog } from "../common";
import { formatDate } from "../../utils/format";
import { Phone, Mail, Calendar, StickyNote, Settings, Loader2, Edit2, Trash2, X, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const activityConfig = {
  Call: { icon: Phone, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
  Email: { icon: Mail, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/30" },
  Meeting: { icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  Note: { icon: StickyNote, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/30" },
  System: { icon: Settings, color: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
};

export default function LeadTimeline({ leadId }) {
  const toast = useToast();
  const { user } = useAuth();
  const { data, isLoading, isError } = useGetLeadActivitiesQuery(leadId, { skip: !leadId });
  const [createActivity, { isLoading: isCreating }] = useCreateLeadActivityMutation();
  const [updateActivity] = useUpdateLeadActivityMutation();
  const [deleteActivity] = useDeleteLeadActivityMutation();

  const [activeType, setActiveType] = useState("Note");
  const [content, setContent] = useState("");
  
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const activities = data?.data || [];

  const handleCreate = async () => {
    if (!content.trim()) return;
    try {
      await createActivity({ id: leadId, type: activeType, content }).unwrap();
      setContent("");
      toast?.push("Activity logged successfully", "success");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to log activity", "error");
    }
  };

  const handleUpdateActivity = async (activityId) => {
    if (!editContent.trim()) return;
    try {
      await updateActivity({ id: leadId, activityId, content: editContent }).unwrap();
      setEditingId(null);
      toast?.push("Activity updated successfully", "success");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to update activity", "error");
    }
  };

  const handleDeleteActivity = async (activityId) => {
    setIsDeletingId(activityId);
    try {
      await deleteActivity({ id: leadId, activityId }).unwrap();
      toast?.push("Activity deleted successfully", "success");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to delete activity", "error");
    } finally {
      setIsDeletingId(null);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
      {/* Compose Box */}
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
          {["Note", "Call", "Email", "Meeting"].map((type) => {
            const Config = activityConfig[type];
            const Icon = Config.icon;
            const isActive = activeType === type;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                  isActive
                    ? `${Config.bg} ${Config.color} border-transparent`
                    : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <Icon size={14} />
                {type}
              </button>
            );
          })}
        </div>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Log a new ${activeType.toLowerCase()}...`}
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none h-20 transition-all"
        />
        
        <div className="flex justify-end mt-3">
          <Button 
            onClick={handleCreate} 
            disabled={!content.trim() || isCreating}
            size="sm"
          >
            {isCreating ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Log {activeType}
          </Button>
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-slate-300 dark:text-slate-600" />
          </div>
        ) : isError ? (
          <div className="text-center text-sm text-rose-500 py-8">Failed to load timeline</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">No activities recorded yet.</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 dark:border-slate-700 ml-4 space-y-6">
            {activities.map((activity) => {
              const Conf = activityConfig[activity.type] || activityConfig.System;
              const Icon = Conf.icon;
              const canEdit = activity.type !== 'System' && (activity.createdBy?._id === user?._id || activity.createdBy?.id === user?.id || user?.role === 'ADMIN');
              
              return (
                <div key={activity._id || activity.id} className="relative pl-6">
                  {/* Timeline Node */}
                  <div className={`absolute -left-3 top-1 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-slate-50 dark:ring-slate-900 ${Conf.bg} ${Conf.color}`}>
                    <Icon size={12} />
                  </div>
                  
                  {/* Content Bubble */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-700/60 group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={activity.createdBy?.name || "System"} size="sm" className="h-5 w-5 text-[10px]" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {activity.createdBy?.name || "System"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {activity.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEdit && editingId !== (activity._id || activity.id) && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button 
                              onClick={() => { setEditingId(activity._id || activity.id); setEditContent(activity.content); }}
                              className="p-1 text-slate-400 hover:text-primary-500 rounded transition-colors"
                              title="Edit activity"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => setDeleteTargetId(activity._id || activity.id)}
                              disabled={isDeletingId === (activity._id || activity.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors disabled:opacity-50"
                              title="Delete activity"
                            >
                              {isDeletingId === (activity._id || activity.id) ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {editingId === (activity._id || activity.id) ? (
                      <div className="mt-2 animate-in fade-in zoom-in-95 duration-200">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-1 mt-2">
                          <button 
                            onClick={() => setEditingId(null)} 
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                          >
                            <X size={12} /> Cancel
                          </button>
                          <button 
                            onClick={() => handleUpdateActivity(activity._id || activity.id)} 
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors shadow-sm"
                          >
                            <Check size={12} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-sm ${activity.type === 'System' ? 'text-slate-500 italic' : 'text-slate-700 dark:text-slate-300'} whitespace-pre-wrap`}>
                        {activity.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => handleDeleteActivity(deleteTargetId)}
        title="Delete Activity?"
        description="Are you sure you want to delete this activity? This action cannot be undone."
      />
    </div>
  );
}
