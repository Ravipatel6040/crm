import { useMemo, useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Table, Tr, Td, Badge, FilterSelect, SearchBar, EmptyState, Avatar } from "../../components/common";
import { activityLogs, users } from "../../services/mockData";

const modules = ["Lead", "Client", "Project", "Task", "Invoice", "Campaign"];

export default function ActivityLogs() {
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  const filtered = useMemo(() => activityLogs.filter((a) => {
    const matchesSearch = !search || a.description.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase());
    const matchesUser = !userFilter || a.user === userFilter;
    const matchesModule = !moduleFilter || a.module.toLowerCase().includes(moduleFilter.toLowerCase());
    return matchesSearch && matchesUser && matchesModule;
  }), [search, userFilter, moduleFilter]);

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="Full audit trail of actions across your team" />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search activity..." className="flex-1" />
          <div className="flex gap-3">
            <FilterSelect value={userFilter} onChange={setUserFilter} options={users.map((u) => u.name)} label="All Users" />
            <FilterSelect value={moduleFilter} onChange={setModuleFilter} options={modules} label="All Modules" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No activity found" />
        ) : (
          <Table columns={["User", "Action", "Module", "Description", "Date", "Time"]}>
            {filtered.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={a.user} size="sm" />
                    <span className="font-medium text-slate-700">{a.user}</span>
                  </div>
                </Td>
                <Td><Badge tone="primary">{a.action}</Badge></Td>
                <Td className="text-slate-500">{a.module}</Td>
                <Td>{a.description}</Td>
                <Td>{a.date}</Td>
                <Td>{a.time}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
